# MESH 2.0 database plan

## Principle

Extend the existing project, member, profile, skill, block, and GitHub evidence tables. Do not replace Flyway history, duplicate student profiles, or create a separate “team” entity. This plan is intentionally migration-only; no migrations are executed by this audit.

## Proposed migrations

### `V11__extend_projects_for_blueprints_and_lifecycle.sql`

Alter `project_group`:

| Column | Type / constraint | Purpose |
|---|---|---|
| `lifecycle` | `VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`, check `DRAFT/RECRUITING/ACTIVE/ARCHIVED` | Explicit workflow state. |
| `target_team_size` | `SMALLINT NOT NULL DEFAULT 4`, check `BETWEEN 1 AND 8` | Includes owner/current members; P0 capacity authority. |
| `blueprint_summary` | `VARCHAR(2000)` | Editable structured-description output, separate from existing short `summary`. Optional in P0 if existing `summary` is sufficient. |
| `updated_at` | existing column | Continue using it; add JPA optimistic version only if implementation chooses a `version` column. |

Create `project_skill_requirement`:

```text
id BIGSERIAL PK
project_id UUID NOT NULL → project_group(id) ON DELETE CASCADE
skill_id BIGINT NOT NULL → skill(id)
minimum_proficiency SMALLINT NOT NULL CHECK 1..5
importance VARCHAR(12) NOT NULL CHECK REQUIRED/PREFERRED
note VARCHAR(300) NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
UNIQUE(project_id, skill_id)
INDEX(project_id, importance)
```

Rationale: it reuses the catalogue and does not store a redundant skill name, role, or candidate score.

### `V12__create_project_recruitment.sql`

Create `project_application`:

```text
id UUID PK
project_id UUID NOT NULL → project_group(id) ON DELETE CASCADE
applicant_user_id UUID NOT NULL → app_user(id) ON DELETE CASCADE
message VARCHAR(1000) NULL
status VARCHAR(20) NOT NULL CHECK PENDING/ACCEPTED/DECLINED/WITHDRAWN/CANCELLED
created_at, updated_at, decided_at TIMESTAMPTZ
UNIQUE(project_id, applicant_user_id)
INDEX(project_id, status, created_at DESC)
INDEX(applicant_user_id, status, created_at DESC)
```

Create `project_invitation`:

```text
id UUID PK
project_id UUID NOT NULL → project_group(id) ON DELETE CASCADE
invitee_user_id UUID NOT NULL → app_user(id) ON DELETE CASCADE
invited_by_user_id UUID NOT NULL → app_user(id) ON DELETE RESTRICT
message VARCHAR(1000) NULL
status VARCHAR(20) NOT NULL CHECK PENDING/ACCEPTED/DECLINED/CANCELLED/EXPIRED
expires_at TIMESTAMPTZ NULL
created_at, updated_at, responded_at TIMESTAMPTZ
UNIQUE(project_id, invitee_user_id)
INDEX(invitee_user_id, status, created_at DESC)
```

A unique row retains history under status changes. If true multi-invitation history is later required, replace the unique constraint with a partial unique index on `status = 'PENDING'`; this is PostgreSQL-specific and is deliberately deferred to avoid speculative complexity.

### `V13__create_optional_institutions.sql` (P1 only)

```text
institution(id UUID PK, name VARCHAR(160) UNIQUE, email_domain VARCHAR(254) UNIQUE NULL,
            status VARCHAR(20) CHECK ACTIVE/INACTIVE, created_at TIMESTAMPTZ)
institution_member(institution_id UUID → institution, user_id UUID → app_user,
                   role VARCHAR(30) CHECK STUDENT/FACULTY/INSTITUTION_ADMIN,
                   joined_at TIMESTAMPTZ, PRIMARY KEY(institution_id, user_id))
ALTER TABLE project_group ADD COLUMN institution_id UUID NULL → institution(id)
CREATE INDEX idx_project_group_institution_lifecycle ON project_group(institution_id, lifecycle)
```

Do not add this in P0 unless the demo explicitly needs institutional partitioning. It creates policy questions around email verification, domain exceptions, and cross-campus discovery.

## Relationship map

```text
app_user ──1:1── student_profile ──*── profile_skill ──*── skill
    │                                  ^
    ├──* project_member *── project_group ──* project_skill_requirement ──1 skill
    │                              │
    │                              ├──* project_application ──1 applicant app_user
    │                              └──* project_invitation ──1 invitee app_user
    └──* user_block (hard recommendation exclusion)
```

## Acceptance transaction requirements

On application acceptance or invitation acceptance:

1. Lock/read the project’s lifecycle and target size.
2. Confirm recruitment row is pending and belongs to acting user/owner.
3. Confirm no block in either direction, candidate is eligible, and there is no current membership.
4. Count members (or lock project with optimistic version) and reject when at capacity.
5. Set recruitment status to accepted and insert `project_member` atomically.

The database constraints prevent duplicate members/recruitment identities; service logic enforces lifecycle, blocks, and capacity.

## Explicit non-changes

- Keep `profile_skill.self_assessed_proficiency` as a self-declaration.
- Keep GitHub repository/language data separate; never copy it into requirements or invent a verified-skill table.
- Do not persist team recommendations in P0. Inputs can change immediately, and persisting runs adds staleness and schema/retention work without enabling the core workflow.
- Do not migrate browser-local Resources/privacy/admin data during the team workflow. They are out of scope for a one-day submission.
