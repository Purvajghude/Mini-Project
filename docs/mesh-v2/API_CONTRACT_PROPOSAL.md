# MESH 2.0 API contract proposal

All paths are under existing `/api/v1`; bearer JWT is required unless noted. Update `contracts/openapi.yaml` first, then derive/align TypeScript DTOs and controllers. Errors use the existing `{ timestamp, status, error, message, fields, path }` envelope. Domain errors should carry a stable machine-readable `error` value such as `PROJECT_FULL` or `INVITATION_NOT_PENDING`.

## Blueprint and requirements

| Method/path | Request → response | Authorization / errors |
|---|---|---|
| `POST /project-blueprints/suggestions` | `{idea, domain?, skillIds?, targetTeamSize?}` → `BlueprintSuggestion` | Authenticated. Does not persist. `400` invalid input; never requires an LLM. |
| `GET /projects/{projectId}/requirements` | — → `ProjectRequirements` | Owner/member may read; `403` non-member. |
| `PUT /projects/{projectId}/requirements` | `{targetTeamSize, lifecycle?, requirements:[{skillId, minimumProficiency, importance, note?}]}` → `ProjectRequirements` | Owner only. Full replace is simplest. `400` duplicates/catalogue/size; `409` cannot lower target below current members. |
| `PATCH /projects/{projectId}/lifecycle` | `{lifecycle}` → `ProjectSummary` | Owner only. `409` invalid transition/capacity. |

`BlueprintSuggestion`:

```ts
type BlueprintSuggestion = {
  source: 'DETERMINISTIC_TEMPLATE' | 'OPTIONAL_ASSISTED';
  title: string; summary: string; domain: string | null;
  targetTeamSize: number;
  requirements: RequirementInput[];
  assumptions: string[];
};
type RequirementInput = {
  skillId: number; skillName: string; minimumProficiency: 1|2|3|4|5;
  importance: 'REQUIRED'|'PREFERRED'; note?: string | null;
};
```

## Gap analysis and alternatives

| Method/path | Request → response | Authorization / errors |
|---|---|---|
| `GET /projects/{projectId}/skill-gap-analysis` | — → `SkillGapAnalysis` | Owner/member. `409` requirements not configured. |
| `POST /projects/{projectId}/team-suggestions` | `{alternativeCount?: 1|2|3, excludeCandidateIds?: UUID[], availabilityPolicy?: 'REQUIRE_OVERLAP'|'ALLOW_UNKNOWN'}` → `TeamSuggestionSet` | Owner only for P0. `409` project not recruiting, team full, or stale/capacity condition. |

```ts
type SkillGapAnalysis = {
  projectId: string; targetTeamSize: number; currentMemberCount: number; remainingSeats: number;
  requirements: Array<{
    skillId: number; skillName: string; importance: 'REQUIRED'|'PREFERRED';
    minimumProficiency: number; coverage: 'COVERED'|'PARTIAL'|'UNCOVERED';
    coveredByMemberIds: string[];
  }>;
};
type TeamSuggestionSet = {
  requestFingerprint: string; computedAt: string; alternatives: TeamSuggestion[];
  eligibleCandidateCount: number; exclusionsApplied: string[];
};
type TeamSuggestion = {
  rank: number; teamHash: string; addedMemberIds: string[];
  requiredCoveragePercent: number; preferredCoveragePercent: number;
  remainingSeats: number; uncoveredRequirements: RequirementGap[];
  members: SuggestedMember[]; explanation: string[];
};
type SuggestedMember = {
  userId: string; displayName: string; username: string; department: string|null;
  yearOfStudy: number|null; avatarKey: string|null;
  covers: RequirementContribution[]; learningInterests: string[];
  availabilityStatus: 'COMPATIBLE'|'INCOMPATIBLE'|'UNKNOWN';
  evidenceSupport: Array<{skillId:number; supported:boolean}>;
};
```

`teamHash` is a deterministic display/request identifier, not a persisted authority. The frontend must send an actual `inviteeUserId` for recruitment actions and handle a 409 by refreshing suggestions.

## Recruitment

| Method/path | Request → response | Authorization / errors |
|---|---|---|
| `POST /projects/{projectId}/applications` | `{message?}` → `ProjectApplication` | Authenticated candidate; project must be RECRUITING; candidate cannot apply to own/current project. `409` duplicate/full/not recruiting. |
| `GET /projects/{projectId}/applications` | — → `ProjectApplication[]` | Owner only. |
| `PATCH /projects/{projectId}/applications/{applicationId}` | `{decision:'ACCEPT'|'DECLINE'}` → `ProjectApplication` | Owner only; accepting atomically creates membership. `409` full/stale/invalid status. |
| `POST /projects/{projectId}/invitations` | `{inviteeUserId, message?, expiresAt?}` → `ProjectInvitation` | Owner only; enforced eligibility and capacity. `409` duplicate/full/blocked/member. |
| `GET /project-invitations/me?status=PENDING&page=0&size=20` | — → `Page<ProjectInvitation>` | Invitee only sees own invitations. |
| `PATCH /project-invitations/{invitationId}` | `{decision:'ACCEPT'|'DECLINE'}` → `ProjectInvitation` | Invitee only; accept atomically creates membership. `409` expired/full/stale. |
| `DELETE /projects/{projectId}/invitations/{invitationId}` | — → `204` | Owner cancels pending invitation. |

For P0, applications can be hidden in the UI if invitations are the selected demo flow, but the schema/API design permits both. Do not implement a public campus project catalogue without an explicit visibility product decision.

`ProjectApplication` and `ProjectInvitation` return `id`, `projectId`, status, message, timestamps, and a small actor/project summary. They must not disclose another student’s blocks or private availability details.

## Existing endpoint alignment required before MESH 2.0 UI work

- Fetch `/projects/{id}/tasks`, `/events`, and `/availability-polls` explicitly; project list responses do not embed them.
- Use `PUT /projects/{id}/tasks/{taskId}` with complete API task shape.
- Use `POST /projects/{id}/availability-polls`, then `PUT /projects/{id}/availability-polls/{pollId}/options/{optionId}/vote`.
- Send events as `{title, description?, startsAt, endsAt}`.
- Retire adapter-only `ProjectTask`, `ProjectEvent`, and `AvailabilityPoll` fields that the backend does not return, or formally add them through schema/OpenAPI/migration work after P0.

## Frontend integration contract

- Treat every request as `loading | success | error`; preserve prior project data during a refresh, but do not fabricate successful server state from local mock data in HTTP mode.
- For an empty team-suggestion result, show requirements and `uncoveredRequirements`, with a next action to edit requirements; do not show a generic “no results” card.
- Suggestions are computed on demand and not persisted. Cache only by `requestFingerprint` in component state; invalidate after member/requirements/lifecycle changes.
- Pagination applies to inboxes/lists (`page`, `size`, `totalElements`, `totalPages`); P0 requirements and suggestion alternatives are bounded, non-paginated arrays.
- UUIDs are stable `userId`, `projectId`, `applicationId`, and `invitationId`; never use display names or array positions as identities.
- Map `401` to re-authentication, `403` to an access message, `404` to removed/unavailable, `409` to refresh/review project state, and `422`/`400` field errors to form controls. The current backend uses 400 for validation; preserve that until a formal contract-wide 422 decision.
