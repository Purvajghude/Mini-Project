# MESH 2.0 implementation roadmap

## Feasibility decision

Ship a narrow vertical slice: an authenticated owner creates a recruiting project, saves editable skill requirements, views a gap analysis and three deterministic team alternatives, invites a candidate, the candidate accepts, and the new member uses existing tasks/polls/Discord room. This is realistic in 24 hours only if existing features are reused and the legacy/mock UI surface is not expanded.

## P0 — essential for submission

| Order | Deliverable | Dependencies | Acceptance evidence |
|---:|---|---|---|
| 1 | Freeze contract and repair production adapter DTOs for existing project tasks/events/polls | Existing OpenAPI/controllers | Production project reload shows persisted workspace data; no `/polls` or PATCH-task call remains. |
| 2 | V11 project lifecycle/team size/requirements migration plus entities/repositories | Flyway, skills, projects | Owner can create/edit requirements transactionally; duplicate skills and invalid size rejected. |
| 3 | Blueprint suggestion endpoint | Skill catalogue; deterministic templates | Idea/domain returns editable assumptions/requirements without an LLM. |
| 4 | Pure gap-analysis and bounded team-formation engine with unit tests | V11, profiles/skills/availability/blocks | Same fixture gives stable alternatives and explanations; ineligible/demo users never appear. |
| 5 | Team suggestions endpoint + OpenAPI/TypeScript DTOs | Step 4 | Owner sees gaps, alternatives, partial/no-result states. |
| 6 | V12 invitations and atomic accept flow | V11, project members, access service | Owner invites; invitee accepts; one member is added; full/stale state returns 409. |
| 7 | Minimal project-first UI | Steps 2–6 | Demonstrate create → requirements → alternatives → invite → accept. |
| 8 | End-to-end verification/manual runbook | All P0 | Two accounts, real PostgreSQL/Supabase, invite and accept flow; backend unit tests and OpenAPI lint pass. |

Recommended time budget: 3h alignment/schema, 4h engine/tests, 3h API/recruitment, 5h UI, 3h real integration/debug, 2h presentation/runbook, with contingency embedded. If work is behind after step 5, demo direct invitation to a suggested candidate and defer applications.

## P1 — only if P0 passes

- Applications inbox and owner accept/decline flow (the V12 schema already supports it).
- Optional `institution`/`institution_member` migration and institution-filtered discovery, after policy approval.
- Requirement importance weights or role labels, only when clearly explained in the UI.
- Suggestion refresh/diversity controls and visible availability policy selector.
- Persist privacy settings, replace local resource fallback with an explicit server module, or hide those controls in HTTP mode.
- Testcontainers integration tests for Flyway/auth/project/recruitment authorization.
- Improve Discord room error guidance after accepted membership.

## P2 — post-submission

- Institution provisioning/SSO, faculty moderation, analytics, and operational admin tooling.
- Startup challenge sponsors and permissioned talent discovery.
- Optional LLM wording/template assistance with human confirmation and deterministic fallback.
- Persisted matching-run audit/history, notifications, and outbound email.
- Rich task metadata, resource tracking, in-app live chat, or GitHub contribution analytics.

## Do not spend the 24 hours on

- Microservices, message queues, vector search, machine learning, project-success prediction, or social/behavioral scoring.
- A general public project marketplace before recruiting visibility/consent rules exist.
- Repairing the entire mock/admin/resources product surface.
- Inferring skill proficiency from GitHub activity.

## Product-owner decisions required now

1. Is P0 recruitment invite-only, application-only, or both? Recommendation: invitations in the demo UI, API/schema ready for both.
2. Is a project visible outside existing members while `RECRUITING`, and to whom (all campus, institution only, or explicit invitees)?
3. Does `targetTeamSize` include the owner? Recommendation: yes.
4. Must availability overlap be required, optional, or merely shown as unknown/compatible? Recommendation: show it and allow unknown; exclude explicit incompatibility only if the owner chooses that policy.
5. Are demo accounts allowed to appear in the production demo? Recommendation: no; use real second account or a marked local fixture.
6. What constitutes a skill requirement: one qualified contributor per required skill (recommended), or additive novice coverage?
7. Is institution scope required for grading? If not, defer it.

## Top five delivery risks

1. **Mock-vs-production drift** — default development uses the mock adapter, masking broken endpoint shapes. Mitigation: turn HTTP mode on before UI work and test it daily.
2. **Too much UI scope** — rebuilding the legacy project explorer instead of adding one recruiting workflow will consume the deadline. Mitigation: one project detail panel and invitation inbox only.
3. **Recruitment race conditions** — concurrent accepts can overfill a team. Mitigation: one transactional acceptance service with project locking/versioning and capacity check.
4. **Eligibility/data quality** — V10 synthetic accounts and incomplete profiles yield impossible invites or weak recommendations. Mitigation: filter eligibility explicitly and use two real test accounts.
5. **External integration setup** — Discord OAuth/bot configuration may fail close to demo time. Mitigation: prove the core membership flow without Discord; show Discord only as an existing optional final handoff.

## Exit criteria

- A real authenticated owner creates/edits a recruiting project and requirements.
- The engine returns deterministic, explainable alternatives and honest uncovered gaps.
- A real eligible student receives and accepts an invitation; capacity and blocks are enforced.
- The accepted member appears in the existing project workspace and can access the configured Discord-room action.
- OpenAPI, backend DTOs, frontend DTOs, and actual HTTP methods/payloads agree for every shown P0 screen.
