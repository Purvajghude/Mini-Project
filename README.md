# MESH — project handoff

Last audited: **28 October 2026**  
Latest commit at audit: `3ca8441 finale`

MESH is a student collaboration platform. It helps students describe what they want to build, surface complementary collaborators, attach limited public GitHub evidence to self-declared skills, form projects, and move team conversation to private Discord rooms.

The product thesis is: **claims about skills should be accompanied by visible evidence, and matching should help students form teams that can actually work together.**

## Live services

| Service | URL | Notes |
| --- | --- | --- |
| Web app | https://mesh-web-demo.vercel.app | Vite SPA deployed on Vercel. |
| API | https://mesh-api-nzii.onrender.com/api/v1 | Spring Boot API deployed on Render. |
| Health check | https://mesh-api-nzii.onrender.com/api/v1/actuator/health | Public API/database readiness endpoint. |
| Repository | https://github.com/Purvajghude/Mini-Project | `main` is the deployment branch. |

The API uses Supabase as managed PostgreSQL through JDBC/Flyway. It does **not** use the Supabase Data API.

## What is built

### Account and onboarding

- Email/password registration and login.
- BCrypt password hashing and stateless JWT authentication.
- A first-run onboarding dialog that captures profile information and self-declared skills.
- Profile editing for display name, department, year, bio, avatar tone, availability, primary domain, and skills.
- Catalogues for skills, goals, interests, primary domains, desired collaborator skills, and weekly availability exist in the backend/API.

### Trust and skill evidence

- Students can manually add skills and a self-assessed proficiency from 1–5.
- GitHub OAuth uses PKCE. After explicit authorization, the server reads the user's owned **public** repositories and their language metadata.
- GitHub access tokens are used server-side during the OAuth exchange and are not persisted.
- A self-declared skill is marked `evidenceSupported` when its normalized name matches a language observed in the connected public repositories.
- Disconnecting GitHub deletes the saved GitHub connection and public-repository evidence.

This is deliberately a supporting signal, not a claim that MESH has verified expertise. LinkedIn is currently only described in the UI as a member-submitted link/certificate; MESH does not scrape LinkedIn or implement LinkedIn OAuth.

### Recommendation and Discover flow

- Discover presents recommended collaborators in a polished card/deck UI.
- Candidates can be passed, saved, or sent a connection request.
- Incoming requests can be accepted or declined. Accepted requests become persistent connections.
- Blocks remove connections from discovery and prevent direct messages while active.
- The production scorer is deterministic and explainable. Its weights are:

| Signal | Weight |
| --- | ---: |
| Shared project/collaboration goals | 35% |
| Candidate coverage of desired skills | 25% |
| GitHub language evidence signal | 15% |
| Weekly availability overlap | 15% |
| Shared interests | 10% |

- Discover aims for 80% candidates from the user's primary domain and 20% from adjacent domains, then fills remaining slots from available matching candidates.
- Flyway migration `V10` seeds 100 synthetic, onboarding-complete discovery profiles with skills, goals, interests, desired skills, and availability. These are demo directory profiles, not accounts that can log in.
- A separate Team Builder component selects a set of needed skills and recommends a smallest team that covers them, including coverage percentage and remaining gaps. This is currently a frontend/mock-oriented component and is not connected to the production project model.

### Connections and communication

- Persistent one-to-one connection request and acceptance flow.
- Persistent connection messages and project group messages are available in the Spring API.
- The current main collaboration UI intentionally directs people to Discord rather than building a full in-app chat product.
- The Connections page shows accepted collaborators, incoming requests, a link to the MESH Discord community, and Discord direct-message/copy-ID actions when the member has an ID available.

### Discord integration

- Discord account linking via OAuth with PKCE and the `identify` scope.
- The server stores the linked Discord user identity, not the OAuth token.
- A project owner can create or synchronize a private Discord text channel from MESH.
- The bot creates the channel in the configured MESH guild, blocks the default guild role from the channel, grants project members access, creates a seven-day invite, and posts a welcome message.
- Every project member must connect Discord before a private project room can be created.

