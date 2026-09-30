# Discord Direct DM, Visual Hierarchy Refinement, and Complete Build Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Discord User ID linking with 1-click direct DMs, eliminate redundant subtitle explanations across all pages to sharpen visual hierarchy (especially in Projects), and expand the Build Guides catalog with all projects from `codecrafters-io/build-your-own-x`.

**Architecture:** Extend profile and candidate models with `discordId` (snowflake format) across types, mock data, and onboarding/editing views. Add direct deep links (`discord://users/{id}`) and a gate on peer connection requests. Refactor view templates to eliminate redundant subtitle paragraphs and replace text-heavy role lists with concise chips. Populate `resourcesData.ts` with the full 23-topic Build Your Own X collection.

**Tech Stack:** React 19, TypeScript, Material 3 CSS tokens, Lucide icons, Vite.

## Global Constraints
- Do not introduce TailwindCSS; use standard Vanilla CSS and existing M3 CSS custom properties (`--md-sys-*`).
- Maintain existing API contracts; `discordId` is an optional string field on profile and recommendation models.
- Deep links must support `discord://users/{id}` with web fallback `https://discord.com/users/{id}`.
- All code must build cleanly via `npm run build` with zero TypeScript errors.

---

### Task 1: Model & Data Layer (Types, Demo Data, Mock Adapter)

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/data/demoData.js`
- Modify: `src/api/mockAdapter.ts`

**Interfaces:**
- Produces: `discordId?: string | null` on `Profile`, `UpdateProfileRequest`, `CandidateRecommendation`, and `ConnectionMatch.collaborator`.
- Demo users (Purvaj, Divya, Pooja, Yogesh, Mrunali) all have valid 18-digit Discord snowflake strings.

- [ ] **Step 1: Add discordId to TypeScript interfaces in `src/types/api.ts`**

Update `Profile`, `UpdateProfileRequest`, `CandidateRecommendation`, and `CollaboratorSummary` (or `ConnectionMatch.collaborator`) to include `discordId?: string | null`.

- [ ] **Step 2: Add numeric Discord User IDs to `src/data/demoData.js`**

Add `discordId` to `currentUser` (`'912398492019485716'`), Divya Kokane (`'712398492019485712'`), Pooja Ghule (`'642398492019485713'`), Yogesh Gaikwad (`'512398492019485714'`), and Mrunali Shinde (`'812398492019485715'`).

- [ ] **Step 3: Update `src/api/mockAdapter.ts` to store and return `discordId`**

Update the seed data in `MockApiAdapter` for the current user and candidates with their respective `discordId`, and preserve `discordId` in `updateProfile`.

- [ ] **Step 4: Run build check**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/api.ts src/data/demoData.js src/api/mockAdapter.ts
git commit -m "feat: add discordId to models, demo data, and mock adapter"
```

---

### Task 2: Complete "How to Build X" Resources Expansion

**Files:**
- Modify: `src/data/resourcesData.ts`
- Modify: `src/views/ResourcesView.tsx`

**Interfaces:**
- Produces: Full catalog of 23 "How to build X" guides covering Compilers, OS Kernels, Databases, Git, Docker, Web Browsers, Neural Networks, Emulators, React/Frontend Frameworks, 3D Renderers, BitTorrent, Redis, Physics Engines, Regex Engines, Voxel Engines, Sockets, and Bots.

- [ ] **Step 1: Add all missing Build Your Own X entries to `src/data/resourcesData.ts`**

Append comprehensive entries with valid categories, difficulty levels, tech stacks, and GitHub/Vercel URLs for:
- Build Your Own React / Frontend Framework
- Build Your Own 3D Software Renderer
- Build Your Own Emulator (Chip-8 / Game Boy)
- Build Your Own Regex Engine
- Build Your Own Physics Engine
- Build Your Own Voxel Engine (Minecraft clone)
- Build Your Own Discord Bot / AI Agent
- Build Your Own TCP/IP Network Stack
- Build Your Own Game Engine

- [ ] **Step 2: Remove redundant sub-copy in `src/views/ResourcesView.tsx`**

Remove the explanatory sentence under the hero header (`<p>Follow a clear learning path...</p>`) and under the roadmap topbar to streamline visual hierarchy.

