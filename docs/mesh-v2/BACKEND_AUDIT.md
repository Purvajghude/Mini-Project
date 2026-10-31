# MESH 2.0 backend audit

Audit date: 29 October 2026. This is a source audit; no database, deployment, or application code was changed. Runtime endpoint verification was not run because this read-only assignment permits documentation files only.

## Verified stack

The handoff is materially correct: React 19, TypeScript, Vite, and Material 3-style components are in the root application; Java 21 and Spring Boot 3.4.5 are in `backend/`. The API uses Spring Security, JWT, JPA, Flyway, and PostgreSQL. `application.yml`, `render.yaml`, and `vercel.json` support the Supabase/Render/Vercel deployment model. GitHub and Discord use server-side OAuth with PKCE; Discord project channels use a bot token kept server-side.

`contracts/openapi.yaml` is intentionally maintained and substantially describes the current Spring controllers. It should remain the source of truth, but it is not generated or contract-tested against controllers.

## Component disposition

| Area | State | Disposition | Evidence and decision |
|---|---|---|---|
| `auth` | Email/password registration, BCrypt, signed expiring JWT, stateless security, CORS | REUSE | Solid baseline for a 24-hour delivery. Add authorization tests before changing roles; do not replace identity. |
| `profiles`, `skills` | Profile, 1–5 self-assessed skills, desired skills, goals, interests, weekly availability | EXTEND | This is the correct candidate and availability source. Add only project-facing availability calculation and eligibility filtering. |
| GitHub evidence | Opt-in owned public repos/languages, token discarded, `evidenceSupported` is narrow | REUSE | Keep it a small, explainable confidence label. Do not turn stars, commits, or repositories into expertise scores. |
| Discover recommendations | Deterministic weighted individual ranking plus domain allocation | REUSE / REFACTOR | Reuse signal loading and pure-test style. Keep Discover separate; it answers “who might I meet?”, not “which group fills this project’s gaps?”. |
| Connections and blocks | Requests, accepted pairwise connections, blocks, direct messages | EXTEND | Reuse blocks as a hard exclusion. Do not require a pre-existing connection for a project application or invitation. |
| `projects` and `project_member` | Owner, members, CRUD, transfer, direct owner add | EXTEND | These are the correct project and membership aggregates. Add lifecycle, team bounds, requirements, and acceptance-driven membership. |
| Tasks, events, polls | Persisted project-scoped collaboration, member authorization | REUSE | Good post-acceptance workspace baseline. UI integration must be repaired. |
| Project and connection messages | Persisted messages | DEFER | Discord is the requested collaboration path. Do not spend the day expanding an in-app chat. |
| Discord identity and rooms | PKCE identity link; owner-created private channels; member permission sync | REUSE | Keep as after-membership handoff. Configuration and all member identity links remain operational prerequisites. |
| Institution roles | `app_user.role` exists but is a string with no getters, role checks, schema constraints, or UI | DEFER | Add a minimal optional membership model only if a real institution demo needs it. Do not build an admin platform now. |
| Resources, privacy settings, admin | Browser fallback/demo data; missing API modules | DEFER / REPLACE UI claims | These are not MESH 2.0’s critical path. Hide or label as local demo unless separately implemented. |
| `TeamBuilder.jsx` | Standalone component; not rendered by `App.tsx`; only legacy `App.jsx.bak` references `api.suggestTeam` | REPLACE | Preserve the design intent, but implement a project-bound requirements and suggestion flow, not a disconnected skill picker. |

## Data model and migration history

Existing Flyway migrations are coherent and should be extended, not rewritten:

| Version | Existing purpose | MESH 2.0 value |
|---|---|---|
| V1–V3 | users, profiles, skill catalogue, goals/interests/desired skills/availability | Core identity and matching inputs. |
| V4 | blocks, discovery state, connection requests/connections | Hard exclusions and optional social context. |
| V5 | projects, members, messages, tasks | Primary aggregate and workspace. |
| V6 | events and availability polls | Reuse after a team exists. |
| V7 | connection messages | Not needed for P0 team formation. |
| V8 | GitHub connection and repository-language evidence | Narrow optional supporting signal. |
| V9 | Discord identities and project rooms | Workspace handoff. |
| V10 | 100 demo profiles | Useful for a visual demo but must never be treated as real available students. |

