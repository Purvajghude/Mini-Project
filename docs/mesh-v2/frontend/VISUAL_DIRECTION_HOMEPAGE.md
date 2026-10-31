# MESH 2.0 — Visual Direction Reset: A Workshop for Ideas
## Authenticated Homepage Design Architecture & Concept Evaluation

**Document Purpose:** Architectural and visual specification for the authenticated MESH 2.0 home experience.  
**Status:** Design Proposal & Layout Concepts (Review Required Before Implementation)  
**Author:** Principal Frontend Architect & Product Designer  
**Scope:** Authenticated Homepage (`route === 'home'` / default authenticated view), Information Hierarchy, Two Divergent Creative Layouts, Data Mapping, and Component Changes.

---

## 1. Audit of Current Homepage & Routing Model

### 1.1. The Current State
1. **Default Landing upon Login:**
   - In `src/App.tsx`, when a user logs in or boots with an active session token, the route defaults to `'discover'`:
     ```ts
     const [route, setRoute] = useState<string>(() => {
       try {
         const stored = sessionStorage.getItem('mesh-auth');
         return stored ? 'discover' : 'landing';
       } catch {
         return 'landing';
       }
     });
     ```
   - As a result, the user is immediately dropped into `DiscoverView.tsx` — a full-screen candidate evaluation deck with swipe/card navigation, arbitrary scoring bars (`gapFill`, `sharedGround`, `depth`, `categoryReach`), and percentage dials.
2. **The "Networking First" Perception:**
   - Users are prompted to browse other students before they have defined or seen a single project.
   - The interface communicates: *"Evaluate these people"* rather than *"What are we creating today?"*.
3. **Aesthetic Misalignment:**
   - The palette leans heavily into uniform Iris Purple containers (`--md-sys-color-primary-container`, `#EADDFF`) and repeated rounded card blocks.
   - Floating elements, generic action badges ("Campus Network Active", "92% Score"), and equal-sized grids make it indistinguishable from generic HR or social SaaS tools.

---

## 2. Proposed Information Hierarchy: "A Workshop for Ideas"

The homepage transitions from a student directory into a **creative engineering workbench**. 

