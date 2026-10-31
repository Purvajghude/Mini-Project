# MESH 2.0 — Verified Frontend Audit & Technical Debt Assessment

**Status:** Completed & Empirically Verified  
**Role:** Principal Frontend Architect & Product Designer  
**Scope:** Actual Repository Codebase (`src/`, `contracts/openapi.yaml`, `docs/mesh-v2/`)  
**Audience:** Frontend Engineers, Backend Architect (Codex), Product Stakeholders  

---

## 1. Executive Summary

Following a verified inspection of the active repository, the frontend exhibits a split personality:
1. **Strong Design Foundation:** An authentic, customized Material Design 3 token system (`src/theme/tokens.css` and `src/components/m3/m3.css`) with working primitives (`Button`, `Card`, `Chip`, `Dialog`, `NavigationRail`, `NavigationBar`, `TextField`, `Avatar`, `Snackbar`).
2. **Monolithic Shell Architecture:** `src/App.tsx` spans 923 lines, managing 16 top-level state variables in a single component, initiating a 13-endpoint parallel request on boot (`Promise.all` in `loadData()`), and performing manual string-based tab routing (`landing`, `discover`, `connections`, `projects`, `resources`, `profile`, `settings`).
3. **Disconnected Project Lifecycle:** 
   - `src/views/ProjectsView.tsx` (1,300 lines) focuses almost entirely on an in-memory Kanban board, local calendar events, and availability poll creation.
   - It captures projects with minimal fields (`name`, `summary`, `domain`) without skill requirements, target team size, or lifecycle states (`DRAFT`, `RECRUITING`, `ACTIVE`, `ARCHIVED`).
   - Meanwhile, `src/components/TeamBuilder.jsx` exists as an isolated prototype that is **never rendered in `App.tsx`** except as an unused import (`import TeamBuilder from './components/TeamBuilder.jsx'`).
4. **API Adapter Disconnects:**
   - Codex has implemented Phase 1 endpoints in `src/api/httpAdapter.ts` (`suggestProjectBlueprint`, `getProjectRequirements`, `replaceProjectRequirements`), but **no UI component in `src/views/` actually calls them**.
   - `httpAdapter.ts` still falls back to `localStorage` for `PrivacySettings` and returns hardcoded empty arrays for admin users and transactions.

---

## 2. Source-Level Module Audit

### 2.1. Application Shell & Routing (`src/App.tsx`)
- **Navigation Model:** Manual state machine (`route` state). Does not use `react-router-dom`. When logged in, defaults to `discover`.
- **Top Bar:** Fixed 64px header (`--md-sys-color-surface-container-low`) displaying static title and user avatar. Lacks a global "Start a Project" call-to-action.
- **Side Rail / Bottom Bar:** Implements MD3 `NavigationRail` (desktop) and `NavigationBar` (mobile) via `src/components/m3/Navigation.tsx`. Destinations are: `Discover`, `Connections`, `Projects`, `Resources`, `Settings`.
- **Data Hydration Risk:** `loadData()` calls 13 endpoints simultaneously. If any endpoint throws, the entire screen fails with a toast error, though `busy` state is correctly released.

### 2.2. Projects View & Workspace (`src/views/ProjectsView.tsx`)
- **Size:** 1,300 lines.
- **Current Flow:**
  - Lists projects as horizontal cards.
  - Clicking a project switches to a 3-tab sub-view: `tasks` (Kanban), `calendar` (Event list), `polls` (Availability voting).
  - Project creation is a basic modal dialog requesting: Title, Category (from 4 hardcoded strings), Description, Tags, and a single "Role Title" + "Required Skills" text input.
- **Missing MESH 2.0 Capabilities:**
  - No connection to `POST /project-blueprints/suggestions`.
  - No skill requirement configuration (`minimumProficiency`, `importance`).
  - No team size specification (`targetTeamSize`).
  - No skill gap visualization.
  - No team candidate suggestions or invitation dispatch.

