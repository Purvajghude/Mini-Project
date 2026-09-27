# M3 Expressive Dashboard & Platform Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MESH into an authentic Material 3 Expressive student collaboration platform using the Figma M3 Designlab color roles, an expressive Welcome screen flow, and the wireframe's 3-column desktop and responsive mobile dashboard.

**Architecture:** 
1. Tokens and primitives are updated to the M3 Designlab palette (Iris `#6750A4`, Lilac `#EADDFF`, Slate `#625B71`, Lavender Gray `#E8DEF8`, Rose Mauve `#7D5260`, Blossom Pink `#FFD8E4`, and refined tonal surface containers) with Material Symbols Rounded.
2. The user experience strictly implements the 3-step sequence: `Data Collection (Onboarding) → Welcome Screen (Welcome to MESH) → Live Dashboard`.
3. The Dashboard implements the exact wireframe: Left Navigation Sidebar, Top App Bar with unified search, Center 3D stacked discovery deck with tactile `Nope` (✕), `Maybe` (★), and `Yoppo!` (♡) rating buttons, and a persistent Right Side-Car Panel with an interactive Calendar, "To-Do Today" checklist, and Quick Actions toolbar.

**Tech Stack:** React 18, TypeScript, Vite, Vanilla CSS Design System with M3 Designlab Tokens, Material Symbols Rounded.

## Global Constraints
- Preserve API contracts: Do NOT modify backend code or `contracts/openapi.yaml`.
- Motion physics deferred: Use standard, clean CSS transitions (`180ms - 250ms ease`) without complex bouncy physics.
- Color fidelity: Adhere strictly to the hex values from the Figma Designlab reference (`#6750A4`, `#EADDFF`, `#625B71`, `#E8DEF8`, `#7D5260`, `#FFD8E4`).
- No generic SaaS slop: Tonal elevation over heavy drop shadows; distinct M3 shape scales.

---

### Task 1: Update Material 3 Designlab Color Scheme & Font Assets

**Files:**
- Modify: `index.html`
- Modify: `src/theme/tokens.css`

**Interfaces:**
- Consumes: Google Fonts CDN for `Material Symbols Rounded` and `Roboto Flex`.
- Produces: Global CSS variables `--md-sys-color-primary` (`#6750A4`), `--md-sys-color-secondary` (`#625B71`), `--md-sys-color-tertiary` (`#7D5260`), surface containers (`#FEF7FF`, `#F7F2FA`, `#F3EDF7`, `#ECE6F0`, `#E6E0E9`), and rating action container tokens.

- [ ] **Step 1: Update `index.html` with Material Symbols Rounded & Font Link**
Add the Google Fonts stylesheet link for `Material Symbols Rounded` and `Roboto Flex`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@300;400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Update `src/theme/tokens.css` with Designlab Hex Values**
Replace previous blue tokens with the official M3 Designlab palette:
```css
:root {
  /* Primary - High Emphasis */
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #EADDFF;
  --md-sys-color-on-primary-container: #21005D;

  /* Secondary - Supporting Emphasis / Nav Pills */
  --md-sys-color-secondary: #625B71;
  --md-sys-color-on-secondary: #FFFFFF;
  --md-sys-color-secondary-container: #E8DEF8;
  --md-sys-color-on-secondary-container: #1D192B;

  /* Tertiary - Contrast & Accent */
  --md-sys-color-tertiary: #7D5260;
  --md-sys-color-on-tertiary: #FFFFFF;
  --md-sys-color-tertiary-container: #FFD8E4;
  --md-sys-color-on-tertiary-container: #31111D;

  /* Surfaces & Tonal Containers */
  --md-sys-color-surface: #FEF7FF;
  --md-sys-color-on-surface: #1D1B20;
  --md-sys-color-surface-variant: #E7E0EC;
  --md-sys-color-on-surface-variant: #49454F;
  --md-sys-color-surface-container-lowest: #FFFFFF;
  --md-sys-color-surface-container-low: #F7F2FA;
  --md-sys-color-surface-container: #F3EDF7;
  --md-sys-color-surface-container-high: #ECE6F0;
  --md-sys-color-surface-container-highest: #E6E0E9;
  --md-sys-color-outline: #79747E;
  --md-sys-color-outline-variant: #CAC4D0;

  /* Rating Action Tokens */
  --action-nope-container: #FFD8E4;
  --action-nope-on-container: #BA1A1A;
  --action-maybe-container: #FFF0D4;
  --action-maybe-on-container: #7A5900;
  --action-yoppo-container: #D4F8D3;
  --action-yoppo-on-container: #0B6B2B;

  /* Shapes */
  --md-sys-shape-corner-xs: 4px;
  --md-sys-shape-corner-sm: 8px;
  --md-sys-shape-corner-md: 12px;
  --md-sys-shape-corner-lg: 16px;
  --md-sys-shape-corner-xl: 24px;
  --md-sys-shape-corner-2xl: 28px;
  --md-sys-shape-corner-full: 999px;

  /* Standard transitions */
  --md-sys-motion-standard: 200ms cubic-bezier(0.2, 0, 0, 1);
}
```