### Hierarchy Order:
```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PERSONAL WORKBENCH HEADER                                           │
│    - Restrained, warm, editorial greeting: "Good morning, Asha."       │
│    - Intent inquiry: "What are we building today?"                     │
│    - Direct campus context without synthetic status badges             │
├────────────────────────────────────────────────────────────────────────┤
│ 2. IDEA ENTRY STUDIO (PRIMARY HERO CANVAS)                             │
│    - Expansive, focused natural-language drafting surface              │
│    - Non-magical starter seeds (Robotics, Distributed Systems, IoT)    │
│    - Seamless instant dispatch to the Blueprint Generator               │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ACTIVE WORKBENCH — "CONTINUE BUILDING" (PRIMARY ACTIONABLE DATA)    │
│    - Real projects where the user is an owner or confirmed member      │
│    - Lifecycle badge (DRAFT, RECRUITING, ACTIVE)                       │
│    - Real requirements coverage status & immediate next action         │
│    - Direct 1-click jump into the project workspace                    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. CAMPUS WORKBENCHES — "CAMPUS INITIATIVES" (SECONDARY EXPLORATION)   │
│    - Honest communication of public project discovery status           │
│    - Filtered to projects actively recruiting teammates                │
│    - Clear, factual vacancies; no decorative fake metrics              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Two Meaningfully Different Layout Concepts

We propose two divergent compositions that both honor **Material 3 Expressive + Editorial Typography + Creative Tool Interfaces**, while offering distinct structural philosophies.

---

### Concept A: "The Architectural Ledger" (Asymmetrical Dual-Column Studio)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [MESH Studio]                                                   Asha Patel · Eng IV [Profile]│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ GOOD MORNING, ASHA.                                                                         │
│ What are we building today?                                                                 │
├──────────────────────────────────────────────────┬──────────────────────────────────────────┤
│ COLUMN 1: THE DRAFTING CANVAS (62% Width)        │ COLUMN 2: ACTIVE DESK (38% Width)        │
│                                                  │                                          │
│ ┌──────────────────────────────────────────────┐ │ ┌──────────────────────────────────────┐ │
│ │ ✎ NEW BLUEPRINT DRAFT                        │ │ │ ACTIVE WORKSPACES (2)                │ │
│ │                                              │ │ │                                      │ │
│ │ "Describe a system, device, or campus        │ │ │ ┌──────────────────────────────────┐ │ │
│ │  initiative in plain technical English..."   │ │ │ │ Autonomous Recycling Rover       │ │ │
│ │                                              │ │ │ │ Lifecycle: RECRUITING            │ │ │
│ │ [ Large 5-line monospace/serif input card ]  │ │ │ │ 2/4 Members · Needs: PyTorch     │ │ │
│ │                                              │ │ │ │ [Open Workspace →]               │ │ │
│ │ Domain: [ AI & Robotics ▾ ]  Size: [ 3 ▾ ]   │ │ │ └──────────────────────────────────┘ │ │
│ │                                              │ │ │ ┌──────────────────────────────────┐ │ │
│ │ Architectural Seeds:                         │ │ │ │ Campus Food Dispatch             │ │ │
│ │ [✦ Edge Vision] [✦ Low-Latency Mesh]         │ │ │ │ Lifecycle: ACTIVE                │ │ │
│ │                                              │ │ │ │ 3/3 Members · Sprint: In Progress│ │ │
│ │ [ Generate Deterministic Blueprint → ]       │ │ │ │ [Open Workspace →]               │ │ │
│ └──────────────────────────────────────────────┘ │ │ └──────────────────────────────────┘ │ │
│                                                  │ │                                        │
│ ┌──────────────────────────────────────────────┐ │ │ ┌──────────────────────────────────┐ │ │
│ │ RECRUITING CAMPUS INITIATIVES                │ │ │ │ RECRUITMENT STATUS               │ │ │
│ │ Verified projects open for peer contribution │ │ │ │ 1 candidate invited to Rover     │ │ │
│ │ (Live feed filtered by open vacancies)       │ │ │ │ Status: Pending Response         │ │ │
│ └──────────────────────────────────────────────┘ │ │ └──────────────────────────────────┘ │ │
└──────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

#### Stylistic & Interaction Principles:
- **Spatial Structure:** Asymmetric dual-column workbench. The left pane functions as the primary "Drafting Board" (warm off-white/surface background with a crisp 1px neutral outline), while the right pane functions as the user's "Active Desk Ledger" tracking confirmed commitments.
- **Typography:** Display title set in clean, high-contrast grotesque sans (`Inter` / `Roboto`) with high-tracking uppercase section markers (`OVERVIEW`, `DRAFTING CANVAS`). Supporting prompts use restrained editorial styling.
- **Card Philosophy:** Flat, non-elevated surfaces (`--md-sys-color-surface-container-low`) with crisp `--md-sys-color-outline-variant` borders. No floating blur dropshadows.
- **Why Concept A is superior to the current UI:**
  - It creates immediate operational focus: writing a new project and continuing existing work are visible side-by-side without scrolling.
  - Eliminates the generic SaaS grid of 6 identical cards.

---

### Concept B: "The Linear Atelier" (Editorial Monolithic Progression)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [MESH]  Projects  ·  Discover  ·  Community                                Asha Patel [⚙]   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│                       Good morning, Asha.                                                   │
│                 Turn an engineering idea into a team.                                       │
│                                                                                             │
│       ┌─────────────────────────────────────────────────────────────────────────────┐       │
│       │  Start a project blueprint...                                               │       │
│       │                                                                             │       │
│       │  [ Expansive 120px tall focus canvas with subtle dashed neutral boundary ] │       │
│       │                                                                             │       │
│       │  Suggested domains:  [Robotics]   [Infrastructure]   [BioTech]   [Distributed]│     │
│       │                                      [ Build Blueprint with Deterministic Spec → ] │
│       └─────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                             │
│ ─────────────────────────────────────────────────────────────────────────────────────────── │
│                                                                                             │
│ CURRENT PROJECTS (2)                                              [ View All Projects → ]   │
│                                                                                             │
│ ┌─────────────────────────────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ AUTONOMOUS RECYCLING ROVER                  │ │ CAMPUS FOOD DISPATCH                    │ │
│ │ AI & Robotics · Owner                       │ │ Web & Systems · Member                  │ │
│ │                                             │ │                                         │ │
│ │ 4 Requirements: ROS2 (Covered), PyTorch     │ │ 3 Members confirmed                     │ │
│ │ Status: Recruiting (2 seats open)           │ │ Next: Sprint Milestone in 2 days        │ │
│ │                                             │ │                                         │ │
│ │ [ Jump to Workspace → ]                     │ │ [ Jump to Workspace → ]                 │ │
│ └─────────────────────────────────────────────┘ └─────────────────────────────────────────┘ │
│                                                                                             │
│ ─────────────────────────────────────────────────────────────────────────────────────────── │
│                                                                                             │
│ CAMPUS INITIATIVES SEEKING COLLABORATORS                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [Honest status banner: Shows actual recruiting projects from backend, or clean state]   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Stylistic & Interaction Principles:
- **Spatial Structure:** Centered editorial flow with generous whitespace (64px vertical rhythm). The eye naturally descends from greeting $\rightarrow$ idea creation $\rightarrow$ existing projects $\rightarrow$ campus opportunities.
- **Typography:** Large, expressive display heading (28–32px, letter-spacing -0.02em) evoking a modern developer tools environment (Vercel/Linear aesthetic combined with M3 Expressive tokens).
- **Surface Treatment:** Clean neutral canvas (`#FEF7FF` light / `#121316` dark). The Idea Surface features an active focus ring that transitions smoothly from neutral outline to primary accent without jarring scale transforms.
- **Why Concept B is superior to the current UI:**
  - Unrivaled clarity and visual breathing room.
  - Puts the act of *writing an idea* front-and-center as the hero action of the platform.