### Projects and coordination

The **backend/API** supports:

- Creating, reading, updating, and deleting projects.
- Project owners adding/removing members and transferring ownership.
- Persistent project messages.
- Persistent tasks with title, description, assignee, due date, and status.
- Events with start/end times.
- Availability polls, member voting, owner close, and creating a calendar event from the chosen time.

The **Projects UI** presents a project explorer plus a workspace-style detail view with member lists, task board, events/milestones, availability polling, and an action to open/create the Discord room.

### Learning resources

- A Resources page has two sections: Roadmaps and “How to build X”.
- The repository includes a curated resource catalogue in `src/data/resourcesData.ts` and a roadmap directory in `src/data/roadmapDirectory.ts`.
- Resources can be filtered/searched, opened externally, saved, and marked not started/in progress/completed.
- The HTTP adapter falls back to that local catalogue if `/resources` is absent. Resource saves/progress also fall back to browser `localStorage`.

### Settings and demo admin tools

- Profile visibility and notification/evidence preferences exist in the Settings UI.
- GitHub and Discord connection status/actions appear in Settings.
- A demo Admin tab presents a directory view and sample transaction ledger, with add/delete-user controls in mock mode.

## Architecture

```text
React 19 + TypeScript + Vite (Vercel)
        │  Bearer JWT over HTTPS
        ▼
Spring Boot 3.4 / Java 21 (Render)
        │
        ├── PostgreSQL via JPA + Flyway (Supabase)
        ├── GitHub OAuth + public repository-language evidence
        └── Discord OAuth + Discord REST bot for private project rooms
```

### Frontend

- Entry point: `src/main.jsx`
- Application shell/state: `src/App.tsx`
- HTTP/mock adapter selector: `src/api/index.ts`
- Production HTTP adapter: `src/api/httpAdapter.ts`
- Browser demo adapter and seeded UI data: `src/api/mockAdapter.ts`, `src/data/demoData.js`
- API client interface: `src/api/client.ts`
- Shared TypeScript types: `src/types/api.ts`, `src/types/resources.ts`
- Material Design 3 components/tokens: `src/components/m3/`, `src/theme/tokens.css`, `src/styles.css`

Primary screens are in `src/views/`:

| Screen | Component | Current purpose |
| --- | --- | --- |
| Landing | `pages/Landing.jsx` | Marketing/start screen. |
| Auth | `views/AuthView.tsx` | Register/login, including mock/demo convenience actions. |
| Onboarding | `views/OnboardingDialog.tsx` | Complete profile and skills after first auth. |
| Discover | `views/DiscoverView.tsx` | Recommended collaborators and connection actions. |
| Profile | `views/ProfileView.tsx` | Edit profile and manually declared skills. |
| Connections | `views/ConnectionsView.tsx` | Requests, collaborators, and Discord handoff. |
| Projects | `views/ProjectsView.tsx` | Explorer/workspace, tasks, events, polls, Discord room action. |
| Resources | `views/ResourcesView.tsx` | Roadmaps and Build Your Own X resource browser. |
| Settings | `views/SettingsView.tsx` | Privacy, integrations, demo admin. |
| Team Builder | `components/TeamBuilder.jsx` | Skill coverage team recommender. |

### Backend modules

The Spring application lives under `backend/src/main/java/com/mesh/`.

| Module | Responsibility |
| --- | --- |
| `auth` | Registration/login, JWT parsing, Spring Security, password hashing. |
| `profiles`, `skills` | Student profile, goals, interests, desired skills, availability, skill catalogue. |
| `recommendations` | Explainable deterministic scoring and domain-balanced Discover allocation. |
| `connections` | Pass/save/block state, connection requests, accepted connections. |
| `messages` | One-to-one connection messages and project group messages. |
| `projects`, `tasks`, `calendar` | Membership/ownership, tasks, events, availability polls. |
| `github` | GitHub PKCE flow and public repository-language evidence. |
| `discord` | Discord PKCE identity link and private project room creation. |