### 2.3. The Orphaned Team Builder (`src/components/TeamBuilder.jsx`)
- **Inspection:** 182 lines, React JSX.
- **Status:** Unmounted dead code in the current app shell.
- **Features:** Categorized skill chip picker, teammate size selector (1 to 5), calls `onSuggest({ skillIds, size })`.
- **Architectural Value:** Excellent conceptual foundation for coverage-based matching ("Coverage, not popularity"), but needs to be rewritten in TypeScript, aligned with MD3 tokens, and embedded into the 7-stage project creation flow.

### 2.4. Discover & Connections (`src/views/DiscoverView.tsx`, `src/views/ConnectionsView.tsx`)
- **Discover:** Focuses on student-to-student matching using a card stack or grid (`CandidateRecommendation`). Includes synthetic breakdown scores (`gapFill`, `sharedGround`, `depth`, `categoryReach`) and arbitrary percentage match scores (`0 - 100`).
- **Connections:** Manages incoming connection requests and active 1-on-1 chat. Links to Discord community.

### 2.5. Design System & Tokens (`src/theme/tokens.css`, `src/components/m3/`)
- Authentic Material Design 3 tokens:
  - Primary tonal palette: Iris Purple (`#6750A4`)
  - Secondary: Slate Lavender (`#625B71`)
  - Tertiary: Rose Mauve (`#7D5260`)
  - Full surface container hierarchy (`surface-container-lowest` through `highest`).
  - Strict corner shapes (`--md-sys-shape-corner-*`).
- Components in `src/components/m3/` are well-isolated, typed, and adhere strictly to CSS variables.

---

## 3. Component Reusability Matrix

| Component | Path | Audit Status | Recommendation |
| :--- | :--- | :--- | :--- |
| `Button` | `src/components/m3/Button.tsx` | **REUSE** | Keep as-is. Supports `filled`, `tonal`, `outlined`, `text`. |
| `Card` | `src/components/m3/Card.tsx` | **REUSE** | Keep as-is. Clean M3 container. |
| `Chip` | `src/components/m3/Chip.tsx` | **EXTEND** | Extend to create `SkillRequirementChip` with proficiency dots and importance badges. |
| `Dialog` | `src/components/m3/Dialog.tsx` | **REUSE** | Keep as-is for modal confirmations. |
| `NavigationRail` / `Bar` | `src/components/m3/Navigation.tsx` | **REFACTOR** | Add prominent "Start Project" Floating Action Button (FAB). |
| `TextField` / `TextArea` | `src/components/m3/TextField.tsx` | **REUSE** | Keep as-is. High quality MD3 outlined inputs. |
| `Avatar` / `Badge` | `src/components/m3/` | **REUSE** | Keep as-is for student identity and candidate cards. |
| `TeamBuilder` | `src/components/TeamBuilder.jsx` | **REPLACE** | Replace with typed `TeamSimulator` embedded in the project lifecycle. |
| `ProjectsView` | `src/views/ProjectsView.tsx` | **REFACTOR** | Split 1,300-line monolith into sub-components (`ProjectList`, `ProjectCreationWizard`, `ProjectWorkspace`). |
| `DashboardView` | `src/views/DashboardView.tsx` | **DEFER** | Redundant with Projects and Discover. Deprioritize. |

---

## 4. Technical Debt & Immediate Risks

1. **Monolithic View Files:** `ProjectsView.tsx` (1,300 lines) and `App.tsx` (923 lines) contain heavy inline JSX, nested state, and form handling that make incremental feature addition hazardous.
2. **Unused Endpoint Implementations:** `httpAdapter.ts` already has `suggestProjectBlueprint`, `getProjectRequirements`, and `replaceProjectRequirements`, but they are disconnected from the UI.
3. **Client-side State Mutation:** `ProjectsView` simulates task and event creations optimistically with custom objects that do not fully match backend UUID expectations.
4. **Lack of URL Deep-Linking:** Without route parameters, users cannot reload on `/projects/:id` or share a link to a project workspace.

