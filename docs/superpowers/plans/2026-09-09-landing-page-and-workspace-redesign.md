# Landing Page & Minimal Neubrutalism Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Mesh web client into a formal, light-themed liquid-glass landing page and an uncluttered, modern minimal neubrutalism authenticated workspace (white, lime, black, yellow, pink) with a Split-Screen Studio layout.

**Architecture:** 
- The landing page uses a dedicated light-mode liquid-glass design system with specular highlights, frosted blur surfaces, and formal engineering terminology.
- The inside workspace uses a strict minimal neubrutalism design system in `styles.css` with 2.5px solid black borders, 4px hard shadows, and a clean two-panel Split-Screen Studio layout in `App.jsx`.
- Existing backend API contracts, auth states, demo data, and messaging channels are completely preserved.

**Tech Stack:** React 19, Vite, CSS3 (Glassmorphism & Neubrutalism), Google Fonts (Plus Jakarta Sans, Inter), SVG graphics.

## Global Constraints

- Landing Page: Light themed, formal academic/engineering terminology (e.g. "Get started"), liquid glass / glassmorphism, no "AI slop" or generic placeholders.
- Inside Workspace: Minimal neubrutalism, decluttered Split-Screen Studio, color palette strictly featuring White (`#FFFFFF`), Lime (`#CCFF00`/`#A3E635`), Black (`#111111`), Yellow (`#FFE600`), and Pink (`#FF70A6`).
- Zero regressions in Spring Boot / Demo API integrations.

---

### Task 1: Typography Foundation (`index.html`)

**Files:**
- Modify: `c:/Users/Rover/Documents/Github/Redrob/webapp/index.html`

- [ ] **Step 1: Add Google Fonts preconnect and stylesheet links**
  Add preconnect links and Google Fonts stylesheet for `Plus Jakarta Sans:wght@500;600;700;800` and `Inter:wght@400;500;600;700`.
- [ ] **Step 2: Verify `index.html` syntax and preview in browser**
- [ ] **Step 3: Commit**
  ```powershell
  git add index.html; git commit -m "feat: add Plus Jakarta Sans and Inter font pairings"
  ```

---

### Task 2: Light Liquid-Glass Landing Page (`Landing.css` & `Landing.jsx`)

**Files:**
- Modify: `c:/Users/Rover/Documents/Github/Redrob/webapp/src/pages/Landing.css`
- Modify: `c:/Users/Rover/Documents/Github/Redrob/webapp/src/pages/Landing.jsx`

- [ ] **Step 1: Write `Landing.css` light liquid-glass design system**
  Implement CSS tokens:
  - `--lp-canvas: #F8F9FD;`
  - Frosted surface: `rgba(255, 255, 255, 0.72); backdrop-filter: blur(20px) saturate(180%);`
  - Specular gradient border: `rgba(255, 255, 255, 0.95)` to `rgba(15, 23, 42, 0.08)`
  - Dual-layer ambient shadow and subtle liquid mesh gradient underlays.
  - Responsive flex and grid layout with elegant typography scaling.
- [ ] **Step 2: Rebuild `Landing.jsx` with formal copy and bespoke composite glass graphics**
  - Navigation: "Mesh · Peer Skill Collaboration", "Platform Architecture", "Matching Algorithm", "Competency Catalog", "Get started", "Sign in".
  - Hero: Formal headline "Peer Skill Matching & Project Formation System", formal description, "Get started" button.
  - Floating Glass Composite Graphic:
    - Live Match Matrix Card (94% Compatibility, role breakdown).
    - Scoring Axis Radar Card (Gap Fill, Shared Ground, Depth, Category).
    - Project Verification Pill (Project Ready status).
  - Core Capabilities Section: 3 formal numbered cards with glass containers.
  - Algorithm Matrix Breakdown Section: Transparent metric gauges and formal explanations.
  - Call to Action & Footer with formal academic context.
