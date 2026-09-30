# Design Specification: Discord Integration, Visual Hierarchy Refinement, and Complete Build Guides

- **Date:** 2026-09-30
- **Status:** Approved
- **Scope:** Frontend user connection flows, site-wide typography and visual hierarchy, and Build Guides directory expansion.

---

## 1. Overview & Objectives

1. **Discord Direct DM Connection**:
   - Provide students with direct, friction-free peer collaboration by allowing them to input and link their Discord User ID (numeric snowflake format).
   - Display a direct "DM on Discord" action (`discord://users/{id}` with web fallback `https://discord.com/users/{id}`) on peer cards, discovery dossiers, and active connection views.
   - Require/prompt entering a Discord ID when initiating a connection request if one is not yet set on the user's profile.
   - Include Discord ID setup during Onboarding ([`OnboardingDialog.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/OnboardingDialog.tsx)) as well as in Profile editing ([`ProfileView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ProfileView.tsx)).

2. **Visual Hierarchy & Text De-cluttering (Site-wide)**:
   - Remove redundant explanatory subtitles and paragraph-length helper lines underneath main headings and section headers across the entire platform.
   - Specifically streamline:
     - **Project Explorer & Teams** ([`ProjectsView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ProjectsView.tsx)): Replace bulky text with compact role chips, crisp cards, clean Kanban cards with clear priority pills, assignee avatars, and due dates.
     - **Discover** ([`DiscoverView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/DiscoverView.tsx)): Remove explanatory sub-lines beneath page title, dossier, and evidence badges.
     - **Community & Connections** ([`ConnectionsView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ConnectionsView.tsx)): Remove instructional filler beneath headers.
     - **Build Guides** ([`ResourcesView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ResourcesView.tsx)): Remove generic explanations under roadmap and guide headings.
     - **Profile & Settings** ([`ProfileView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ProfileView.tsx), [`SettingsView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/SettingsView.tsx)): Keep titles strong, concise, and clean.

3. **Complete "How to Build X" Resources Expansion**:
   - Expand [`resourcesData.ts`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/data/resourcesData.ts) to include the full spectrum of curated projects from the `codecrafters-io/build-your-own-x` ecosystem (Git, Docker, Relational Database, Redis, Compilers, Web Servers, Neural Networks, OS Kernels, Shells, React/Frontend Frameworks, BitTorrent, Search Engines, Text Editors, Web Browsers, Blockchain, 3D Renderers, Emulators, Regex Engines, Physics Engines, Voxel Engines).
   - Display them cleanly with category tags, difficulty badges, and direct external reference links.

---

## 2. Architecture & Data Model Changes

### 2.1 Types ([`src/types/api.ts`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/types/api.ts))
- Add `discordId?: string | null` to:
  - `Profile`
  - `UpdateProfileRequest`
  - `CandidateRecommendation`
  - `ConnectionMatch.collaborator`

### 2.2 Demo Data & Mock Adapter ([`src/data/demoData.js`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/data/demoData.js), [`src/api/mockAdapter.ts`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/api/mockAdapter.ts))
- Populate numeric Discord user IDs across demo profiles:
  - Current User (Purvaj Ghude): `912398492019485716`
  - Divya Kokane: `712398492019485712`
  - Pooja Ghule: `642398492019485713`
  - Yogesh Gaikwad: `512398492019485714`
  - Mrunali Shinde: `812398492019485715`

### 2.3 Onboarding Flow ([`src/views/OnboardingDialog.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/OnboardingDialog.tsx))
- Add Discord User ID input in Step 4 alongside the developer profile linking, or as a dedicated step/field with a clear helper note: *"Enter your 18-digit Discord User ID (Enable Developer Mode in Discord &rarr; Right click profile &rarr; Copy User ID)."*
- Save `discordId` during onboarding completion via `onComplete({ ...profileUpdates, discordId })`.

