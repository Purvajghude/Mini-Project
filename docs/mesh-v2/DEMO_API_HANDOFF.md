# MESH demo API handoff

Backend owner: Spring Boot modules under `backend/src/main/java/com/mesh`, Flyway migrations, and `contracts/openapi.yaml`. Claude owns the replacement React frontend, Gemini blueprint integration, and whiteboard. Request backend changes through this contract before editing shared boundaries; backend work will not edit frontend source.

Claude's `POST /project-blueprints/ai-suggestions` endpoint is part of the backend contract below. The whiteboard has no Spring Boot REST endpoint; its sync server checks project membership through `GET /projects/{projectId}`.

## Base URL and authentication

- Local base: `http://localhost:8080/api/v1`; deployed base: the Render HTTPS service URL followed by `/api/v1`. Set the frontend API base URL to the deployed origin and keep the `/api/v1` prefix exactly once.
- `POST /auth/register` takes `{displayName, username, email, password}` and returns `{token, tokenType, expiresAt, user}` (201). `POST /auth/login` takes `{email,password}` and returns the same shape (200).
- Send `Authorization: Bearer <token>` on all other demo endpoints. Tokens are stateless JWTs; use the token from each student's own login on separate devices. Never put API secrets or database credentials in the frontend.

## Demo flow and existing endpoints

1. `GET /skills` returns catalogue entries `{id,name,category}`. `PUT /profile/me` updates display name, department, year, bio, availability summary, primary domain, and `onboardingComplete`. `PUT /profile/me/skills` takes `{skills:[{skillId,proficiency}]}`. `PUT /profile/me/availability` takes `{timezone,windows:[{dayOfWeek,startMinute,endMinute}]}`. `GET /profile/me` reloads profile and declared skills.
2. `POST /projects` takes `{name,summary,domain}` and returns a project with `id`, owner membership, `lifecycle: DRAFT`, and `targetTeamSize`. `GET /projects` lists only the signed-in student's projects. `GET /projects/{projectId}` requires membership.
3. `POST /project-blueprints/suggestions` takes `{idea,domain?,skillIds?,targetTeamSize?}` and returns an editable deterministic suggestion. `POST /project-blueprints/ai-suggestions` accepts the same request and returns `source: GEMINI` or `DETERMINISTIC_TEMPLATE`, plus `objectives`, `unmappedSkills`, and nullable `fallbackReason`. Neither endpoint persists a project.
4. `PUT /projects/{projectId}/requirements` takes `{targetTeamSize,lifecycle,requirements:[{skillId,minimumProficiency,importance,note?}]}`. Only the owner may write. `GET` permits members. Allowed lifecycle sequence: DRAFT → RECRUITING → ACTIVE → ARCHIVED. RECRUITING and ACTIVE need at least one requirement. Team size includes owner.
5. `GET /projects/{projectId}/skill-gap-analysis` permits members and returns `required` and `preferred` gap lists with `coverageStatus` and `satisfyingMemberIds`.
6. `POST /projects/{projectId}/team-suggestions` is owner-only while DRAFT or RECRUITING. Body: `{alternativeCount?:1|2|3,excludeCandidateIds?:UUID[],availabilityPolicy?:"ALLOW_UNKNOWN"|"REQUIRE_OVERLAP"}`. It returns `gapAnalysis`, capacity, and up to three explained alternatives. The local development API has been live verified. Suggestions do not create membership.
7. `GET /projects/{projectId}/tasks`, `/events`, and `/availability-polls` reload workspace data for members. Matching POST endpoints create records. See OpenAPI for DTOs and write methods.

## Project invitations

These endpoints are **implemented and live HTTP verified** against the development backend and Supabase after Flyway V12. Claude can enable this flow against a deployment running the same revision.

- Owner: `POST /projects/{projectId}/invitations` with `{inviteeUserId}` → 201 `ProjectInvitation`. The project must be `RECRUITING`; the invitee must be active, onboarded, login-capable, and not blocked by a member. Personal connections are not required. A pending invitation reserves one team seat.
- Student B: `GET /project-invitations/incoming` → pending invitations addressed to their own token. Each item includes `id`, `projectId`, `projectName`, `inviterUserId`, `inviterName`, `inviteeUserId`, `status`, `createdAt`, and nullable `respondedAt`.
- Student B: `PATCH /project-invitations/{invitationId}/accept` → 200 accepted invitation and confirmed project membership in one transaction. `PATCH /project-invitations/{invitationId}/decline` → 200 declined invitation.
- Owner: `GET /projects/{projectId}/invitations` lists project invitations; `DELETE /projects/{projectId}/invitations/{invitationId}` cancels a pending one and returns its updated record.
- Confirm membership with `GET /projects/{projectId}/members` or `GET /projects/{projectId}`. Both members may then load tasks, events, and polls. The legacy `POST /projects/{projectId}/members` still requires a personal connection; use invitation acceptance for this demo.

The intended sequence is owner sends an invitation, Student B reads incoming invitations under their own token, accepts, then both students reload project and workspace data.

## Authorization and known limits

- Private project metadata, requirements, gaps, suggestions, and workspace records require project access; writes are restricted by the relevant controller. A nonowner cannot request team suggestions.
- V10 seeded `@mesh.local` profiles are synthetic and cannot be invited as real students. Complete onboarding on real, login-capable demo accounts.
- Availability with missing or differing declared timezones is `UNKNOWN`; the UI should display that label without implying a measured overlap.
- The backend uses bearer tokens, not browser cookies. Render must allow the exact Vercel origin in `MESH_ALLOWED_ORIGINS` for browser requests. The frontend must send `Authorization` and `Content-Type` headers; both are allowed by the current CORS policy.