- [ ] **Step 3: Run `npm run build` to verify clean JSX and styling**
- [ ] **Step 4: Commit**
  ```powershell
  git add src/pages/Landing.jsx src/pages/Landing.css; git commit -m "feat: implement light liquid glass landing page with formal terminology"
  ```

---

### Task 3: Modern Minimal Neubrutalism Design System (`styles.css`)

**Files:**
- Modify: `c:/Users/Rover/Documents/Github/Redrob/webapp/src/styles.css`

- [ ] **Step 1: Define Neubrutalism Tokens**
  - `--nb-white: #FFFFFF;`
  - `--nb-canvas: #FAFAFA;`
  - `--nb-black: #111111;`
  - `--nb-lime: #CCFF00;`
  - `--nb-yellow: #FFE600;`
  - `--nb-pink: #FF70A6;`
  - `--nb-border: 2.5px solid #111111;`
  - `--nb-shadow: 4px 4px 0px #111111;`
  - `--nb-shadow-hover: 6px 6px 0px #111111;`
  - `--nb-shadow-active: 1px 1px 0px #111111;`
- [ ] **Step 2: Update Neubrutalist Buttons, Avatars, Badges, and Cards**
  - Button styles: solid black borders, hard offset shadows, snappy hover translation (`translate(-2px, -2px)`).
  - Pill badges: White, Lime, Yellow, and Pink variants with crisp black outlines.
  - Form inputs and textareas: White background, 2.5px solid black border, focus states with 3px yellow glow/offset.
- [ ] **Step 3: Refactor Sidebar and App Shell Navigation**
  - High-contrast sidebar with bold black outlines, active link with Lime highlight and crisp 3px shadow.
- [ ] **Step 4: Run `npm run build` to verify styling syntax**
- [ ] **Step 5: Commit**
  ```powershell
  git add src/styles.css; git commit -m "feat: establish minimal neubrutalism design system in styles.css"
  ```

---

### Task 4: Declutter Workspace & Implement Split-Screen Studio (`App.jsx`)

**Files:**
- Modify: `c:/Users/Rover/Documents/Github/Redrob/webapp/src/App.jsx`

- [ ] **Step 1: Refactor `DiscoverView` into the Split-Screen Studio**
  - Replace cluttered 3D deck stack and multi-layered widgets with a clean 2-column layout:
    - Left Column (58%): Curated collaborator cards with Lime fit badge, gap-fill reasoning, and Pink complementary tags.
    - Right Column (42%, Sticky): Complete selected candidate dossier with 4-part compatibility bar breakdown, full skill matrix, and prominent Lime "Connect" CTA.
    - Clean incoming request alert badge at top.
- [ ] **Step 2: Declutter `TeamBuilder` View**
  - Streamlined 2-panel interface: Left panel has toggleable category skill chips with Lime active states; Right panel displays the optimal minimum team cards with role assignment callouts.
- [ ] **Step 3: Declutter `MatchesView` & `FeedView`**
  - Clean high-contrast chat threads with Lime message bubbles for user, White with black border for peer.
  - Clean post cards with Yellow/Pink tag stamps (`[HELP]`, `[PROJECT]`, `[SHOWCASE]`).
- [ ] **Step 4: Declutter `ProfileView` & `AuthPage`**
  - High-contrast neubrutalist profile editor and sign-in/register cards.
- [ ] **Step 5: Verify build with `npm run build`**
- [ ] **Step 6: Commit**
  ```powershell
  git add src/App.jsx; git commit -m "feat: implement decluttered split-screen studio in App.jsx"
  ```

---

### Task 5: System Verification and Polish

- [ ] **Step 1: Test `npm run build` for zero compilation errors**
- [ ] **Step 2: Test navigation between Landing Page, Auth/Demo, Discover, Team Builder, Connections, Feed, and Profile**
- [ ] **Step 3: Verify responsive layout on mobile and desktop**
- [ ] **Step 4: Final commit and walkthrough documentation**
