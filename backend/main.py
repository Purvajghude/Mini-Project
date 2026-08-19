"""
Mesh AI Backend — FastAPI app exposing the /pitches endpoint.

Run locally:
  cd backend
  pip install -r requirements.txt
  cp .env.example .env  # fill in your keys
  uvicorn main:app --reload --port 8000
"""

import asyncio
import hashlib
import hmac
import os
from typing import Annotated, Any

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from groq import GroqError
from pydantic import BaseModel, Field, StringConstraints
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from supabase import Client, create_client

import deck as deck_engine
import feed_ai
import integrations
from embeddings import embed_one
import portfolio as portfolio_engine
import push
import skills_api
from engine import generate_pitches

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

_db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Mesh AI Engine", version="0.1.0")

def _rate_limit_key(request: Request) -> str:
    """Rate-limit key: the (hashed) bearer token when present, else client IP.

    Behind Render's proxy every request arrives from the same IP, so IP-only
    keying would pool all users into shared buckets."""
    auth = request.headers.get("authorization")
    if auth:
        return hashlib.sha256(auth.encode()).hexdigest()
    return get_remote_address(request)


# Rate limiting (keyed per user token, falling back to client IP) to protect the
# expensive AI endpoints from spam / cost-abuse. Limits are applied per-endpoint
# via @limiter.limit below.
limiter = Limiter(key_func=_rate_limit_key)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ── Auth ─────────────────────────────────────────────────────────────────────

