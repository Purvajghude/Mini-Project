# MESH 2.0 — Component Architecture & State Plan

**Design Framework:** Material 3 Expressive  
**Core Principles:** Reusable, typed, modular, accessible, minimal external dependencies.

---

## 1. Component Inventory & Responsibilities

```
src/components/
├── m3/                                # [REUSE] Core Material 3 Foundation Primitives
│   ├── Button.tsx                     # Buttons (Filled, Tonal, Outlined, Text)
│   ├── Card.tsx                       # MD3 Surface Containers
│   ├── Chip.tsx                       # Selectable, Filter, and Action Chips
│   ├── Dialog.tsx                     # Modal Windows
│   ├── Navigation.tsx                 # NavigationRail and NavigationBar
│   ├── TextField.tsx                  # Outlined Text and TextArea Inputs
│   ├── Avatar.tsx                     # User Avatars with deterministic tone
│   ├── Badge.tsx                      # Count & Notification Badges
│   └── Snackbar.tsx                   # Toast Notifications
│
├── project-creation/                  # [NEW] 7-Stage Core Workflow Components
│   ├── ProjectIdeaInput.tsx           # Stage 1: Natural language prompt input card
│   ├── BlueprintEditor.tsx            # Stage 2: Editable requirements specification
│   ├── SkillRequirementChip.tsx      # Sub-component: Interactive skill requirement chip
│   ├── SkillGapVisualizer.tsx         # Stage 3: Covered vs. recruiting gap columns
│   ├── TeamSimulator.tsx              # Stage 4 & 5: Alternative team comparison
│   ├── CandidateContributionCard.tsx  # Sub-component: Student card with covered skill tags
│   └── InvitationModal.tsx            # Stage 6: Dispatch personalized invitations
│
└── project-workspace/                 # [REFACTOR] Upgraded Workspace & Execution
    ├── ProjectHeader.tsx              # Project lifecycle, title, Discord room button
    ├── ProjectTeamRoster.tsx          # Member cards with roles & domain ownership
    ├── ProjectInvitationTracker.tsx   # Pending, accepted, declined status list
    └── ProjectKanban.tsx              # Refactored lightweight task board
```

---

## 2. Reusable Component Specifications

### 2.1. `ProjectIdeaInput.tsx`
- **Props:**
  ```typescript
  interface ProjectIdeaInputProps {
    onSubmit: (idea: string, domain?: string, targetTeamSize?: number) => Promise<void>;
    isLoading: boolean;
  }
  ```
- **State:** Local text input state, selected domain, preset chips.
- **Design:** Outlined TextArea with floating label, character count, and discrete category selector.

### 2.2. `BlueprintEditor.tsx`
- **Props:**
  ```typescript
  interface BlueprintEditorProps {
    initialBlueprint: BlueprintSuggestion;
    availableSkills: Skill[];
    onSave: (requirements: ReplaceProjectRequirements) => Promise<void>;
    onBack: () => void;
  }
  ```
- **State:** Editable title, summary, `targetTeamSize` ($1 \dots 8$), and array of `ProjectRequirementInput`.
- **Validation:** Minimum 1 requirement, valid skill IDs, proficiency between 1 and 5.

### 2.3. `SkillRequirementChip.tsx`
- **Props:**
  ```typescript
  interface SkillRequirementChipProps {
    skillName: string;
    minimumProficiency: number; // 1 to 5
    importance: 'REQUIRED' | 'PREFERRED';
    note?: string | null;
    isEditable?: boolean;
    onUpdate?: (updates: Partial<ProjectRequirementInput>) => void;
    onRemove?: () => void;
  }
  ```
- **Design:** Tonal MD3 surface container with pip indicators (1-5 dots) for proficiency and an amber badge for `REQUIRED` vs. lavender badge for `PREFERRED`.

### 2.4. `SkillGapVisualizer.tsx`
- **Props:**
  ```typescript
  interface SkillGapVisualizerProps {
    requirements: ProjectRequirement[];
    creatorSkills: ProfileSkill[];
    onProceedToTeam: () => void;
    onEditRequirements: () => void;
  }
  ```
- **Logic:** Computes set difference:
  - `Covered`: Creator has skill with `proficiency >= req.minimumProficiency`.
  - `Gap`: Creator lacks skill or `proficiency < req.minimumProficiency`.
  - `Learning Goal`: Flagged if creator has skill at lower proficiency and marks it as a learning opportunity.

### 2.5. `TeamSimulator.tsx`
- **Props:**
  ```typescript
  interface TeamSimulatorProps {
    projectId: string;
    requirements: ProjectRequirement[];
    suggestions: TeamSuggestionSet;
    onInviteCandidate: (userId: string, note?: string) => Promise<void>;
    onRefreshSuggestions: (options: { excludeCandidateIds?: string[]; availabilityPolicy?: 'REQUIRE_OVERLAP' | 'ALLOW_UNKNOWN' }) => Promise<void>;
  }
  ```
- **Features:** Segmented button for Alternative 1 / 2 / 3, coverage summary bar, candidate swap modal, and slot locking.

---

## 3. State Ownership & Re-Render Boundaries

```
App.tsx (Root Shell)
  │
  ├── [Server Cache / React State]
  │     - auth (token)
  │     - user (Profile)
  │     - projects (Project[])
  │     - skills (Skill[])
  │
  ├── Route: /projects (ProjectsView)
  │     ├── Mode: "LIST" -> ProjectCard list + Filter chips
  │     │
  │     ├── Mode: "CREATE_WIZARD" (Holds Draft Blueprint in State)
  │     │     ├── Step 1: ProjectIdeaInput (Controlled local form)
  │     │     ├── Step 2: BlueprintEditor (Mutates draft requirements)
  │     │     ├── Step 3: SkillGapVisualizer (Computes visual diff)
  │     │     └── Step 4: TeamSimulator (Queries backend alternatives)
  │     │
  │     └── Mode: "WORKSPACE" (Selected Project ID)
  │           ├── ProjectHeader (Renders status, Discord button)
  │           ├── ProjectTeamRoster (Renders members)
  │           ├── ProjectInvitationTracker (Renders recruitment states)
  │           └── Tasks / Calendar / Polls Tabs
```