## Authentication and authorization observations

- Security defaults to authenticated API routes; OAuth callbacks and health are public. JWT supplies a UUID principal.
- Project access is centralized in `ProjectAccessService`; owner-only actions use `project_group.owner_user_id`, while members use `project_member`. This is a good enforcement seam.
- Tasks/events are editable or deletable by any member, not only their creator or owner. That may be acceptable for a student group, but must be intentional.
- Existing `ProjectService.addMember` requires a connection. New invitations/applications must use their own status transitions and transactional capacity checks instead.
- `app_user.role` is unused at runtime; current “admin” screens cannot be authorized safely.

## Confirmed frontend/API defects

| Finding | Confirmation | Impact |
|---|---|---|
| Workspace data is not hydrated | `HttpApiAdapter.toProject()` initializes tasks/events/polls to empty arrays; it does not call the implemented list endpoints. | A production workspace omits persisted data after reload. |
| Task update is wrong | HTTP adapter sends `PATCH`; `ProjectTaskController` exposes `PUT` and requires full `title`, `status`, and related fields. | Production updates fail (405 or validation). |
| Poll path/method/shape are wrong | UI uses `/projects/{id}/polls` and POST vote body; backend/OpenAPI use `/availability-polls/{pollId}/options/{optionId}/vote` with PUT and no body. | Poll creation/voting fail in HTTP mode. |
| Event shape is wrong | UI sends `startDate`, `endDate`, `type`, `location`; API requires `startsAt`, `endsAt` and optional `description`. | Event creation fails validation. |
| Task shape is wrong | UI sends `priority`, nested `assignee`, `tags`, and `IN_REVIEW`; API supports `assigneeUserId`, `TODO/IN_PROGRESS/DONE`, no priority/tags. | Task payloads/responses cannot be used as typed. |
| Resource progress is local | Absent backend `resources` endpoints cause the HTTP adapter to silently fall back to curated data and `localStorage`. | Not account-backed or cross-device. |
| Privacy settings are local | HTTP adapter reads/writes `mesh_privacy_settings` only. | Privacy promises do not persist. |
| Admin is mocked | HTTP reads return empty arrays; writes target nonexistent `/admin/users`; backend has no admin controller or role authorization. | Misleading and partly broken outside mock mode. |
| Team Builder is non-production | It is imported but never rendered in active `App.tsx`; no client interface, HTTP endpoint, controller, or schema exists. | There is no production team formation feature. |

## Additional integration gaps

- Active frontend types intentionally model mock-only project status, tags, open roles, priority, locations, and poll slots, rather than OpenAPI responses.
- Project creation sends descriptive category strings such as “Campus Infrastructure”; backend accepts them as arbitrary `domain`, while profile domains are controlled enum values. The model has no lifecycle or open/recruiting state.
- The OpenAPI contract accurately names `/availability-polls`, but the active adapter diverges. There is no build-time OpenAPI-to-TypeScript generation to catch this.
- `Profile` types omit server-returned goals/interests/desired skills/availability windows and add optional UI-only Discord fields; this encourages lossy mapping.
- Message response mapping sets every fetched connection message to `isSelf: false` because the adapter does not receive/pass the current user ID.
- README says V1–V8 in one place despite V9/V10 existing; low runtime risk, but a documentation-drift indicator.
- No Spring integration tests or Testcontainers coverage exercise migrations, JWT authorization, project access, or controller/OpenAPI compatibility. Existing tests are useful unit tests only.

## Highest-risk architectural issues

1. The frontend can look successful in default mock mode while its production workspace calls fail or discard server state.
2. A team recommendation feature without persisted requirements, lifecycle, invitations, and acceptance transitions would be a demo calculation, not a collaboration workflow.
3. Existing demo profiles can be suggested unless the engine explicitly filters demo/non-eligible accounts; their accounts cannot accept an invitation.
4. Changes to project membership must be serialized with capacity checks, or concurrent accepts can exceed target team size.
5. Treating existing discovery scores or GitHub signals as suitability scores would violate product philosophy and produce an unexplainable system.
