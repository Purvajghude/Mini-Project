# MESH 2.0 — UX Architecture & End-to-End Product Flow

**Tagline:** From Ideas to Teams  
**Design Direction:** Material 3 Expressive × Creative Project Workbench  
**Primary Users:** Engineering College Students, Project Creators, Potential Collaborators  

---

## 1. Information Architecture & Navigation

### Current vs. MESH 2.0 Navigation

```
CURRENT (People-First):
Landing -> Discover (Candidate Stack) -> Connections -> Projects (Kanban Only) -> Resources -> Settings

MESH 2.0 (Project-First):
Global Topbar / Rail: [ 🚀 Start a Project ] (High Emphasis CTA)
├── 📂 Projects (/projects) [Primary Default for Builders]
│   ├── Active Workspaces (Member or Owner)
│   ├── Recruiting Projects (Seeking Collaborators)
│   └── Draft Blueprints
├── 🧭 Discover (/discover)
│   ├── Project Board (Explore open engineering projects needing your skills)
│   └── Collaborator Directory (Find peers by technical competency)
├── 🤝 Network & Invites (/network)
│   ├── Project Invitations (Incoming & Sent)
│   └── Established Connections & Chats
├── 👤 Profile (/profile)
│   └── Technical Skills, GitHub Evidence, Availability
└── ⚙️ Settings (/settings)
```

---

## 2. The 7-Stage Core Product Flow

```mermaid
flowchart TD
    S1[Stage 1: Idea Entry] -->|POST /project-blueprints/suggestions| S2[Stage 2: Editable Blueprint]
    S2 -->|Student customizes skills & team size| S3[Stage 3: Skill Gap Analysis]
    S3 -->|Creator confirms gaps & clicks 'Find Team'| S4[Stage 4: Team Suggestions]
    S4 -->|Interactive adjustments & candidate swaps| S5[Stage 5: Team Simulator]
    S5 -->|POST /projects/{id}/invitations| S6[Stage 6: Invitation Dispatch]
    S6 -->|Candidate accepts invitation| S7[Stage 7: Project Workspace]
```

### Stage 1: Idea Entry (`/projects/new`)
- **UX Intent:** Help the student formulate their idea without intimidating technical jargon or magical AI claims.
- **UI Components:**
  - Clear, grounded header: *"What do you want to build?"*
  - Natural language input card (TextArea, up to 2000 chars) with character counter.
  - Optional starter presets: *"Autonomous Robot"*, *"Campus Mobile App"*, *"Distributed IoT System"*, *"AI Study Assistant"*.
  - Optional domain dropdown (e.g. `AI & Robotics`, `Campus Infrastructure`, `Civic & Social Impact`).
  - Action button: `[ Generate Project Blueprint ]` with subtle loading spinner.

### Stage 2: Editable Blueprint
- **UX Intent:** Display MESH's deterministic blueprint suggestion as an editable working draft.
- **UI Components:**
  - **Title & Summary:** Inline-editable fields.
  - **Target Team Size:** Stepper control ($1 \dots 8$ members), defaults to backend suggestion.
  - **Requirements Grid:** List of required competencies with:
    - Skill Name (`skillName`)
    - Minimum Proficiency Selector ($1 \dots 5$, rendered as discrete competency pips: 1=Beginner, 3=Competent, 5=Expert).
    - Importance Toggle (`REQUIRED` vs `PREFERRED`).
    - Note / Context field (e.g. *"Will lead the ROS2 navigation stack"*).
    - Remove button & `[+ Add Skill Requirement]` searchable chip picker.
  - **Assumptions Panel:** Informative callout listing technical assumptions made by the template engine.
  - Action: `[ Save & Analyze Skill Gaps ]`.

### Stage 3: Skill Gap Analysis
- **UX Intent:** Transparently evaluate what the creator already brings vs. what must be recruited.
- **UI Components:**
  - Three distinct status groups:
    1. **Covered by You:** Skills the creator possesses at or above minimum proficiency (with green check badge).
    2. **Skill Gaps (Need Collaborators):** Required skills missing from the creator's profile (with amber accent badge).
    3. **Learning Opportunities:** Skills where the creator is below minimum proficiency, indicating a desire to learn alongside a more experienced peer.
  - Explicit metric: *"You cover 2 of 5 requirements. 3 positions open."* (No synthetic match percentages).
  - Action: `[ Find Teammates ]`.

### Stage 4 & 5: Team Formation & Team Simulator
- **UX Intent:** Allow the creator to inspect, compare, and simulate alternative team combinations.
- **UI Components:**
  - **Alternative Selector:** Toggle between Alternative 1, 2, and 3 (ranked by backend optimization).
  - **Candidate Contribution Cards:**
    - Student avatar, name, department, year of study.
    - **Covered Requirements:** Visual chips showing exactly which project skill this candidate fulfills.
    - **GitHub Supporting Evidence:** Badge indicating verified public commits or repos in the target domain.
    - **Availability Status:** Badge showing `COMPATIBLE` (sufficient mutual time overlap) vs `UNKNOWN`.
    - **Learning Interests:** Topics the candidate wants to learn.
  - **Simulation Controls:**
    - Team size adjustor.
    - Swap candidate button: View alternative candidates who satisfy the same requirement gap.
    - Pin candidate toggle: Lock a candidate in place while re-simulating the remaining slots.

### Stage 6: Invitations & Status Management
- **UX Intent:** Convert the simulated team into real recruitment invitations.
- **UI Components:**
  - Invitation modal previewing each selected candidate, their assigned skill focus, and an optional personalized note.
  - Dispatched invitation dashboard in the project view:
    - `PENDING` (Waiting for response).
    - `ACCEPTED` (Candidate joins workspace automatically).
    - `DECLINED` (Allows 1-click fallback to the next best candidate from the simulator).

### Stage 7: Project Workspace
- **UX Intent:** Provide an organized execution hub once collaborators accept.
- **UI Components:**
  - **Header:** Project title, lifecycle badge (`RECRUITING`, `ACTIVE`, `COMPLETED`), and target vs. current member count.
  - **Discord Collaboration Card:** Prominent launch button to the project's Discord voice/text channel.
  - **Team Roster:** Shows all confirmed members, their covered technical domains, and owner controls.
  - **Execution Workspace:** Preserved and upgraded Task Kanban board, Calendar events, and Availability polls.