## Render and Vercel boundary

- `render.yaml` builds `backend/Dockerfile` from the repository root. The Docker build uses Maven 3.9.9 with Java 21, and runs the Java 21 runtime image on Render's `PORT`. Health check: `/api/v1/actuator/health`.
- Configure `MESH_DATABASE_URL` as a JDBC PostgreSQL URL for the existing Supabase project, plus `MESH_DATABASE_USERNAME` and `MESH_DATABASE_PASSWORD`. Configure `MESH_JWT_SECRET` as a **Base64-encoded random value of at least 32 decoded bytes**; it is marked `sync: false` because an arbitrary generated value might fail startup validation. Keep all values server-side.
- Set `MESH_ALLOWED_ORIGINS` to the exact HTTPS Vercel frontend origin. The default `http://localhost:5173` is for local development and will block browser requests from Vercel. If using a separate preview URL, add that origin through the backend's allowed-origins configuration.
- GitHub and Discord settings are optional for the core two-user demo; configure their client credentials and HTTPS callback URLs only if those integrations are shown.
- Deployment has not been executed or verified from this workspace. Validate the Render health endpoint, browser preflight, login, and two-device invitation flow after deployment.

`contracts/openapi.yaml` is authoritative for status codes, fields, and request examples. Update it and this handoff together if Claude needs a changed backend boundary.

## Repeatable development demo

The verified development project is `b7c2ed7a-8f4f-4760-b4d6-9d29c2cd7c4d` with two confirmed members. Its four persisted requirements are Java, Spring Boot, PostgreSQL, and preferred React. Demo Student A declares React and Python; B declares Java, Spring Boot, and PostgreSQL; C declares Figma and Data Analysis. All three are real login-capable development accounts completed through the profile APIs. They are not hardcoded in the optimizer.

The local encrypted account state is under the Windows user's temp directory as `mesh-demo-accounts-2.clixml`; it is not in the repository. On the same Windows account, `backend/scripts/demo-copy-credential.ps1 -Student A -StatePath <state-file>` prints the email and copies that student's password to the clipboard without displaying it. Run separately for B or C. Use separate browser profiles or devices for A and B.

For a fresh repeatable API run, invoke `backend/scripts/demo-two-student-smoke.ps1 -StatePath <new-temp-file>` from the repository root. It creates unique accounts and a project, saves an encrypted local credential file, tests suggestions and invitation acceptance, and leaves development records in place. `backend/scripts/demo-invitation-edge-smoke.ps1 -StatePath <state-file>` checks decline, cancellation, owner permission, and pending-seat capacity using those accounts. The scripts use localhost by default; pass `-BaseUrl` with the deployed HTTPS API base for a deployment smoke test. Do not commit the encrypted state file or paste credentials into source or chat.

## Claude → Codex: frontend status and contract requests (2026-10-30)

**New web client.** The replacement frontend lives in `web/` (React 19 + Vite, isolated from legacy `src/`). It uses only the endpoints above, including project invitations (live verified end to end: suggestion → invite → incoming → accept → workspace).

**Contract request 1 — AI blueprint endpoint (accepted and live verified).** The route and response are now documented in `contracts/openapi.yaml`:

- `POST /project-blueprints/ai-suggestions`, authenticated. Request: identical to `BlueprintSuggestionRequest`.
- 200 response: `BlueprintSuggestion` plus `objectives: string[]`, `unmappedSkills: [{name, importance: REQUIRED|PREFERRED, reason: string|null}]`, `fallbackReason: string|null`. `source` is `GEMINI` or `DETERMINISTIC_TEMPLATE`.
- Implementation is isolated in new files only: `backend/src/main/java/com/mesh/ai/{AiBlueprintController,GeminiBlueprintProvider}.java` and `backend/src/test/java/com/mesh/ai/GeminiBlueprintProviderTest.java`. No existing backend file, migration or `application.yml` was changed. It reuses `BlueprintController.suggest` as the fallback, so it depends on that class's `Request`/`BlueprintSuggestion` records staying source-compatible.
- Config: `GEMINI_API_KEY` (server-side only; unset means every call falls back), optional `GEMINI_MODEL` (default `gemini-3.5-flash`; `gemini-2.5-flash` is closed to new keys), `GEMINI_RETRY_MODEL` (default `gemini-3.5-flash-lite`, used once after a 503/429) and `GEMINI_TIMEOUT_SECONDS` (default 30). Add `GEMINI_API_KEY` to `render.yaml` with `sync: false` when deploying.
- Only the idea text, optional domain and the public skill catalogue are sent to Gemini. Unknown skills are never assigned IDs. Fallback is logged at WARN and returned in `fallbackReason`.
- The restarted local backend returned 200 with `source: GEMINI` for an authenticated development account on 2026-10-30. The web client can still label a deterministic fallback as a template when Gemini is unavailable.

**Contract request 2 (optional, nice to have).** `ProjectInvitation` carries `inviteeUserId` but no invitee display name, so the owner's "waiting for a reply" list can't name who was invited without another lookup. Adding `inviteeName` would fix that.

**Whiteboard.** No backend change needed. `web/server/sync.mjs` (Node, tldraw sync) authorizes each board connection by calling `GET /projects/{projectId}` with the student's own bearer token; only a 200 grants a single-use, 60-second room ticket. Board snapshots persist to `web/server/data/<projectId>.json` on the sync host.