- [ ] **Step 3: Verify build with updated tokens**
Run: `npm run build`
Expected: Successful compile without CSS syntax errors.

- [ ] **Step 4: Commit**
```bash
git add index.html src/theme/tokens.css
git commit -m "style: apply Material 3 Designlab color roles and font assets"
```

---

### Task 2: Create MaterialSymbol Primitive & Update M3 Components

**Files:**
- Create: `src/components/m3/MaterialSymbol.tsx`
- Modify: `src/components/m3/index.ts`
- Modify: `src/components/m3/m3.css`
- Modify: `src/components/m3/Button.tsx`
- Modify: `src/components/m3/Card.tsx`

**Interfaces:**
- Consumes: Material Symbols Rounded font family.
- Produces: `<MaterialSymbol name="..." fill={boolean} size={number} className="..." />` component.

- [ ] **Step 1: Create `src/components/m3/MaterialSymbol.tsx`**
```tsx
import React from 'react';

interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  size?: number;
  color?: string;
}

export const MaterialSymbol: React.FC<MaterialSymbolProps> = ({
  name,
  fill = false,
  weight = 400,
  grade = 0,
  size = 24,
  color,
  style,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`,
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: 1,
        color: color || 'currentColor',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        ...style,
      }}
      {...props}
    >
      {name}
    </span>
  );
};
```

- [ ] **Step 2: Export `MaterialSymbol` from `src/components/m3/index.ts`**
Export `MaterialSymbol` alongside existing M3 primitives.

- [ ] **Step 3: Update `src/components/m3/m3.css` for Designlab Active States**
Ensure navigation pills, buttons, and card states utilize `--md-sys-color-secondary-container` and Designlab surface tiers.

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: Clean build with zero TypeScript errors.

- [ ] **Step 5: Commit**
```bash
git add src/components/m3/MaterialSymbol.tsx src/components/m3/index.ts src/components/m3/m3.css src/components/m3/Button.tsx src/components/m3/Card.tsx
git commit -m "feat(m3): add MaterialSymbol component and update M3 styling tokens"
```

---

### Task 3: Build the Welcome Screen (`WelcomeView.tsx`)

**Files:**
- Create: `src/views/WelcomeView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Current authenticated user info (`User`).
- Produces: Full-screen celebratory welcome view with M3 expressive graphic shapes and "Enter Dashboard" button.

- [ ] **Step 1: Create `src/views/WelcomeView.tsx`**
Implement the Welcome Screen matching the wireframe:
- Header graphic: Collage of M3 expressive shapes (pill shapes, scalloped badges, rounded blocks in `#EADDFF`, `#FFD8E4`, and `#E8DEF8`).
- Welcome Headline: "Welcome to MESH, {user.name}!"
- Primer message explaining the unified discovery deck, peer collaboration, and project management.
- Quick feature pill highlights ("Collaborate across faculties", "Verified GitHub portfolios", "Integrated team tools").
- Prominent M3 Filled Button: **"Enter Dashboard"** with forward arrow symbol.

