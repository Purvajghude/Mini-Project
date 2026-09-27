# MESH Material 3 Expressive Dashboard & Platform Redesign

## 1. Executive Summary & Goals
This document specifies the redesign of the **MESH** student collaboration platform based on the **Material 3 Expressive Design System** (`docs/superpowers/material 3.md`), the user's wireframe diagrams for desktop and mobile, and the Figma M3 Designlab color roles reference.

The redesign achieves three key objectives:
1. **Adhere to the Figma M3 Designlab Scheme**: Update tokens and components to the authentic M3 color roles (Iris Purple `#6750A4`, Lilac `#EADDFF`, Slate `#625B71`, Lavender Gray `#E8DEF8`, Rose Mauve `#7D5260`, Blossom Pink `#FFD8E4`, and refined surface containers `#FEF7FF`, `#F7F2FA`, `#F3EDF7`).
2. **Implement the 3-Step Journey**:
   $$\text{Data Collection (Onboarding)} \longrightarrow \text{Welcome Screen (Celebration & Onboarding Primer)} \longrightarrow \text{Actual Dashboard}$$
3. **Build the Wireframe Dashboard Layout**:
   - **Desktop**: 3-column architecture containing a collapsible Left Navigation Rail, a Top App Bar with unified search, a central 3D stacked discovery deck with tactile rating buttons (`Nope`, `Maybe`, `Yoppo!`), and a persistent Right Side-Car Panel featuring an interactive Calendar, a live "To-Do Today" checklist, and a Quick Actions toolbar.
   - **Mobile**: Responsive adaptive layout featuring a compact top bar with a slide-in navigation drawer, full-width swipeable cards with bottom navigation, and a dedicated mobile "Tools" panel.

---

## 2. Design System: Tokens & Primitives

### 2.1 Color Scheme & Semantic Roles
Aligned with the M3 Designlab specification:
- **Primary Roles (High Emphasis, Main Actions)**:
  - `--md-sys-color-primary`: `#6750A4`
  - `--md-sys-color-on-primary`: `#FFFFFF`
  - `--md-sys-color-primary-container`: `#EADDFF`
  - `--md-sys-color-on-primary-container`: `#21005D`
- **Secondary Roles (Supporting Emphasis, Selected States, Navigation Pills)**:
  - `--md-sys-color-secondary`: `#625B71`
  - `--md-sys-color-on-secondary`: `#FFFFFF`
  - `--md-sys-color-secondary-container`: `#E8DEF8`
  - `--md-sys-color-on-secondary-container`: `#1D192B`
- **Tertiary Roles (Contrasting Accents, High Attention)**:
  - `--md-sys-color-tertiary`: `#7D5260`
  - `--md-sys-color-on-tertiary`: `#FFFFFF`
  - `--md-sys-color-tertiary-container`: `#FFD8E4`
  - `--md-sys-color-on-tertiary-container`: `#31111D`
- **Surfaces & Tonal Elevation Hierarchy**:
  - `--md-sys-color-surface`: `#FEF7FF`
  - `--md-sys-color-on-surface`: `#1D1B20`
  - `--md-sys-color-surface-variant`: `#E7E0EC`
  - `--md-sys-color-on-surface-variant`: `#49454F`
  - `--md-sys-color-surface-container-lowest`: `#FFFFFF`
  - `--md-sys-color-surface-container-low`: `#F7F2FA`
  - `--md-sys-color-surface-container`: `#F3EDF7` (Standard cards and side panels)
  - `--md-sys-color-surface-container-high`: `#ECE6F0`
  - `--md-sys-color-surface-container-highest`: `#E6E0E9`
  - `--md-sys-color-outline`: `#79747E`
  - `--md-sys-color-outline-variant`: `#CAC4D0`
- **Rating Action Semantic Colors**:
  - **Nope (✕)**: Container `#FFD8E4` (Tertiary container / soft rose), Icon `#BA1A1A` (Error / red)
  - **Maybe (★)**: Container `#FFF0D4` (Warm amber), Icon `#7A5900` (Gold amber)
  - **Yoppo! (♡)**: Container `#D4F8D3` (Soft mint emerald), Icon `#0B6B2B` (Emerald green)

### 2.2 Typography & Iconography
- **Typography Scale**: Material 3 type hierarchy (`display-large/medium/small`, `headline-large/medium/small`, `title-large/medium/small`, `body-large/medium/small`, `label-large/medium/small`) using standard Google Sans / Roboto Flex font families with clear optical sizing.
- **Iconography**: Material Symbols Rounded font loaded via Google Fonts CDN, with CSS variable support for `'FILL' 0` (outline) and `'FILL' 1` (selected/active).

