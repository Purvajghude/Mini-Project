# System Redesign: Liquid Glass Landing Page & Modern Minimal Neubrutalism Workspace

**Date:** 2026-09-09  
**Status:** Approved  
**Project:** Mesh (Full Stack Academic Collaboration Web Application)

---

## 1. Overview & Context

Mesh is an academic student collaboration and peer-matching platform designed for engineering and interdisciplinary university projects. The application connects students based on complementary skill gaps, shared technical ground, and team coverage.

This design specification details two deliberate visual systems:
1. **The Public Landing Page:** A light-themed, formal, liquid-glass/glassmorphism presentation surface tailored for academic and engineering evaluation.
2. **The Internal Authenticated Workspace:** A decluttered, modern minimal neubrutalism environment using a strict White, Lime, Black, Yellow, and Pink palette, organized as a Split-Screen Studio.

---

## 2. Landing Page Specification (Light Liquid Glass)

### 2.1 Typography
* **Display / Headings:** `Plus Jakarta Sans` (weights 700, 800) – Modern, clean, geometric sans-serif.
* **Body / Technical Labels:** `Inter` (weights 400, 500, 600) – High legibility with tabular metric figures.
* Imported via Google Fonts in `index.html`.

### 2.2 Color & Glass Tokens
* `--lp-canvas`: `#F8F9FD` (clean light background)
* `--lp-surface`: `rgba(255, 255, 255, 0.75)`
* `--lp-surface-elevated`: `rgba(255, 255, 255, 0.88)`
* `--lp-border-specular`: `rgba(255, 255, 255, 0.95)` (top-edge highlight)
* `--lp-border-subtle`: `rgba(15, 23, 42, 0.08)` (bottom-edge definition)
* `--lp-text-primary`: `#0F172A` (deep slate for maximum contrast)
* `--lp-text-muted`: `#475569` (refined slate)
* `--lp-text-faint`: `#94A3B8`
* `--lp-accent-glow`: `radial-gradient(ellipse at top, rgba(224, 231, 255, 0.6) 0%, rgba(236, 253, 245, 0.4) 50%, transparent 80%)`
* `--lp-glass-blur`: `blur(20px) saturate(180%)`
* `--lp-glass-shadow`: `0 20px 40px -15px rgba(15, 23, 42, 0.07), 0 2px 6px rgba(15, 23, 42, 0.04)`

### 2.3 Formal Copy & Structure
* **Terminology Tone:** Professional, academic, engineering-focused. Eliminates colloquial or creative metaphors in favor of precise functional descriptions.
* **Top Navigation:**
  * Brand: `Mesh · Academic Project Collaboration`
  * Links: `Platform Architecture`, `Matching Algorithm`, `Competency Catalog`
  * Action: `Get started` (CTA), `Sign in` (Secondary)
* **Hero Section:**
  * Eyebrow: `ACADEMIC COLLABORATION PLATFORM`
  * Title: `Peer Skill Matching & Project Formation System`
  * Description: `Connect with complementary student researchers and engineers based on verified technical competencies, shared project goals, and interdisciplinary requirements.`
  * Actions: `Get started` (Primary CTA) & `Sign in` (Secondary CTA)
* **Bespoke Glass Ecosystem Graphic (Hero Visual):**
  * Multi-card frosted composition showcasing real platform data:
    * **Matrix Card:** Live match score gauge (`94% Technical Compatibility`), complementary role mapping (`Frontend Lead + Backend Systems Engineer`).
    * **Algorithm Radar/Axis Card:** Visual representation of the 4 scoring axes (Gap Fill, Shared Foundation, Skill Depth, Cross-Disciplinary).
    * **Project Ready Verification Badge:** Glass pill with live status indicator.
* **Core Capabilities Section:**
  * `01. Competency Mapping`: Students profile their verified technical skills and depth.
  * `02. Algorithmic Gap Analysis`: Mesh scores complementary candidates who resolve technical gaps.
  * `03. Structured Project Initiation`: Mutual interest opens direct, authenticated project channels.
* **Algorithm Showcase Section:**
  * Detailed breakdown of the compatibility formula and scoring transparency.

---

## 3. Inside Workspace Specification (Modern Minimal Neubrutalism)

### 3.1 Neubrutalism Design Tokens (`styles.css`)
* `--nb-white`: `#FFFFFF`
* `--nb-canvas`: `#FAFAFA`
* `--nb-black`: `#111111`
* `--nb-lime`: `#CCFF00` (High priority actions, top fit scores, accept button)
* `--nb-yellow`: `#FFE600` (Filters, status alerts, badges)
* `--nb-pink`: `#FF70A6` (Complements, unread counters, tags)
* `--nb-border`: `2.5px solid #111111`
* `--nb-shadow`: `4px 4px 0px #111111`
* `--nb-shadow-hover`: `6px 6px 0px #111111`
* `--nb-shadow-active`: `1px 1px 0px #111111`
* `--nb-radius`: `8px` (clean geometric rounding, not overly bubbly)

### 3.2 Workspace Views (Decluttered Architecture)
* **AppShell Navigation:**
  * High-contrast Neubrutalist sidebar and top header.
  * Crisp black borders, solid white active backgrounds with 3px black offset shadow and lime indicator dot.
* **Discover View (Split-Screen Studio):**
  * Decluttered 2-panel architecture:
    * **Left Pane (58%):** Candidate list with high-contrast cards. Each card highlights the candidate's name, role/department, Lime fit score badge, gap-fill reasoning, and Pink complementary skill tags.
    * **Right Pane (42%, Sticky):** Selected Collaborator Dossier with complete scoring bar chart, availability, bio, and prominent Lime "Send Connection Request" CTA.
    * Removal of overlapping physical decks and redundant cards on one page.
* **Team Builder View:**
  * Two-column layout: Left column contains selectable skill requirement buttons with lime active states; Right column renders the calculated optimal team cards with role fulfillment indicators.
* **Connections & Messages View:**
  * High-contrast split-screen messaging: Left list of peer connections; Right pane displays clean chat messages (Lime bubble for outgoing, White with black border for incoming) and a clean input composer.
* **Help Board (Feed) View:**
  * Clean post cards with Yellow/Pink tag badges, simplified comment composer, and clean profile skill-level dials.
* **Profile View:**
  * Neubrutalist settings layout with clean editable skill pills and health progress meter.

---

## 4. Technical Implementation Files

1. **`index.html`**: Add Google Fonts (`Plus Jakarta Sans` and `Inter`).
2. **`src/pages/Landing.jsx`**: Rebuilt with formal copy, structured glass sections, and responsive layout.
3. **`src/pages/Landing.css`**: Complete light-mode liquid-glass design system with specular highlights, frosted blur surfaces, and subtle mesh gradients.
4. **`src/styles.css`**: Complete overhaul to Minimal Neubrutalism design system tokens and clean decluttered view layouts.
5. **`src/App.jsx`**: Streamlined workspace views into the Split-Screen Studio layout, decluttering Discover, Team Builder, Connections, Feed, and Profile.

---

## 5. Verification & Testing

* **Visual & Responsiveness Testing:** Verify on desktop, tablet, and mobile viewports.
* **Interactive State Verification:** Verify hover/active states of neubrutalist buttons, input fields, and modal/split-screen panels.
* **Functionality Testing:** Confirm that demo mode, sign in, interest request handshake, team generation, messaging, and profile updates work seamlessly without regressions.