- [ ] **Step 2: Wire Welcome Screen state in `src/App.tsx`**
Add state: `const [showWelcome, setShowWelcome] = useState<boolean>(false);`
- If user completes registration & onboarding, set `showWelcome(true)`.
- When user clicks "Enter Dashboard", set `showWelcome(false)`.
- Add "Replay Welcome Experience" option in the user menu so it can be viewed at any time.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/views/WelcomeView.tsx src/App.tsx
git commit -m "feat: implement M3 Welcome Screen flow with expressive graphic forms"
```

---

### Task 4: Build Right Side-Car Panel Widgets (Calendar, To-Do Today, Quick Actions)

**Files:**
- Create: `src/components/dashboard/CalendarWidget.tsx`
- Create: `src/components/dashboard/TodoWidget.tsx`
- Create: `src/components/dashboard/QuickActionsToolbar.tsx`

**Interfaces:**
- Consumes: `TaskItem` data model and project deadlines.
- Produces: Interactive Calendar with month switching, live interactive task checklist with strikethrough, and quick tool action triggers.

- [ ] **Step 1: Create `src/components/dashboard/CalendarWidget.tsx`**
- Header: Month switcher `< September 2026 >` (support previous/next navigation).
- 7-column weekday headers: `M`, `T`, `W`, `T`, `F`, `S`, `S`.
- Calendar grid with days:
  - Today's date (15th) highlighted with a filled primary circle (`#6750A4`) and white text.
  - Dates with team project milestones display small dot badges.
  - Interactive click on any date selects it and shows milestone events below the grid.

- [ ] **Step 2: Create `src/components/dashboard/TodoWidget.tsx`**
- Header: `To do today (By team/stuff)`.
- List of actionable items with M3 checkboxes:
  - "Review ML model PR for Autonomous Rover" (`[Autonomous Rover]`)
  - "Submit sprint velocity report" (`[Core Team]`)
  - "Sync with Maya on design tokens" (`[MESH Redesign]`)
  - "Schedule project architecture review" (`[Personal]`)
- Toggling checkbox toggles task status (`DONE` / `TODO`) and persists state.

- [ ] **Step 3: Create `src/components/dashboard/QuickActionsToolbar.tsx`**
- Four circular tactile action buttons:
  - `[📄] Notes`: Open a quick memo pad dialog.
  - `[📅] Schedule`: Jump to full Project Milestones calendar view.
  - `[🔔] Alerts`: Trigger incoming connection requests panel.
  - `[ + ] FAB`: High-emphasis primary action opening Quick Create modal (New Task or Project).

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/dashboard/CalendarWidget.tsx src/components/dashboard/TodoWidget.tsx src/components/dashboard/QuickActionsToolbar.tsx
git commit -m "feat(dashboard): create Calendar, Todo Today, and Quick Actions widgets"
```

---

### Task 5: Build Center Stacked Discovery Deck with Tactile Rating Actions

**Files:**
- Create: `src/components/dashboard/StackedDeck.tsx`
- Modify: `src/api/mockAdapter.ts` (if blended deck helper needed)

**Interfaces:**
- Consumes: Student candidate profiles and open project listings.
- Produces: Interactive stacked 3D card deck with `< ● ● ● ● >` pagination, keyboard arrow shortcuts, and `Nope` (✕), `Maybe` (★), and `Yoppo!` (♡) buttons.

- [ ] **Step 1: Create `src/components/dashboard/StackedDeck.tsx`**
- Structure:
  - Stack container rendering 3 overlapping layers (base cards with offset `translateY(-12px)`, `-24px`, and subtle scale down).
  - Main Top Card:
    - Left side: Avatar (verified GitHub student avatar or project domain banner).
    - Right side: Title (Student Name / Project Name), Description snippet, Domain chips, Synergy score badge (e.g. `94% Synergy`).
  - Pagination row: `<` indicators `● ● ● ●` `>`.
  - Rating Action Row:
    - **Nope** `( ✕ )`: 64px circular button with soft rose container (`#FFD8E4`), deep red glyph (`#BA1A1A`), label "Nope".
    - **Maybe** `( ★ )`: 64px circular button with soft amber container (`#FFF0D4`), gold glyph (`#7A5900`), label "Maybe".
    - **Yoppo!** `( ♡ )`: 64px circular button with soft green container (`#D4F8D3`), emerald heart glyph (`#0B6B2B`), label "Yoppo!".
  - Keyboard listener:
    - `ArrowLeft` triggers Nope.
    - `ArrowUp` triggers Maybe.
    - `ArrowRight` triggers Yoppo!.
  - Connect actions with feedback snackbar toast and card advance.