### 2.4 Peer Interaction & Direct DM Action
- **Discover Dossier & Card** ([`DiscoverView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/DiscoverView.tsx)):
  - Show a Discord badge/button when `candidate.discordId` is present:
    - Label: `DM on Discord`
    - Action: opens `discord://users/${candidate.discordId}`, with fallback to `https://discord.com/users/${candidate.discordId}`.
    - Also provide a 1-click icon to copy the Discord ID.
- **Connections & Matches** ([`ConnectionsView.tsx`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/views/ConnectionsView.tsx)):
  - For each active match (e.g. Divya Kokane, Mrunali Shinde), display their Discord ID directly with a prominent "Message on Discord" action.
- **Connection Prompt**:
  - When clicking "Connect" on a candidate: if `currentUser.discordId` is empty, present a lightweight modal asking the user to provide their Discord ID before sending the request, ensuring the recipient can message them back.

---

## 3. Visual Hierarchy & Text Reductions

### 3.1 Principles
- **No decorative subtitles**: Do not repeat or explain what a clear title already communicates.
- **Scannable UI elements**: Replace verbose text boxes with chips, badges, and clean spacing.
- **Strong typography**: Use M3 Display and Headline styles with confident hierarchy.

### 3.2 Key Changes per View
- **`ProjectsView.tsx`**:
  - Remove subtitle under "Project Explorer & Teams".
  - Replace "Open Collaboration Roles:" text block in project cards with clean, color-coded role chips.
  - Simplify team member counters and action buttons.
  - Remove redundant subheadings in Kanban columns and Sprint board.
- **`DiscoverView.tsx`**:
  - Remove paragraph under "Your next collaborator is already in the room".
  - Remove paragraph under "Evidence-aware matching".
  - Clean up dossier explanation text.
- **`ConnectionsView.tsx`**:
  - Remove subtitle under "Meet in MESH. Build in Discord."
  - Simplify community cards and remove multi-line filler copy.
- **`ResourcesView.tsx`**:
  - Remove long introductory paragraphs under page header and roadmap viewers.
- **`ProfileView.tsx` & `SettingsView.tsx`**:
  - Remove instructional paragraphs under card headers. Include direct Discord ID editing.

---

## 4. Build Guides Directory Expansion ([`src/data/resourcesData.ts`](file:///c:/Users/Rover/Documents/Github/Mini%20Project/src/data/resourcesData.ts))

Add all missing major projects from `codecrafters-io/build-your-own-x`:
1. Build Your Own React / Frontend Framework
2. Build Your Own 3D Software Renderer
3. Build Your Own Emulator (Chip-8 / Game Boy)
4. Build Your Own Regex Engine
5. Build Your Own Physics Engine
6. Build Your Own Voxel Engine (Minecraft Clone)
7. Build Your Own Bot / AI Agent
8. Build Your Own TCP/IP Stack
9. Build Your Own Game Engine
10. Build Your Own Redis In-Memory Store
11. Build Your Own BitTorrent Client
12. Build Your Own Web Browser Engine
13. Build Your Own Operating System
14. Build Your Own Command Line Shell
15. Build Your Own Search Engine
16. Build Your Own Text Editor
17. Build Your Own Blockchain & Cryptography
18. Build Your Own Git
19. Build Your Own Docker
20. Build Your Own Relational Database
21. Build Your Own Compiler & Interpreter
22. Build Your Own HTTP Web Server
23. Build Your Own Neural Network & Autograd

Each guide provides:
- Category & Domain
- Technologies & Languages
- Skill tags for MESH profile matching
- Difficulty level badge
- Estimated project timeline
- Direct GitHub source repository link

---

## 5. Verification Plan

1. **Discord Linking**:
   - Verify input during Onboarding, Profile edit, and Settings.
   - Verify peer card shows "DM on Discord" button and clicking it triggers `discord://users/{id}` / `https://discord.com/users/{id}`.
   - Verify connection prompt triggers if user lacks Discord ID.
2. **Visual Hierarchy & Text Cleanliness**:
   - Inspect all views in browser to ensure no redundant explanation lines under titles.
   - Confirm Project cards, Kanban, and Discover cards look modern, scannable, and clean.
3. **Build Guides**:
   - Verify all 20+ "How to build X" items appear in the Build Guides tab with proper tags, search filtering, and external links.
4. **Code Quality**:
   - Run `npm run build` to confirm 0 TypeScript or packaging errors.