---

## 4. Real Backend Data Mapping vs. Honest Unavailable States

| Homepage Element | Data Source / API Endpoint | Fallback / Unavailable State Handling |
| :--- | :--- | :--- |
| **Greeting & Name** | `user.displayName`, `user.department` from `GET /api/v1/profile/me` | Graceful fallback to *"Welcome to MESH"* if session profile is loading. |
| **Idea Entry & Presets** | Dispatches to `POST /api/v1/project-blueprints/suggestions` | Inline field validation; explicit error banner if the server template engine fails. |
| **Continue Building (User Projects)** | `GET /api/v1/projects` (hydrated with real tasks & lifecycle) | If array is empty: Clean, non-condescending empty slate: *"You haven't joined or created any projects yet. Start by drafting your first idea above."* |
| **Campus Projects (Recruiting)** | `projects.filter(p => p.status !== 'COMPLETED')` | Since the backend does not yet have a dedicated campus-wide public search endpoint with permissions, we only show projects accessible to the student or display an honest: *"Campus project directory is being expanded. Currently showing active initiatives you have access to."* Never inject synthetic mock projects. |

---

## 5. Required Component Architecture Changes

To support this new visual direction cleanly without breaking existing views:

1. **New View Component: `src/views/HomeWorkbenchView.tsx`:**
   - Houses the authenticated homepage experience.
   - Contains sections: `WelcomeHeader`, `WorkbenchIdeaInput`, `ActiveProjectsStrip`, and `CampusInitiativesSection`.
2. **Routing Update in `src/App.tsx`:**
   - Change default route from `'discover'` to `'home'`.
   - Update navigation destinations:
     `Home` (Workspace icon), `Projects` (Folder icon), `Discover` (Compass icon), `Community` (Chat icon), `Profile` (User icon).
3. **Typography & Styling Hardening (`src/theme/tokens.css`):**
   - Introduce neutral surface tokens for editorial backgrounds:
     `--mesh-workbench-canvas: var(--md-sys-color-surface)`
     `--mesh-workbench-card: var(--md-sys-color-surface-container-low)`
   - Retain purple accent exclusively for interactive CTAs and active states.

---

## 6. Comparison & Design Recommendation

| Dimension | Current App | Concept A (Architectural Ledger) | Concept B (Linear Atelier) |
| :--- | :--- | :--- | :--- |
| **Visual Impression** | Corporate SaaS / Social Network | Technical Workbench / IDE Desk | Modern Editorial Tool / Creative Studio |
| **Idea Entry Prominence** | Hidden behind modal clicks | Prominent left drafting board | Hero focal point of screen |
| **Information Density** | High, repetitive cards | Balanced, high utility, dual column | Generous whitespace, linear hierarchy |
| **Mobile Adaptability** | Cluttered multi-card scroll | Stacks Column 1 above Column 2 | Seamless single-column fluid collapse |

### Principal Designer Recommendation:
**Concept A (The Architectural Ledger)** is recommended for engineering students. It gives simultaneous visibility to the creative creation canvas and active project obligations, mirroring the workflow of professional engineering tools (like Figma, Linear, or CAD studios) while strictly adhering to Material Design 3 tokens.

*Awaiting your review and layout selection before proceeding to implementation.*