- [ ] **Step 2: Verify build**
Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add src/components/dashboard/StackedDeck.tsx
git commit -m "feat(dashboard): implement stacked discovery deck with tactile Nope, Maybe, Yoppo actions"
```

---

### Task 6: Assemble 3-Column Desktop Dashboard & Responsive Mobile Dashboard

**Files:**
- Create: `src/views/DashboardView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `StackedDeck`, `CalendarWidget`, `TodoWidget`, `QuickActionsToolbar`, and `MaterialSymbol`.
- Produces: The primary Dashboard view matching the wireframe on both desktop and mobile viewports.

- [ ] **Step 1: Create `src/views/DashboardView.tsx`**
- Implement desktop 3-column layout:
  - **Left Rail**: Cube Logo `[⬡] MESH`, Nav destinations (`Discover`, `Community`, `Chat`, `Projects`), Bottom User Profile card with avatar.
  - **Center Area**:
    - Top App Bar: Pill search input `Search for items, people, projects...`, notification bell with badge, user menu trigger.
    - Center Stage: `StackedDeck`.
  - **Right Side-Car Panel**:
    - `CalendarWidget`
    - `TodoWidget`
    - `QuickActionsToolbar`
- Implement mobile layout:
  - Top header with hamburger button `[≡]`, Cube logo, search button, bell icon.
  - Side-slide drawer navigation with scrim backdrop.
  - Responsive full-width stacked deck.
  - Mobile bottom navigation bar (`Home`, `Community`, `Chat`, `Projects`, `Profile`).
  - Mobile "Tools" modal/panel displaying Calendar + Today's To-Do list when triggered.

- [ ] **Step 2: Update `src/App.tsx` to mount `DashboardView` as main hub**
Ensure active navigation seamlessly switches between `Discover` (the Dashboard), `Community`, `Chat`, `Projects`, and `Profile`.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/views/DashboardView.tsx src/App.tsx
git commit -m "feat: assemble 3-column desktop and responsive mobile dashboard view"
```

---

### Task 7: Platform-Wide Designlab Polish & End-to-End Verification

**Files:**
- Modify: `src/views/ConnectionsView.tsx`
- Modify: `src/views/ProjectsView.tsx`
- Modify: `src/views/ProfileView.tsx`
- Modify: `src/views/AuthView.tsx`

**Interfaces:**
- Consumes: Updated M3 Designlab color tokens and `MaterialSymbol` icons.
- Produces: Visually unified student platform free of legacy colors or mismatched icon sets.

- [ ] **Step 1: Update AuthView & Onboarding styling**
Ensure login, register, and onboarding dialogs reflect the M3 Designlab Iris/Lilac/Slate aesthetic and use `MaterialSymbol`.

- [ ] **Step 2: Update Connections, Chat, Projects, and Profile views**
Align all secondary views with the M3 Designlab surface tokens and icons so the entire application feels like a unified Google Pixel experience.

- [ ] **Step 3: Run full build and verify**
Run: `npm run build`
Expected: Clean build in <1s.

- [ ] **Step 4: Commit**
```bash
git add src/views/
git commit -m "style: unify Community, Projects, Profile, and Auth views with M3 Designlab palette"
```