### 2.3 Shapes & Containment
- **Shape Scale**:
  - Small elements (chips, input icons): `8px - 12px`
  - Medium cards & dialogs: `16px - 20px`
  - Large container panels (Calendar, Tasks, Side-Car): `24px`
  - Central discovery cards: `28px`
  - Action buttons & navigation pills: `999px` (Full pill / circular)
- **Transitions**: Standard ease transitions (`cubic-bezier(0.2, 0.0, 0, 1.0)`, duration `180ms - 250ms`). Advanced motion physics deferred per user instruction.

---

## 3. Experience Flow & Screen Progression

### 3.1 Flow Architecture
```text
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   1. Data Collection    │ ───> │    2. Welcome Screen    │ ───> │   3. Actual Dashboard   │
│   (Onboarding Wizard)   │      │ (MESH Primer & Graphic) │      │  (3-Column Discovery)   │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **Data Collection (Onboarding Wizard)**:
   - For new users or uncompleted profiles: 4 steps covering Academics (University, Major, Year), Skills catalog with 1–5 level dials, Availability & Bio, and GitHub profile handle.
   - Upon completion, transitions immediately to Step 2.
2. **Welcome Screen (`WelcomeView`)**:
   - Full-page hero experience designed with M3 expressive organic graphic forms (matching the Designlab Cover layout with rounded shapes in soft lilac, blossom pink, and slate).
   - Headline: "Welcome to MESH" with personalized greeting.
   - Subhead: "Your academic launchpad for finding project partners, building teams, and coordinating milestones."
   - Visual illustration / graphic collage using pure CSS M3 shapes.
   - Primary Filled Action: **"Enter Dashboard"** button (navigates to live dashboard).
   - Replay trigger available in Settings & Profile menu ("Replay Welcome Experience").
3. **Actual Dashboard (`DashboardView`)**:
   - The primary collaborative workspace featuring the wireframe's 3-column desktop layout or adaptive mobile layout.

---

## 4. Dashboard Architecture & Components

### 4.1 Desktop Dashboard (3-Column Layout)

#### A. Left Navigation Sidebar
- **Header**: Cube Logo `[⬡]` + **MESH** branding.
- **Destinations**:
  - `Discover`: Central card discovery deck (Home).
  - `Community`: Connected peers, pending invitations, student directory.
  - `Chat`: Active direct messages & project channels.
  - `Projects`: Project explorer, Kanban workspace, and team availability polls.
- **Active Indicator**: Material 3 pill with `secondary-container` background (`#E8DEF8`) and `on-secondary-container` text (`#1D192B`).
- **Footer**: Profile badge card showing avatar, student name, and university tag, clicking which opens the user's Profile & Settings.

#### B. Top App Bar
- **Global Search**: Centered search bar with rounded pill geometry (`--radius-full`) and search icon: `Search for items, people, projects...`. Supports real-time filtering of the deck and directory.
- **Actions**:
  - Notification bell with unread badge count.
  - User avatar with dropdown menu: View Profile, Settings, Replay Welcome Screen, Sign Out.

#### C. Center Discovery Stage (Stacked Card Deck)
- **Stacked Card Geometry**:
  - Visual depth stack with 3 visible physical layers:
    - Top card: `scale(1.0)`, `translateY(0px)`, z-index 3.
    - Second card: `scale(0.96)`, `translateY(-12px)`, z-index 2, opacity 0.85.
    - Third card: `scale(0.92)`, `translateY(-24px)`, z-index 1, opacity 0.65.
- **Blended Feed Content**:
  - Automatically mixes **Student Peer Candidates** and **Open Project Listings**.
  - **Student Card**: Verified GitHub avatar / portrait, student name, major & year, bio snippet, competency chips with star levels, and "Why this match?" synergy badge (e.g. `94% Synergy`).
  - **Project Card**: Project domain banner, title, mission snippet, required open roles, deadline/milestone tag, and compatibility indicator.
- **Pagination & Navigation**:
  - Centered pagination indicators: `< ● ● ● ● >` with active dot expansion.
- **Tactile Action Buttons**:
  - **Nope** `( ✕ )`: Circular `64px` button with soft rose container (`#FFD8E4`), deep red glyph (`#BA1A1A`), label `Nope`.
  - **Maybe** `( ★ )`: Circular `64px` button with soft amber container (`#FFF0D4`), gold star glyph (`#7A5900`), label `Maybe`.
  - **Yoppo!** `( ♡ )`: Circular `64px` button with soft mint container (`#D4F8D3`), emerald heart glyph (`#0B6B2B`), label `Yoppo!`.
  - Keyboard accessibility: `ArrowLeft` (Nope), `ArrowUp` (Maybe), `ArrowRight` (Yoppo!).
  - Live feedback toast upon rating (e.g., "Connection request sent to Alex Chen!").

