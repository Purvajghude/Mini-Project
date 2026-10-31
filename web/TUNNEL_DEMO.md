# Demo over one Cloudflare Quick Tunnel

Everything runs on this laptop. One temporary `https://<random>.trycloudflare.com` URL points at the
Vite dev server on :5173. Vite proxies `/api` to the API on :8080 and `/sync` (HTTP and WebSocket) to the
board server on :5858, so phones only ever talk to the tunnel URL.

```
phone ──https/wss──▶ trycloudflare ──▶ cloudflared ──▶ Vite :5173 ─┬─ /api  ──▶ Spring Boot :8080 ──▶ Supabase
                                                                   └─ /sync ──▶ sync.mjs :5858 (ws)
```

Nothing about auth changes: the API still checks the JWT and project membership, and the board still
needs a single-use ticket that the sync server only issues after `GET /projects/{id}` succeeds.

## 1. One-time install

```powershell
winget install --id Cloudflare.cloudflared -e
```

Open a new terminal afterwards so `cloudflared` is on `PATH`. No Cloudflare account is needed.

## 2. Start the three services (one PowerShell window each, from the repo root)

API (set `$env:GEMINI_API_KEY` first if you want AI blueprints):

```powershell
cd backend
.\run-local.ps1
```

`run-local.ps1` sets the Supabase URL and username, prompts for the database password, and generates a
temporary JWT secret. It needs the jar built once (`mvn -f .\pom.xml package -DskipTests`). Alternatively
run `mvn spring-boot:run` after setting `MESH_DATABASE_URL`, `MESH_DATABASE_USERNAME`,
`MESH_DATABASE_PASSWORD` and `MESH_JWT_SECRET` in that window (see `backend/README.md`).

Board server:

```powershell
npm run web:sync
```

Web client:

```powershell
npm run web:dev
```

Check http://localhost:5173 opens and you can sign in before going further.

## 3. Start the tunnel

```powershell
cloudflared tunnel --url http://localhost:5173
```

It prints a line like `https://quiet-river-1234.trycloudflare.com`. That is the demo URL. It changes every
time you restart `cloudflared`, and stops working when you close that window.

Use `npm run web:dev`, not a production build: tldraw needs a licence key on non-localhost HTTPS in
production builds, but runs unlicensed in dev mode.

## 4. On the phones

1. Open the tunnel URL on phone A and phone B (not the laptop's `localhost`).
2. Sign in as two different students who are both members of the same project
   (e.g. the owner and someone who accepted their invitation). Each phone keeps its own session.
3. Both open the project and go to **Board**.

## 5. Whiteboard test

1. Phone A draws a shape or adds a note. It appears on phone B within a second.
2. Phone B moves or edits it. A sees the change.
3. Refresh both phones. The board comes back as you left it (saved to `web/server/data/<projectId>.json`).
4. Optional: sign in on the laptop as a student who is not in the project and open the same project.
   They are refused ("You are not a member of this project."), and no board opens.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Blocked request. This host is not allowed." | You opened a host other than `*.trycloudflare.com` or `localhost`. Only those are allowed in `web/vite.config.ts`. |
| "MESH can't reach its server right now." | The API on :8080 is not running, or is still starting. Check its window. |
| Sign-in fails with 403 "Invalid CORS request" | Vite was started before this config existed. Restart `npm run web:dev`. |
| "The board server isn't reachable." | Start `npm run web:sync`. |
| Board shows "Reconnecting…" forever | The WebSocket can't get through. Check the `web:sync` window for errors and that the tunnel is still running. |
| "You are not a member of this project." on the board | That account isn't a member. Accept the invitation first. |
| "Your session has expired." | Sign in again. |
| Port 8080/5858/5173 already in use | An old copy is still running. Close its window, or find it with `Get-NetTCPConnection -LocalPort 8080`. |
| Tunnel URL stopped working | `cloudflared` closed or the network dropped. Restart it and use the new URL. |
| Slow first load on a phone | The dev server sends many small files. Open the page once on each phone before the demo starts. |
| `cloudflared` not found after install | Open a new terminal, or run `& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173`. |

Close the `cloudflared` window when the demo ends. The URL dies with it.
