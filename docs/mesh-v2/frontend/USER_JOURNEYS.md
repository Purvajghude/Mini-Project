# MESH 2.0 — User Journeys & Edge-Case Specifications

---

## 1. Primary User Personas

### 1.1. Aarav — The Idea Creator (Junior, Robotics / Mechanical Engineering)
- **Context:** Has an idea for an autonomous campus recycling rover. Strong in CAD, ROS2, and embedded hardware.
- **Goal:** Needs two collaborators: one proficient in Computer Vision (PyTorch/YOLO) and one in Flutter for the mobile monitoring dashboard.
- **Pain Points:** Hard to know who actually has hands-on skills versus who just added buzzwords to a bio. Doesn't want to manage endless cold DMs.
- **Journey:**
  1. Opens MESH and clicks **"Start a Project"**.
  2. Enters: *"Autonomous recycling rover with stereo camera navigation and Flutter mobile app."*
  3. MESH suggests title, team size of 3, and 4 requirements: `ROS2`, `Computer Vision`, `Flutter`, `Embedded C`.
  4. Aarav marks `ROS2` as covered by himself. The Skill Gap Visualizer highlights `Computer Vision` and `Flutter` as recruitment targets.
  5. The Team Simulator suggests Alternative 1: Priya (Vision) and Daniel (Flutter). Both have verified GitHub commits.
  6. Aarav sends both an invite. Within 24 hours, both accept, unlocking the shared workspace and team Discord channel.

### 1.2. Priya — The Specialist Collaborator (Sophomore, Computer Science)
- **Context:** Enjoys PyTorch and edge vision models. Looking for a serious capstone or competition project.
- **Goal:** Find an engineering project that needs real Computer Vision work, not another generic e-commerce app.
- **Pain Points:** Hates joining hackathon teams where the project concept is completely vague.
- **Journey:**
  1. Receives an invitation on MESH: *"Aarav invited you to join Autonomous Recycling Rover as Computer Vision Lead."*
  2. Opens the invite, views the project blueprint, technical requirements, and Aarav's verified skills.
  3. Sees that her weekly availability has a 12-hour mutual overlap with the team.
  4. Clicks **"Accept Invitation"**. She is instantly redirected to the Project Workspace.

---

## 2. Comprehensive Edge-Case Matrices

| UX Edge Case | State Condition | Visual & Functional Handling |
| :--- | :--- | :--- |
| **Empty Candidate Pool** | No candidates in the database cover a rare requirement (e.g., `Rust / Embedded`). | The Team Simulator displays an explicit banner: *"No candidates found with Rust at Proficiency $\ge 3$."* Actions: 1) Lower proficiency threshold to 2, 2) Convert to *Learning Goal* (pair with a mentor), or 3) Edit requirement. |
| **Creator Has Zero Skills** | Creator has not completed onboarding or declared any skills. | The Skill Gap screen informs the creator: *"You haven't listed any technical skills on your profile yet."* Provides an inline quick-add drawer to add 2-3 skills before proceeding. |
| **Invitation Rejection** | An invited candidate declines the project invite. | The project workspace displays a clean badge: *"Priya declined this invitation."* A 1-click button **"Review Alternative Candidates"** reopens the simulator pre-filtered for that specific vacant requirement. |
| **Network Failure During Blueprint** | API timeout or 503 error on `/project-blueprints/suggestions`. | The UI displays an error callout: *"Could not generate blueprint from server. Would you like to start with a blank blueprint?"* Allows manual creation without blocking the student. |
| **Stale Suggestion / Capacity Full** | Another member joined while the creator was looking at suggestions, filling the target team size. | Backend returns `409 Conflict`. The UI displays: *"Team capacity reached. Refreshing project requirements..."* and transitions the project to `ACTIVE`. |
| **Mobile Layout (< 768px)** | Creator accesses the Team Simulator on a smartphone. | The side-by-side alternative comparison collapses into a swipeable tab view or carousel, ensuring full readability of candidate contribution cards without horizontal viewport breaking. |

