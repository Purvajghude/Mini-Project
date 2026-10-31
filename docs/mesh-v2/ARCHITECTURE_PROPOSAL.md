# MESH 2.0 architecture proposal

## Decision

Refactor the existing Spring Boot application into a clearer modular monolith. Do not rebuild it and do not introduce microservices. The existing modules, Flyway history, project membership model, security seam, and integrations are already enough for a reliable P0.

The MESH 2.0 unit of work is a **project**. A project owner edits a concrete blueprint and requirements; the system computes transparent alternatives; people apply or are invited; accepted people become members; the existing workspace and Discord handoff take over.

## Module boundaries

| Module | Owns | Uses |
|---|---|---|
| `auth` | accounts, credential/session issuance, account status | nothing domain-specific |
| `profiles` | student-facing identity, declared skills, availability, interests | `skills`, optional evidence summary |
| `skills` | curated skill catalogue | profile and project requirements |
| `evidence` (existing `github`) | opt-in repository-language support only | profiles; exposes boolean/narrow evidence coverage to matching |
| `projects` | project metadata, lifecycle, owner, bounds, memberships | profiles for response display |
| `blueprints` | deterministic template suggestion and editable project requirements | skill catalogue, project aggregate |
| `teamformation` | gap analysis, eligibility query, bounded deterministic alternatives | projects, profiles, skills, blocks, evidence |
| `recruitment` | applications, invitations, status transitions, accepted membership | projects, team formation eligibility, blocks |
| `collaboration` | existing tasks, events, polls, group messages, Discord room action | project access only |
| `institutions` | optional institution and membership roles | auth/profiles; not P0 |

Keep packages but introduce `blueprints`, `teamformation`, and `recruitment` as application services with DTOs, repositories, and pure policy classes. Do not let controllers query cross-module repositories directly. `ProjectAccessService` remains the authorization gateway for workspace endpoints.

## Aggregate and state rules

`ProjectGroup` remains the project root. Add lifecycle states `DRAFT`, `RECRUITING`, `ACTIVE`, `ARCHIVED`; P0 needs DRAFT → RECRUITING → ACTIVE. Add `target_team_size` (includes owner) and `max_team_size` only if product policy needs a range; for P0, one `target_team_size` is sufficient and less ambiguous.

`ProjectSkillRequirement` belongs to one project and refers to one existing skill. It holds `minimum_proficiency` (1–5), `importance` (`REQUIRED` or `PREFERRED`), and an optional note. It does not duplicate skill names or invent a role entity. Requirements are an editable declaration, not an assessment of people.

`ProjectApplication` and `ProjectInvitation` are recruitment records, not project members. Exactly one transition creates a `project_member`: accepting a valid invitation, or owner accepting a valid application. Perform that transition in one transaction that rechecks lifecycle, blocks, duplicate membership, and capacity.

## Blueprint suggestion

P0 must not require an LLM. Implement a deterministic template catalogue keyed by selected domain/category and explicit optional skills: for example, a “web application” template can propose React, Spring Boot, PostgreSQL, Figma, and Git with conservative 1–3 proficiency requirements. The owner edits every proposed field before saving. A future LLM may propose wording or an additional candidate template behind the same response shape; it never controls validation, requirements, eligibility, or matching.

## Request path

```text
Create draft → suggest/edit blueprint → persist requirements → gap analysis
   → compute 3 alternatives → owner compares → invite / applicant applies
   → accept (atomic membership) → ACTIVE → tasks, polls, Discord room
```

Suggestions may be computed on demand for P0 and carry a `requestFingerprint` made from project requirement/member/version data. They are not persisted, and invitation requests include the candidate ID rather than trusting a stale suggestion ID. Persist recommendation runs only if audit/history is explicitly needed later.

## Cross-cutting policies

- Every API response uses the existing `ApiException` envelope and stable UUID identifiers.
- Authorization: owners edit blueprint/recruitment; project members see internal workspace; candidates can only see a public recruiting summary; applicants act on their own application; invitees act on their own invitation.
- Eligibility: exclude owner/current members, disabled accounts, demo accounts, block relationships in either direction, duplicate pending invitation/application where applicable, and candidates with no profile/onboarding. Do not hide a person for lacking GitHub evidence.
- Data loading: return an explicit `TeamSuggestion` response with all display fields needed by the card. Do not make the frontend stitch several opaque profile calls.
- Data integrity: unique `(project_id, skill_id)`, one active application per `(project_id, applicant_user_id)`, one active invitation per `(project_id, invitee_user_id)`, and lock the project row or use optimistic versioning during acceptance.

## Deferred institution support

The existing app has no institution concept despite a `role` column. If the submission requires it, add an optional institution table and `institution_member` join table with `STUDENT`, `FACULTY`, and `INSTITUTION_ADMIN`; make a project optionally institution-scoped. Do not use this to build SSO, tenant isolation, moderation tooling, or billing in P0. Product approval is required before deciding whether cross-institution discovery is allowed.
