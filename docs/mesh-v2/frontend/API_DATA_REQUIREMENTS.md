# MESH 2.0 — API Data Requirements & Alignment Matrix

**Reference Specification:** `contracts/openapi.yaml` (v0.4.0) & `docs/mesh-v2/API_CONTRACT_PROPOSAL.md`  
**Current Phase:** Codex Phase 1 verified; preparing for Phase 2 integration.  

---

## 1. OpenAPI Endpoint Readiness Analysis

| Endpoint & Method | Purpose | OpenAPI Status | `httpAdapter.ts` Status | UI View Status | Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /project-blueprints/suggestions` | Generates non-persisted deterministic blueprint | **Present** (v0.4.0) | **Implemented** (`suggestProjectBlueprint`) | **Disconnected** | Connect to `ProjectIdeaInput` |
| `GET /projects/{id}/requirements` | Read project skill requirements | **Present** (v0.4.0) | **Implemented** (`getProjectRequirements`) | **Disconnected** | Connect to `BlueprintEditor` & Workspace |
| `PUT /projects/{id}/requirements` | Replace requirements, target size & lifecycle | **Present** (v0.4.0) | **Implemented** (`replaceProjectRequirements`) | **Disconnected** | Connect to `BlueprintEditor` Save action |
| `POST /projects` | Create project container (`name`, `summary`, `domain`) | **Present** (v0.4.0) | **Implemented** (`createProject`) | **Connected** (Legacy Modal) | Upgrade to multi-stage creation flow |
| `GET /projects/{id}/skill-gap-analysis` | Backend skill gap breakdown | **Proposed** (Codex Phase 2) | Pending Backend Implementation | Client-Side Fallback Ready | Use client-side computation until backend endpoint lands |
| `POST /projects/{id}/team-suggestions` | Ranked alternatives & candidate matches | **Proposed** (Codex Phase 2) | Pending Backend Implementation | Unconnected | Wire to `TeamSimulator` when available |
| `POST /projects/{id}/invitations` | Dispatch invitation to candidate | **Proposed** (Codex Phase 2) | Pending Backend Implementation | Unconnected | Wire to `InvitationModal` |
| `GET /project-invitations/me` | List pending invitations for logged-in user | **Proposed** (Codex Phase 2) | Pending Backend Implementation | Unconnected | Wire to `NetworkView` / Invites tab |
| `PATCH /project-invitations/{id}` | Accept or decline invitation | **Proposed** (Codex Phase 2) | Pending Backend Implementation | Unconnected | Wire to Invitation Action buttons |
| `GET /projects/{id}/discord-room` | Retrieve project Discord channel URL | **Present** (v0.4.0) | **Implemented** (`getProjectDiscordRoom`) | **Connected** in Workspace | Keep and enhance visibility |

---

## 2. Frontend TypeScript DTO Alignment

The following types are already defined in `src/types/api.ts` and strictly match `contracts/openapi.yaml`:
- `BlueprintSuggestionRequest`
- `BlueprintSuggestion`
- `ProjectRequirementInput`
- `ProjectRequirement`
- `ProjectRequirements`
- `ReplaceProjectRequirements`

The following Phase 2 types will be formally imported once Codex commits them to `contracts/openapi.yaml`:
```typescript
export interface SkillGapAnalysis {
  projectId: string;
  targetTeamSize: number;
  currentMemberCount: number;
  remainingSeats: number;
  requirements: Array<{
    skillId: number;
    skillName: string;
    importance: 'REQUIRED' | 'PREFERRED';
    minimumProficiency: number;
    coverage: 'COVERED' | 'PARTIAL' | 'UNCOVERED';
    coveredByMemberIds: string[];
  }>;
}

export interface TeamSuggestionSet {
  requestFingerprint: string;
  computedAt: string;
  alternatives: TeamSuggestion[];
  eligibleCandidateCount: number;
  exclusionsApplied: string[];
}

export interface TeamSuggestion {
  rank: number;
  teamHash: string;
  addedMemberIds: string[];
  requiredCoveragePercent: number;
  preferredCoveragePercent: number;
  remainingSeats: number;
  uncoveredRequirements: ProjectRequirement[];
  members: SuggestedMember[];
  explanation: string[];
}

export interface SuggestedMember {
  userId: string;
  displayName: string;
  username: string;
  department: string | null;
  yearOfStudy: number | null;
  avatarKey: string | null;
  covers: Array<{ skillId: number; skillName: string; proficiency: number }>;
  learningInterests: string[];
  availabilityStatus: 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN';
  evidenceSupport: Array<{ skillId: number; supported: boolean }>;
}
```

---

## 3. Resilience Guidelines & Mock-Data Elimination

1. **No Silent Mock Fallbacks:** Under no circumstances should `httpAdapter.ts` silently switch to `demoData.js` when an API request fails. If the server returns an error, the UI must render an informative error state with a retry button.
2. **Deterministic UI Computations:** The frontend can compute the Skill Gap Analysis locally using the project's requirements and the creator's profile skills. This allows the UI to remain responsive and unblocked even while Codex finalizes the backend endpoint.
3. **Idempotent Retries:** All suggestion and simulation queries pass an explicit fingerprint and do not mutate server state.