The source-of-truth HTTP contract is `contracts/openapi.yaml`. It is versioned as `0.3.0`.

### Database

Flyway migrations are in `backend/src/main/resources/db/migration/`:

| Migration | Contents |
| --- | --- |
| `V1` | Identity and base student profiles. |
| `V2` | Curated skill catalogue. |
| `V3` | Matching data: goals, interests, desired skills, availability, domains. |
| `V4` | Discover decisions, connection requests/connections, blocks. |
| `V5` | Projects, members, group messages, tasks. |
| `V6` | Events and availability polls. |
| `V7` | Direct connection messages. |
| `V8` | GitHub connection, OAuth state, repository/language evidence. |
| `V9` | Discord OAuth identity/state and project-room mapping. |
| `V10` | 100 demo discovery profiles and their matching data. |

## Running locally

### Prerequisites

- Node.js 22.12+
- Java 21
- Maven 3.9+
- PostgreSQL 16+ or Supabase PostgreSQL via the **Session Pooler**

### Frontend

```powershell
cd "C:\Users\Rover\Documents\Github\Mini Project"
npm install
npm run dev
```

By default, local Vite development uses the mock adapter. To use a local API instead:

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Backend

Copy the values from `.env.example` into your local environment, then run:

```powershell
cd "C:\Users\Rover\Documents\Github\Mini Project\backend"
mvn spring-boot:run
```

For the existing Supabase setup, `backend/run-local.ps1` is the preferred helper. It uses the Supabase Session Pooler and prompts for the database password without writing it to disk.

The backend starts under `/api/v1`; use `GET /api/v1/actuator/health` to confirm it and the database are ready.

## Environment configuration

Templates: `.env.example` and `backend/.env.example`.

| Group | Required variables |
| --- | --- |
| Database | `MESH_DATABASE_URL`, `MESH_DATABASE_USERNAME`, `MESH_DATABASE_PASSWORD` |
| Authentication | `MESH_JWT_SECRET`, optional `MESH_JWT_TTL_MINUTES` |
| CORS | `MESH_ALLOWED_ORIGINS` |
| Frontend production API | `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=https://…/api/v1` |
| GitHub evidence | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, redirect/success/error URLs, optional `GITHUB_MAX_REPOSITORIES` |
| Discord rooms | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, redirect/success/error URLs, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, optional `DISCORD_CATEGORY_ID` |

Never commit database passwords, JWT secrets, OAuth client secrets, or Discord bot tokens. `render.yaml` lists the backend variables expected by Render but deliberately does not include their values.

## Deployment

- **Render** builds `backend/Dockerfile` through `render.yaml` and exposes the health endpoint above.
- **Vercel** builds the Vite app using `npm run build` and `vercel.json` rewrites SPA routes to `index.html`.
- Production frontend mode defaults to the Render API in `src/api/httpAdapter.ts`. Set `VITE_API_BASE_URL` explicitly for any new environment.
- After changing a public frontend/API URL, update CORS plus GitHub/Discord callback and success/error redirect URLs together.

For the original walkthrough, see `docs/TOMORROW_DEMO_RUNBOOK.md`.

## Important current limitations and integration gaps

This section is intentionally candid. It is the highest-value starting point for the next agent.

1. **Frontend project detail data does not fully hydrate from production APIs.** `HttpApiAdapter.toProject()` maps basic project data but initializes `tasks`, `events`, and `availabilityPolls` as empty arrays. The richer Project screen works end-to-end with the mock adapter; production needs separate fetches/mappings for `/projects/{id}/tasks`, `/events`, and `/availability-polls`.