- [ ] **Step 3: Run build check**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/resourcesData.ts src/views/ResourcesView.tsx
git commit -m "feat: expand build guides catalog with complete build-your-own-x collection and clean headers"
```

---

### Task 3: Visual Hierarchy Refinement & Text De-cluttering (Site-wide)

**Files:**
- Modify: `src/views/ProjectsView.tsx`
- Modify: `src/views/DiscoverView.tsx`
- Modify: `src/views/ConnectionsView.tsx`
- Modify: `src/views/ProfileView.tsx`

**Interfaces:**
- Cleaner, modern UI without redundant text lines under main headings.
- Scannable project cards with role chips instead of bulky description blocks.

- [ ] **Step 1: Clean and sharpen `src/views/ProjectsView.tsx`**

- Remove `<p>Discover interdisciplinary projects looking for collaborators...</p>` under "Project Explorer & Teams".
- Replace the verbose `<strong style={{ display: 'block'... }}>Open Collaboration Roles:</strong>` block in project cards with clean, compact role chips.
- Remove redundant subheadings in Kanban columns and Sprint task board.
- Remove unnecessary explanatory text under "Milestones" and "Availability Polls".

- [ ] **Step 2: Clean `src/views/DiscoverView.tsx`**

- Remove `<p>Recommendations adapt to the skills, goals, interests...</p>` beneath page title.
- Remove `<p>Repository language signals increase the fit score after a student links GitHub.</p>` in evidence card.

- [ ] **Step 3: Clean `src/views/ConnectionsView.tsx`**

- Remove redundant subtitle lines under "Meet in MESH. Build in Discord." and section headings.

- [ ] **Step 4: Run build check**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/ProjectsView.tsx src/views/DiscoverView.tsx src/views/ConnectionsView.tsx
git commit -m "style: refine visual hierarchy and remove redundant sub-lines site-wide"
```

---

### Task 4: Discord ID in Onboarding and Profile Management

**Files:**
- Modify: `src/views/OnboardingDialog.tsx`
- Modify: `src/views/ProfileView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `OnboardingDialog`: Discord ID input field on Step 4 with helper guidance.
- `ProfileView`: Discord ID input field in the Profile edit dialog.
- `App.tsx`: Passes `discordId` during `handleOnboardingComplete` and `handleSaveProfile`.

- [ ] **Step 1: Add Discord ID input to `src/views/OnboardingDialog.tsx`**

In Step 4, add a Discord User ID `TextField` with helper text: `"Enter your 18-digit Discord User ID (Enable Developer Mode in Discord &rarr; Right click profile &rarr; Copy User ID)."` Include `discordId` in the `handleFinish` payload.

- [ ] **Step 2: Add Discord ID field to `src/views/ProfileView.tsx`**

In the Profile edit modal, add a `TextField` for Discord User ID so students can view and update it at any time.

- [ ] **Step 3: Connect Discord ID updates in `src/App.tsx`**

Ensure `handleOnboardingComplete` passes `profileUpdates.discordId` to `api.updateProfile` and updates the active user state.

- [ ] **Step 4: Run build check**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/OnboardingDialog.tsx src/views/ProfileView.tsx src/App.tsx
git commit -m "feat: add discord user ID input in onboarding and profile edit"
```

---

### Task 5: Direct DM Action & Connection Gate

**Files:**
- Modify: `src/views/DiscoverView.tsx`
- Modify: `src/views/ConnectionsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- "DM on Discord" button on peer cards (Divya, Pooja, Yogesh, Mrunali) opening `discord://users/{id}` (with fallback).
- Connection prompt modal if the current user attempts to connect without having set their Discord ID.

- [ ] **Step 1: Add "DM on Discord" button and copy action in `src/views/DiscoverView.tsx`**

In the Discover active card and dossier, when `selected.discordId` is present, display:
- Direct button: "DM on Discord" linking to `discord://users/${selected.discordId}` (and web fallback).
- Copy button to copy Discord ID with toast feedback.

- [ ] **Step 2: Add Discord DM action in `src/views/ConnectionsView.tsx`**

On each collaborator match card (e.g. Divya Kokane, Mrunali Shinde), display their Discord ID badge and a direct "Message on Discord" action button.

- [ ] **Step 3: Add Discord Prompt Gate in `src/App.tsx`**

When `handleConnect(candidate)` is triggered: if `!user?.discordId`, open a lightweight dialog asking the user:
`"Add your Discord User ID before connecting so ${candidate.displayName} can easily message you back."`
Once submitted, save their Discord ID and complete the connection request.

- [ ] **Step 4: Run build check**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/DiscoverView.tsx src/views/ConnectionsView.tsx src/App.tsx
git commit -m "feat: add direct discord DM action and connect gate dialog"
```

---

### Task 6: End-to-End Verification & Polish

**Files:**
- Verify: Full web application build and browser run.

- [ ] **Step 1: Full build validation**

Run: `npm run build`
Expected: Build succeeds with 0 errors and output bundle generated.

- [ ] **Step 2: Verification of user flows**
- Verify Discover view has Divya Kokane with Discord ID and DM button.
- Verify Connections view displays Discord message actions for matches.
- Verify Onboarding dialog has Discord ID field.
- Verify Projects page has clean visual hierarchy with no redundant subtitle sentences.
- Verify Build Guides tab shows all 23 How-to-build-X guides.

- [ ] **Step 3: Final commit and summary**

```bash
git status
```
