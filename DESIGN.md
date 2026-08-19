---
name: Mesh Connect
description: A focused campus collaboration product for finding complementary skills.
colors:
  ink: "#171719"
  ink-soft: "#343438"
  canvas: "#F8F8FA"
  surface: "#FFFFFF"
  surface-muted: "#F0F0F3"
  line: "#DCDCE1"
  muted: "#5E5E66"
  faint: "#85858F"
  signal: "#BD3D25"
  signal-hover: "#9E2F1D"
  success: "#1F6C50"
  danger: "#A22E2A"
  info: "#2559A7"
  line-strong: "#B8B8C0"
  tint-neutral: "#E5E5E9"
  tint-blue: "#DCE8FF"
  tint-blue-ink: "#1D4C93"
  tint-amber: "#FDE2D8"
  tint-amber-ink: "#96351F"
  tint-green: "#DCEFE6"
  tint-info-surface: "#E8EFFD"
  tint-success-surface: "#E6F3ED"
  tint-signal-surface: "#FFF0E9"
  tint-danger-surface: "#FEE9E7"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 12vw, 3.3125rem)"
    fontWeight: 760
    lineHeight: 1.0
    letterSpacing: "-0.04em"
  section:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  subtitle:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 650
    lineHeight: 1.25
  control:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 680
    lineHeight: 1.25
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 620
    lineHeight: 1.4
  micro:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Mesh Connect

## Overview

**Creative North Star: "The Campus Studio"**

Mesh Connect should feel like arriving at a well-run student studio just before a project sprint: calm, organized, and full of potential collaborators. It is a product interface, so familiarity and speed matter more than decoration. The user should understand a profile, a match reason, and their next action at a glance.

The system is restrained rather than monochrome for its own sake. True-neutral surfaces keep the application bright under library or classroom lighting; near-black carries hierarchy; a compact vermilion signal is reserved for decisive collaboration moments. This is not a dating app, a generic AI dashboard, a crypto/finance product, or a dark neon developer tool.

**Key Characteristics:**

- Clear, information-rich layouts with enough space to scan profiles and messages.
- A single reliable component vocabulary across desktop and mobile.
- Complementary skill context takes priority over vanity metrics.
- Motion communicates a response or state change only.

## Colors

The palette uses true neutral layers for long study sessions, then uses color sparingly to signal action and status.

### Primary

- **Studio Ink:** the primary action, navigation, and high-emphasis text color. It anchors the product without making every screen dark.
- **Collaboration Signal:** used only when the user is taking or seeing a meaningful collaboration action such as sending interest or confirming a match.

### Secondary

- **Verified Blue:** informational state, link emphasis, and non-destructive system notices.
- **Completion Green:** success, a completed help request, and positive confirmation.

### Neutral

- **Clear Canvas:** the page background. It is deliberately neutral rather than warm cream.
- **White Surface:** content panels, menus, sheets, and inputs.
- **Quiet Surface:** selected rows, skeletons, disabled fills, and secondary toolbars.
- **Soft Line:** dividers and quiet structural borders.
- **Strong Line:** the heavier border on secondary buttons and outlined controls, where a quiet divider would not read as an edge you can press.

### Tints

The palette above sets structure and status. Two families of soft tints carry identity
and category, and they were shipping without being written down:

- **Identity tints** (`tint-blue`, `tint-amber`, `tint-green`, `tint-neutral`) fill avatars
  behind a person's initials, each paired with a darker ink from the same hue so the
  initials stay legible. They identify a *person*, never a state, and appear nowhere else.
- **Category tints** (`tint-info-surface`, `tint-success-surface`, `tint-signal-surface`,
  `tint-danger-surface`) are the low-saturation surfaces behind status chips: a project
  post, a solved help request, an open ask, a destructive hover. Each pairs with the
  matching solid status colour for its text.

**Both families are surfaces only.** A tint never carries text on its own and never
becomes a page or panel background — that would undo the neutral canvas the rest of the
system depends on.

**The Earned Signal Rule.** The collaboration signal appears on primary moments, never as decoration. A screen with more than two signal-colored controls has lost its hierarchy.

## Typography

**Display Font:** Inter (with ui-sans-serif and system fallbacks)
**Body Font:** Inter (with ui-sans-serif and system fallbacks)

**Character:** One capable sans family keeps labels, data, forms, and conversation surfaces familiar. Headlines are decisive but not oversized; readability matters more than editorial theatrics inside the application.

### Hierarchy

- **Headline:** used for page titles and a profile name on a focused profile view.
- **Title:** used for panel headings, match names, and important row labels.
- **Body:** used for bios, messages, help requests, and explanatory text; prose is capped around 70 characters where possible.
- **Label:** used for field names, metadata, and compact navigation labels.

### The full scale

Four steps were not enough to describe a product this dense, so the ramp documents every
size the interface actually ships:

| Step | Size | Used for |
|---|---|---|
| Display | clamp(38px, 12vw, 53px) | Landing and auth hero headlines only |
| Section | 32px | Page-level section headings inside the app |
| Headline | 28px | Page titles, a profile name on a focused view |
| Subtitle | 21px | Panel headings and prominent row labels |
| Title | 18px | Match names, card headings |
| Body | 15px | Bios, messages, help requests, explanatory copy |
| Control | 14px | Buttons and interactive labels |
| Label | 13px | Field names, metadata, compact navigation |
| Caption | 12px | Chips, timestamps, secondary metadata |
| Micro | 11px | Uppercase eyebrows, counters, tabular figures |

**Known drift.** A handful of one-off heading sizes (17, 20, 22, 26, 27, 30, 39px) still
sit between these steps in `webapp/src/styles.css` — 20px, for example, is the extra-large
avatar's initials. They are legacy, not intentional, and should be folded into the nearest
step the next time the stylesheet is touched. They are recorded here rather than quietly
normalised, because consolidating them changes the rendered result and belongs in its own
pass.

**The Task-First Type Rule.** Do not use display typography inside controls, chips, side navigation, or dense data. Standard product text should disappear into the task.

## Elevation

Surfaces are flat by default. Depth comes from a deliberate contrast between canvas and surface plus a one-pixel line. A small, tight shadow may appear on menus, dialogs, and a dragged/revealed interaction, but broad soft shadows are prohibited.

**The Flat-By-Default Rule.** Never combine a visible border with a decorative wide shadow. A component uses structural line or elevation, not both.

## Components

### Buttons

- **Shape:** gently curved edges (8px radius), never a pill unless the control is a compact tag.
- **Primary:** Studio Ink on White Surface. Use for the page's main task.
- **Signal:** Collaboration Signal on White Surface. Use only for a match/interest moment.
- **Hover / Focus:** 180ms color/transform feedback and a visible 3px focus ring; buttons retain their size and clear label while loading.
- **Secondary / Ghost:** quiet line or text treatment for reversible actions. Do not use destructive-looking red for normal navigation.

### Chips

- **Style:** compact Quiet Surface fill with Soft Line boundary and clear Ink text.
- **State:** selected filters gain an Ink fill; skill chips are descriptive and never act like unexplained badges.

### Cards / Containers

- **Corner Style:** restrained (12px maximum).
- **Background:** White Surface, usually with a Soft Line boundary.
- **Shadow Strategy:** none at rest; menu/dialog only uses a small structural shadow.
- **Internal Padding:** 16px on compact panels and 24px on page-level panels.

### Inputs / Fields

- **Style:** White Surface with a clear Soft Line boundary and predictable label placement.
- **Focus:** Ink or Info outline with a visible focus ring, not a faint color shift alone.
- **Error / Disabled:** error text and icon accompany Danger color; disabled controls use Quiet Surface and retain readable text.

### Navigation

- **Style:** desktop side navigation with clear active state; mobile bottom/navigation drawer with the same labels and icon meanings.
- **State:** current route uses an Ink fill or strong neutral background; hover is quiet and immediate.

## Do's and Don'ts

### Do:

- **Do** make recommendation reasons specific: name the complementary skills before showing a score.
- **Do** use the 8px/12px radius scale and tight state transitions (150-250ms).
- **Do** provide skeletons for loading, useful empty states, keyboard focus, and error recovery.
- **Do** keep text contrast at WCAG 2.1 AA or better against every surface.
- **Do** collapse navigation and reflow content structurally on narrow screens.

### Don't:

- **Don't** make it look like a dating product, a generic AI dashboard, or a crypto/finance product. This applies to the signed-in application; see Surfaces below for the landing page.
- **Don't** carry the landing page's dark ground, particle effects, or violet accent into the application.
- **Don't** use gradient text, glassmorphism, decorative grid backgrounds, side-stripe cards, or identical card grids.
- **Don't** use warm cream/sand body backgrounds, oversized corner radii, or broad decorative shadows.
- **Don't** hide important content behind entrance animations; reduced motion must preserve all content and actions.
- **Don't** show empty social-style metrics that do not help a student choose a collaborator.


## Surfaces

This product deliberately runs two visual worlds, because the two surfaces have different
jobs and different audiences.

### The application (light)

Everything behind sign-in. A calm, true-neutral workspace a student keeps open for an hour
at a time: white surfaces, near-black ink, colour reserved for status and the primary
action. Every rule above this section describes this surface, and it is the one that must
hold WCAG 2.1 AA.

### The landing page (dark)

`webapp/src/pages/Landing.jsx`, scoped entirely under `.lp`. It has to earn attention from
someone who has never heard of Mesh, so it commits to a near-black ground (`#09090f`), an
animated dot field, a particle-rendered wordmark, and a violet accent (`#8b5cf6`).

This is a deliberate departure, not drift:

- It is a **Persuade** surface; the application is an **Operate** surface. Restraint that
  serves a workspace actively costs a marketing page its job.
- The two never touch. The landing tokens are `--lp-*` and scoped under `.lp`; the
  application's tokens are untouched by it.
- The departure is bounded to visual language. The landing page still meets the same
  accessibility floor: all text passes AA on the dark ground, controls keep 44px touch
  targets and visible focus rings, and `prefers-reduced-motion` removes the animated field
  and the motion without removing any content or action.

The vendored effect components behind it are documented in
`webapp/src/components/reactbits/README.md`, including the one local patch applied to them.