2. **Several Projects UI calls use outdated endpoint shapes.** The frontend currently sends task updates with `PATCH` while the backend exposes `PUT`; it posts polls to `/projects/{id}/polls` while the backend exposes `/projects/{id}/availability-polls`; and its event/task payload fields differ from the backend’s contracts in places. Align `src/api/httpAdapter.ts`, `src/types/api.ts`, and `contracts/openapi.yaml` before treating the full board/poll UI as production-ready.

3. **Resources are frontend-curated, not a server feature.** There is no `resources` backend module/controller or matching OpenAPI endpoints. In HTTP mode the adapter intentionally falls back to bundled resources and `localStorage`; saves/progress are per browser, not shared accounts.

4. **Settings privacy preferences are browser-local in HTTP mode.** `getPrivacySettings` and `updatePrivacySettings` currently use `localStorage`; they are not persisted in PostgreSQL.

5. **The Admin panel is demo-only.** The mock adapter supplies the 100-person directory and transaction ledger. The HTTP adapter returns empty lists for reads, while create/delete point at `/admin/users`; the backend does not currently implement an admin module/endpoints. Do not present admin directory changes or transactions as live production behavior.

6. **The frontend’s extended TypeScript types are richer than the production payloads.** `Profile` includes an optional `discordId` used by UI gating/actions, but the documented backend Discord connection endpoint is the authoritative source. Several UI-only fields—open roles, tags, project status, priority, and resource metadata—are mock/product-design data rather than persisted API fields.

7. **Direct Discord DMs use a Discord deep link plus a copied Discord ID.** They are not a verified direct-message API integration. The production-backed group collaboration path is the private project channel created by the bot.

8. **GitHub evidence has a narrow meaning.** It analyses owned public repositories and language metadata only. It should never be described as scraping GitHub, reading private repositories, reading commit history, or proving skill mastery.

9. **LinkedIn verification is not implemented.** Keep all demo language accurate: it can be a submitted profile URL/certificate, not scraped or independently verified evidence.

10. **The app contains legacy backup files** (`src/App.jsx.bak`, `src/api.js.bak`). They are not used by the build and can confuse future work. Preserve them until a separate cleanup decision is made.

## Recommended next work

1. Make the Projects workspace production-complete by aligning frontend adapter/types with the implemented task/event/poll endpoints and loading their data in project detail.
2. Decide whether resources and saved learning progress should be shared server data. If yes, add a backend module, Flyway migration, OpenAPI paths, then remove the silent `localStorage` fallback for production.
3. Either build real admin authorization/endpoints or hide the Admin tab outside mock/demo mode.
4. Add evidence cards for individual skills: a self-declared label, GitHub-supported label, source repository link, and eventually teammate/project confirmations. Keep the evidence claim narrow and explainable.
5. Connect the resource flow to collaboration: roadmap topic → a bounded Build Your Own X project → recommended teammates → Discord room → contribution/portfolio evidence.
6. Add automated integration tests against a disposable PostgreSQL database for auth, connection flow, project workspace endpoints, and OAuth state handling.

## Verification commands

```powershell
cd "C:\Users\Rover\Documents\Github\Mini Project"
npm run build

cd backend
mvn test
npx --yes @redocly/cli lint ..\contracts\openapi.yaml
```

The backend test suite covers recommendation weights, Discover allocation, and GitHub PKCE challenge generation. Full endpoint verification needs a running PostgreSQL/Supabase database; GitHub and Discord flows also need their OAuth apps configured.

## Suggested demo flow

1. Create two accounts on separate devices.
2. Complete onboarding and manually add skills.
3. Connect GitHub for one or both accounts and explain that it adds public-repository language evidence.
4. Open Discover and explain the recommendation reasons/signals.
5. Send and accept a connection request.
6. Create a project and add the accepted collaborator.
7. Each member links Discord; the project owner creates the private room and opens its invite.

Do not claim that LinkedIn is scraped or that GitHub proves proficiency. The strongest accurate demo message is that MESH makes self-declared skills more transparent through opt-in public evidence and uses stated goals, desired skills, interests, and availability to recommend collaborators.