#### D. Right Side-Car Panel
- **1. Calendar Card**:
  - Container: `surface-container` (`#F3EDF7`) with `24px` radius.
  - Month switcher: `< September 2026 >` with previous/next controls.
  - 7-column weekday matrix (`M T W T F S S`).
  - Day cells showing day numbers, with dot badges on milestone due dates, and a filled primary circle (`#6750A4`) on today's active day.
  - Clicking a date reveals active tasks or team milestones scheduled for that day.
- **2. "To-Do Today (By team/stuff)" Card**:
  - Interactive task checklist syncing with the persistent project Kanban tasks and student goals.
  - Each task displays a custom M3 checkbox, task title, and team/project label tag.
  - Toggling a checkbox marks the task complete with line-through animation and updates the central mock database.
- **3. "Other Tools / Quick Actions" Toolbar**:
  - Circular icon buttons:
    - `[📄] Notes`: Opens a quick scratchpad memo modal.
    - `[📅] Schedule`: Navigates to full project milestone timeline.
    - `[🔔] Alerts`: Toggles incoming connection requests & notifications drawer.
    - `[ + ] FAB`: High-emphasis primary FAB opening the Quick Create dialog (Create Project or Add Task).

---

### 4.2 Mobile Responsive Layout

- **Main Screen (Compact Viewport)**:
  - Header: Hamburger menu button `[≡]`, Cube Logo `MESH`, Search trigger `[🔍]`, Notification bell `[🔔]`.
  - Center: Full-width stacked discovery card with pagination indicators and `Nope` / `Maybe` / `Yoppo!` buttons.
  - Bottom Navigation Bar (5 destinations): `Home`, `Community`, `Chat`, `Projects`, `Profile`.
- **Slide-in Navigation Drawer**:
  - Triggered by hamburger menu `[≡]` with dark scrim backdrop.
  - Displays Logo, Navigation items (`Home`, `Discover`, `Community`, `Chat`, `Projects`), divider, and utility links (`Profile`, `Settings`, `Logout`).
- **Mobile Tools Screen / Panel**:
  - Accessible via top-bar tool icon or quick-action bar: displays the **Calendar** and **To-Do Today** cards in an optimized scrollable single-column layout on mobile devices.

---

## 5. State Management & API Integration

- **Data Models**:
  - `DeckItem`: Blended type supporting both `CandidateProfile` and `Project` entities with unified rendering fields (`id`, `kind`, `title`, `subtitle`, `description`, `tags`, `synergyScore`, `avatarUrl`).
  - `CalendarDateState`: Month, year, selected date, and attached milestones.
  - `DashboardTask`: ID, title, project tag, status (`TODO` vs `DONE`), due date.
- **Mock Database Persistence**:
  - Kept in `localStorage` under `mesh_mock_database_v2`.
  - Ensures tasks marked complete in the dashboard side-car persist into the Projects Kanban board, and connections initiated via `Yoppo!` appear in Community and Chat.
- **Authentication State**:
  - Fully production-style without demo test buttons, maintaining token session in `sessionStorage` and supporting clean login, registration, and onboarding.

---

## 6. Implementation Plan & File Touchpoints

1. **`src/theme/tokens.css`**: Update color tokens to the exact M3 Designlab roles (`#6750A4`, `#EADDFF`, `#625B71`, `#E8DEF8`, `#7D5260`, `#FFD8E4`, `#FEF7FF`, etc.).
2. **`index.html`**: Import Material Symbols Rounded font stylesheet from Google Fonts.
3. **`src/components/m3/`**: Ensure all primitives (`Button`, `TextField`, `Card`, `Chip`, `Badge`, `Avatar`, `Navigation`, `Dialog`) use the updated tokens and Material Symbols glyphs.
4. **`src/views/WelcomeView.tsx`**: Create the celebratory Welcome screen with M3 expressive graphic shapes and "Enter Dashboard" trigger.
5. **`src/views/DashboardView.tsx`**: Build the 3-column desktop and responsive mobile dashboard matching the wireframe:
   - Sidebar Navigation Rail & Mobile Drawer
   - Top App Bar with Search & Notifications
   - Stacked Card Deck with `< ● ● ● >` and `Nope` / `Maybe` / `Yoppo!` action buttons
   - Right Side-Car with interactive Calendar, To-Do Today checklist, and Quick Actions toolbar
6. **`src/App.tsx`**: Wire the flow: `Auth → (if onboarding needed: Onboarding) → WelcomeView → DashboardView` with seamless navigation to Community, Chat, Projects, and Profile views.
