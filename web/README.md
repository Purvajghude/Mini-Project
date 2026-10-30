# MESH web client

The replacement frontend for MESH: idea → blueprint → skill gap → team → workspace.
It talks only to the Spring Boot API (`/api/v1`) and a small whiteboard sync server (`web/server/sync.mjs`).
The legacy client in `/src` is untouched.

## Run locally

Three processes, from the repository root:

```bash
# 1. API on :8080 (see backend/README.md; needs the Supabase env vars)
# 2. Whiteboard sync server on :5858
npm run web:sync
# 3. Web client on :5173 (proxies /api → :8080 and /sync → :5858)
npm run web:dev
```

Open http://localhost:5173. The API's `MESH_ALLOWED_ORIGINS` default (`http://localhost:5173`) already matches.

Checks: `npm run web:typecheck`, `npm run web:build` (output in `web/dist`).

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | web build | API base when not same-origin, e.g. `https://<render-app>/api/v1`. Default `/api/v1`. |
| `VITE_SYNC_URL` | web build | Sync server origin when not proxied, e.g. `https://<sync-host>`. Default: same origin. |
| `VITE_TLDRAW_LICENSE_KEY` | web build | Required by tldraw on non-localhost HTTPS. Free hobby keys exist for non-commercial projects. |
| `MESH_API` | sync server | API base the sync server uses to check membership. Default `http://localhost:8080/api/v1`. |
| `SYNC_PORT`, `SYNC_DATA_DIR`, `SYNC_ALLOWED_ORIGIN` | sync server | Port, snapshot folder, CORS origin for the ticket endpoint when not proxied. |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_SECONDS` | API (server-side only) | AI blueprints. Without a key every request falls back to the template, labelled as such. |

## Two-student demo

Use two browser profiles (or two devices) so each student has their own session.

1. **Student A** registers, completes onboarding, describes an idea, edits the blueprint, and chooses **Save and find teammates**.
2. **Student B** registers and completes onboarding with skills that fill one of A's open requirements.
3. A opens **Team → Suggest teams**. Option cards explain exactly which requirements each person covers. A presses **Invite to project**.
4. B sees the invitation in their studio and under **People**, and presses **Join project**. They land in the workspace.
5. Both open **Board**: notes, shapes and cursors sync live. Tasks, schedule polls and messages are shared through the API.

## Whiteboard security model

The browser asks the sync server for a ticket with its MESH bearer token. The sync server calls `GET /projects/{id}` with that same token, and only a 200 (project member) yields a single-use ticket valid for 60 seconds. The WebSocket must present that ticket. Board IDs alone grant nothing. Snapshots are written to `web/server/data/<projectId>.json`. On hosts with ephemeral disks (Render free tier), boards reset on redeploy.