async def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """Verify the caller's Supabase access token and return the verified user JSON.

    The acting user is ALWAYS derived from the verified token — never from a
    request body. This is the single control that stops one user acting as
    another (the backend holds the RLS-bypassing service-role key). The full
    user object is returned so endpoints can also read verified OAuth
    `identities` (e.g. the GitHub handle) — the uid is `user["id"]`."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Auth check failed") from exc
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = resp.json()
    if not user.get("id"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def _github_handle_from_token(user: dict[str, Any]) -> str | None:
    """The GitHub username from the user's VERIFIED OAuth identities, if any.

    Supabase's /auth/v1/user response carries an `identities` array; a GitHub
    identity holds the handle in identity_data (user_name / preferred_username)."""
    for ident in user.get("identities") or []:
        if ident.get("provider") != "github":
            continue
        data = ident.get("identity_data") or {}
        handle = data.get("user_name") or data.get("preferred_username")
        if handle:
            return str(handle)
    return None


# ── Models ───────────────────────────────────────────────────────────────────
# Note: no model carries user_id — the acting user comes from the token.

class PitchRequest(BaseModel):
    match_id: str
    force_refresh: bool = False


class AddSkillRequest(BaseModel):
    name: str


class CraftRequest(BaseModel):
    skill_ids: list[str]


class ChallengeRequest(BaseModel):
    provider: str


class ConnectRequest(BaseModel):
    provider: str
    handle: str


class PortfolioRequest(BaseModel):
    title: str
    description: str = ""
    # Raw base64 JPEGs — judged then discarded. Bounded so an oversized payload
    # is rejected at validation (422) instead of ballooning memory: at most
    # portfolio._MAX_IMAGES items, each ≤ ~2.8M chars (~2MB of JPEG).
    images_b64: list[Annotated[str, StringConstraints(max_length=2_800_000)]] = Field(
        default=[], max_length=portfolio_engine._MAX_IMAGES
    )
    links: list[str] = []
    capture_mode: str = "upload"    # 'camera' (full XP) | 'upload' (reduced)


class PostActionRequest(BaseModel):
    post_id: str


class NotifyRequest(BaseModel):
    user_ids: list[str]
    title: str
    body: str
    data: dict[str, Any] = {}


# ── Supabase helpers (sync; called via asyncio.to_thread) ────────────────────

def _fetch_profile_with_skills(user_id: str) -> dict[str, Any]:
    # maybe_single: .single() raises an APIError on zero rows (→ opaque 500);
    # this way "no profile" is an actual value we can turn into a 404.
    profile = (
        _db.table("profiles")
        .select("id, username, display_name, vibe_statement")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if profile is None or not profile.data:
        raise ValueError(f"Profile not found: {user_id}")

    skill_rows = (
        _db.table("profile_skills")
        .select("weight, skills(name, category)")
        .eq("profile_id", user_id)
        .execute()
    )
    skills = [
        {"name": row["skills"]["name"], "weight": row["weight"]}
        for row in (skill_rows.data or [])
        if row.get("skills")
    ]
    return {**profile.data, "skills": skills}


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/deck")
@limiter.limit("30/minute")
async def get_deck(
    request: Request, limit: int = 20, user: dict = Depends(current_user)
):
    """The complementarity-ranked swipe deck for the authenticated user.

    Returns profiles ordered by collaboration potential, each with an
    `explanation` (the 'why you're seeing this' chip) and a score `breakdown`.
    """
    uid = user["id"]
    limit = max(1, min(limit, 50))
    try:
        ranked = await asyncio.to_thread(deck_engine.build_deck, _db, uid, limit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"deck": ranked}


@app.get("/search")
@limiter.limit("30/minute")
async def semantic_search(
    request: Request, q: str, user: dict = Depends(current_user)
):
    """Natural-language profile search using skill embeddings (cosine similarity)."""
    import numpy as np

    uid = user["id"]
    q = q.strip()
    if not q:
        return {"results": []}

    qvec = np.array(await asyncio.to_thread(embed_one, q))

    rows = await asyncio.to_thread(
        lambda: _db.table("profiles")
        .select(
            "id, username, display_name, vibe_statement, skill_embedding,"
            " avatar_config, help_karma, helps_count"
        )
        .eq("onboarded", True)
        .neq("id", uid)
        .execute()
        .data
    )

    scored = []
    for r in rows:
        pv = deck_engine._parse_vec(r.get("skill_embedding"))
        if pv is None:
            continue
        sim = float(np.dot(qvec, np.array(pv)))
        scored.append((sim, r))
    scored.sort(key=lambda x: -x[0])

    return {
        "results": [
            {
                "id": r["id"],
                "username": r["username"],
                "display_name": r["display_name"],
                "vibe_statement": r["vibe_statement"],
                "avatar_config": r["avatar_config"],
                "help_karma": r.get("help_karma") or 0,
                "helps_count": r.get("helps_count") or 0,
                "matched_skill": q,
            }
            for sim, r in scored[:20]
            if sim > 0.15
        ]
    }


@app.post("/profile/reembed")
@limiter.limit("5/minute")
async def reembed_profile(request: Request, user: dict = Depends(current_user)):
    """Refresh the caller's skill + profile embeddings.

    Called fire-and-forget after the GitHub onboarding import, which writes
    skills to Supabase directly (client-side) and so skips embed-on-add."""
    return await asyncio.to_thread(skills_api.reembed_profile, _db, user["id"])


@app.post("/profile/skills")
@limiter.limit("20/minute")
async def add_skill(
    request: Request, req: AddSkillRequest, user: dict = Depends(current_user)
):
    """Add any skill to your profile — open vocabulary, embedded on the fly."""
    try:
        skill = await asyncio.to_thread(
            skills_api.add_skill_to_profile, _db, user["id"], req.name
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return skill


@app.post("/craft")
@limiter.limit("10/minute")
async def craft(
    request: Request, req: CraftRequest, user: dict = Depends(current_user)
):
    """Combine two or more of your leveled skills into a compound skill."""
    try:
        result = await asyncio.to_thread(
            skills_api.craft_skill, _db, user["id"], req.skill_ids
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GroqError as exc:
        raise HTTPException(
            status_code=502,
            detail="Skill naming is temporarily unavailable — try again.",
        ) from exc
    return result


@app.get("/skills/{skill_id}/components")
async def get_skill_components(skill_id: str, user: dict = Depends(current_user)):
    """The atomic skills a compound is crafted from (drill-down view)."""
    return await asyncio.to_thread(
        skills_api.skill_components, _db, user["id"], skill_id
    )


@app.get("/integrations/providers")
async def integration_providers():
    """The connectable providers (for the UI to render)."""
    return {"providers": integrations.available_providers()}


@app.get("/integrations")
async def integration_list(user: dict = Depends(current_user)):
    """Your currently connected accounts."""
    rows = await asyncio.to_thread(integrations.list_accounts, _db, user["id"])
    return {"accounts": rows}


@app.post("/integrations/challenge")
async def integration_challenge(req: ChallengeRequest, user: dict = Depends(current_user)):
    """Issue a one-time code to place in your platform profile to prove ownership."""
    try:
        return await asyncio.to_thread(
            integrations.make_challenge, _db, user["id"], req.provider
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/integrations/connect")
@limiter.limit("10/minute")
async def integration_connect(
    request: Request, req: ConnectRequest, user: dict = Depends(current_user)
):
    """Verify ownership, then fetch public stats → award proof-of-skill XP."""
    try:
        result = await asyncio.to_thread(
            integrations.connect_account, _db, user["id"], req.provider, req.handle
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


class GithubOAuthRequest(BaseModel):
    handle: str = ""  # legacy field — ignored; the handle comes from the token


@app.post("/integrations/github/oauth-connect")
@limiter.limit("5/minute")
async def github_oauth_connect(
    request: Request, req: GithubOAuthRequest, user: dict = Depends(current_user)
):
    """Award GitHub XP for the GitHub account linked to the caller's login.

    The handle is derived server-side from the token's verified `github` OAuth
    identity — never from the request body (a body-supplied handle would let
    anyone claim anyone's GitHub XP). `req.handle` is kept only so older
    clients that still send it don't break."""
    handle = _github_handle_from_token(user)
    if not handle:
        raise HTTPException(
            status_code=403,
            detail="No GitHub account is linked to this login — sign in with GitHub first.",
        )
    try:
        result = await asyncio.to_thread(
            integrations.connect_github_oauth, _db, user["id"], handle
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


@app.get("/portfolio")
async def portfolio_list(user: dict = Depends(current_user)):
    """Your portfolio evidence entries."""
    rows = await asyncio.to_thread(portfolio_engine.list_evidence, _db, user["id"])
    return {"evidence": rows}


@app.post("/portfolio/submit")
@limiter.limit("5/minute")
async def portfolio_submit(
    request: Request, req: PortfolioRequest, user: dict = Depends(current_user)
):
    """Submit portfolio evidence → a vision model judges it → awards skill XP."""
    try:
        result = await asyncio.to_thread(
            portfolio_engine.submit_evidence,
            _db, user["id"], req.title, req.description,
            req.images_b64, req.links, req.capture_mode,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GroqError as exc:
        raise HTTPException(
            status_code=502,
            detail="Evidence judging is temporarily unavailable — try again.",
        ) from exc
    return result


@app.post("/asks/ai-answer")
@limiter.limit("15/minute")
async def ask_ai_answer(
    request: Request, req: PostActionRequest, user: dict = Depends(current_user)
):
    """Generate (and store) an instant AI first-pass answer on your ask."""
    try:
        return await asyncio.to_thread(
            feed_ai.generate_ask_answer, _db, req.post_id, user["id"]
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GroqError as exc:
        raise HTTPException(
            status_code=502,
            detail="The AI answer is temporarily unavailable — try again.",
        ) from exc


@app.post("/feed/moderate")
@limiter.limit("30/minute")
async def feed_moderate(
    request: Request, req: PostActionRequest, user: dict = Depends(current_user)
):
    """Quality + safety gate for one of your posts (flag-don't-block, fail-open)."""
    try:
        return await asyncio.to_thread(
            feed_ai.moderate_post, _db, req.post_id, user["id"]
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _check_internal_secret(x_notify_secret: str | None) -> None:
    """Gate for /internal/* endpoints (DB triggers via pg_net, not end users).

    Fails closed when NOTIFY_SECRET is unset; constant-time comparison."""
    secret = os.environ.get("NOTIFY_SECRET")
    if not secret or not hmac.compare_digest(x_notify_secret or "", secret):
        raise HTTPException(status_code=401, detail="bad notify secret")


@app.post("/internal/notify")
async def internal_notify(
    req: NotifyRequest, x_notify_secret: str | None = Header(default=None)
):
    """Send a push to a user. Called by a DB trigger (pg_net), not end users, so
    it's gated by a shared secret rather than a user JWT."""
    _check_internal_secret(x_notify_secret)
    try:
        sent = 0
        for uid in req.user_ids:
            res = await asyncio.to_thread(
                push.send_to_user, _db, uid, req.title, req.body, req.data
            )
            sent += res.get("sent", 0)
        return {"sent": sent, "recipients": len(req.user_ids)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="notify failed") from exc


@app.post("/internal/moderate")
async def internal_moderate(
    req: PostActionRequest, x_notify_secret: str | None = Header(default=None)
):
    """Moderate a post server-side. Called by a DB trigger (pg_net) on insert,
    not end users, so it's gated by the same shared secret as /internal/notify.
    Runs the same flag-don't-block gate as /feed/moderate, minus the ownership
    check (there's no acting user)."""
    _check_internal_secret(x_notify_secret)
    try:
        return await asyncio.to_thread(
            feed_ai.moderate_post, _db, req.post_id, None
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/pitches")
@limiter.limit("10/minute")
async def pitches(
    request: Request, req: PitchRequest, user: dict = Depends(current_user)
):
    uid = user["id"]
    # Verify the caller is actually in this match before doing anything.
    match_resp = await asyncio.to_thread(
        lambda: _db.table("matches")
        .select("id, user_a, user_b")
        .eq("id", req.match_id)
        .maybe_single()
        .execute()
    )
    if match_resp is None or not match_resp.data:
        raise HTTPException(status_code=404, detail="Match not found")
    match = match_resp.data
    if uid not in (match["user_a"], match["user_b"]):
        raise HTTPException(status_code=403, detail="Not a participant in this match")

    # Return latest cached result unless caller wants a fresh roll.
    if not req.force_refresh:
        cached = await asyncio.to_thread(
            lambda: _db.table("collab_pitches")
            .select("pitches")
            .eq("match_id", req.match_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if cached.data:
            return {"pitches": cached.data[0]["pitches"], "cached": True}

    # Fetch both profiles (with skills) in parallel.
    try:
        user_a, user_b = await asyncio.gather(
            asyncio.to_thread(_fetch_profile_with_skills, match["user_a"]),
            asyncio.to_thread(_fetch_profile_with_skills, match["user_b"]),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    # Ask the LLM for 3 pitches — surface provider hiccups / malformed output
    # as a clean 502 (never the raw model response).
    try:
        pitch_list = await generate_pitches(user_a, user_b)
    except (GroqError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Pitch generation is temporarily unavailable — try again.",
        ) from exc

    # Cache — each call creates a new row so re-roll history is preserved.
    await asyncio.to_thread(
        lambda: _db.table("collab_pitches").insert(
            {
                "match_id": req.match_id,
                "user_a_id": match["user_a"],
                "user_b_id": match["user_b"],
                "pitches": pitch_list,
            }
        ).execute()
    )

    return {"pitches": pitch_list, "cached": False}
