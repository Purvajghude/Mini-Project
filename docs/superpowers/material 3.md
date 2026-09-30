# Material 3 Expressive Design System
## Pixel / Google-inspired UI system for product design and AI implementation

> **Purpose:** This document is the source of truth for designing and implementing this product with a strong Material 3 / Pixel / Google visual character.
>
> **Reference basis:** Google's Material 3 Expressive research, Material Design 3 guidance, current Android / Jetpack Compose Material 3 APIs, Material Symbols, and Google Sans Flex.
>
> **Core principle:** Do not copy a Google screen. Reconstruct the **design logic** behind Pixel and Material 3 Expressive so that completely different product content still feels like it belongs to the same visual ecosystem.

---

# 0. What This System Is Actually Trying to Achieve

The target is **not**:

> "A website with rounded cards and Google colors."

That is exactly how AI produces Material-flavored beige soup.

The target is:

> **A responsive, tactile, personal, highly legible interface where color, shape, size, motion, typography, and containment work together to communicate hierarchy and emotion.**

Google describes Material 3 Expressive as an expansion of Material 3 built around those five expressive dimensions: **color, shape, size, motion, and containment**. Their research emphasizes that expression should improve comprehension and usability rather than merely decorate the interface. citehttps://design.google/library/expressive-material-design-google-research

The product should therefore feel:

- distinctly Google / Pixel
- modern
- friendly
- tactile
- polished
- fluid
- adaptive
- personal
- expressive without being chaotic
- familiar enough to use immediately

---

# 1. The Non-Negotiable Design Philosophy

## 1.1 Expression is functional

Expressive treatment must communicate something:

- importance
- current state
- selection
- focus
- hierarchy
- progress
- personality
- context
- spatial relationship

Do not add expressive styling merely because empty space exists.

## 1.2 Familiarity comes before novelty

Do not replace established interaction patterns with visually exciting but unfamiliar patterns.

A playlist should still look like a playlist.
A settings screen should still behave like settings.
A form should still behave like a form.

Google's own research found that breaking familiar interaction patterns can reduce usability even when users find the design visually exciting. citehttps://design.google/library/expressive-material-design-google-research

## 1.3 Expressive can be quiet or loud

M3 Expressive is not one fixed visual intensity.

Use an **expression spectrum**:

```text
QUIET ───────── BALANCED ───────── EXPRESSIVE ───────── HERO
```

Quiet:

- calmer surfaces
- smaller shape variation
- standard motion
- restrained color

Balanced:

- expressive hierarchy
- selective shape variation
- dynamic color
- moderate spring motion

Expressive:

- stronger color contrast
- larger controls
- more varied shapes
- more obvious motion
- stronger visual hierarchy

Hero:

- dramatic scale
- distinctive shape
- strong motion
- high-color or high-contrast focal treatment
- product-specific signature moments

Not every screen should live at the HERO end.

Google explicitly describes expressive design as a flexible range rather than one aesthetic intensity. citehttps://design.google/library/design-notes-material-3-expressive-liam-spradlin

---

# 2. Visual DNA

The interface should communicate these qualities:

```text
PERSONAL
TACTILE
FLUID
BRIGHT
SOFT
PRECISE
PLAYFUL
LEGIBLE
ADAPTIVE
MODERN
```

Avoid these qualities:

```text
GENERIC SAAS
CORPORATE DASHBOARD
GLASSMORPHIC
DRIBBBLE TEMPLATE
AI-GENERATED
OVERDECORATED
FLAT/COLD
RIGID
MONOTONOUS
```

The most important distinction:

> **Material 3 Expressive is not "more decoration". It is stronger communication through visual variables.**

---

# 3. Material 3 Foundation

The theme architecture should conceptually follow Material's major systems:

```text
COLOR
TYPE
SHAPE
MOTION
ELEVATION / SURFACES
ICONOGRAPHY
COMPONENTS
LAYOUT
```

A Material theme is intentionally built from reusable systems so the same decisions propagate across components. citehttps://developer.android.com/develop/ui/compose/designsystems/material3

For implementation, create these as centralized tokens.

---

# 4. Color System

## 4.1 Do not hard-code a "Google palette"

Pixel's visual identity is strongly associated with **dynamic color**, not one fixed set of hex values.

Material 3 uses a seed/source color to generate tonal palettes and then maps those tones into semantic roles. On Android, dynamic color can derive the scheme from the user's wallpaper and adapt between light and dark themes. Google's Material color system is based on HCT as part of this infrastructure. citehttps://developer.android.com/design/ui/mobile/guides/styles/color

Therefore:

> **Define color by semantic role, not by isolated hex values.**

---

## 4.2 Semantic color roles

At minimum, implement these conceptual roles:

```text
PRIMARY
ON PRIMARY
PRIMARY CONTAINER
ON PRIMARY CONTAINER

SECONDARY
ON SECONDARY
SECONDARY CONTAINER
ON SECONDARY CONTAINER

TERTIARY
ON TERTIARY
TERTIARY CONTAINER
ON TERTIARY CONTAINER

BACKGROUND
ON BACKGROUND

SURFACE
ON SURFACE
SURFACE VARIANT
ON SURFACE VARIANT

SURFACE CONTAINER LOWEST
SURFACE CONTAINER LOW
SURFACE CONTAINER
SURFACE CONTAINER HIGH
SURFACE CONTAINER HIGHEST

OUTLINE
OUTLINE VARIANT

ERROR
ON ERROR
ERROR CONTAINER
ON ERROR CONTAINER

INVERSE SURFACE
INVERSE ON SURFACE
INVERSE PRIMARY
```

Material 3's current color system contains a much broader set of semantic surface and fixed roles than older Material versions. The important implementation rule is to consume roles consistently instead of inventing custom colors per component. citehttps://developer.android.com/reference/kotlin/androidx/compose/material3

---

## 4.3 Accent hierarchy

Use accent colors as a hierarchy:

```text
PRIMARY     → highest semantic emphasis
SECONDARY   → supporting emphasis
TERTIARY    → expressive contrast / differentiation
NEUTRALS    → majority of surfaces
```

Do not make everything primary-colored.

A common failure mode is:

```text
primary button
primary chip
primary card
primary nav
primary icon
primary badge
primary everything
```

That destroys hierarchy.

Material guidance recommends assigning stronger color roles to higher-priority actions while using container and neutral roles to prevent oversaturation. citehttps://developer.android.com/design/ui/mobile/guides/styles/color

---

## 4.4 Dynamic color behavior

If the platform supports dynamic color:

```text
SOURCE COLOR
     ↓
TONAL PALETTES
     ↓
SEMANTIC COLOR ROLES
     ↓
COMPONENT TOKENS
     ↓
UI
```

If dynamic color is unavailable:

```text
BRAND SEED
     ↓
CURATED LIGHT SCHEME
CURATED DARK SCHEME
```

Do not build components around raw colors.

---

## 4.5 Color expression

Material 3 Expressive intentionally expands the range of color and allows stronger vibrance and hue relationships than earlier M3 implementations. Google's design team describes the goal as bringing more chromatic quality while still supporting quieter themes. citehttps://design.google/library/design-notes-material-3-expressive-liam-spradlin

Use:

- vibrant primary moments
- tonal container layering
- secondary/tertiary accents
- strong contrast for important controls
- calm neutrals behind expressive content

Do not use color as decoration without hierarchy.

---

# 5. Light and Dark Themes

Both themes are first-class designs.

Never build light mode and then simply invert the colors for dark mode.

## Light

Characteristics:

- bright or softly tinted background
- high-surface clarity
- accent containers remain distinct
- dark text with high readability
- shadows should be subtle
- tonal elevation does most of the structural work

## Dark

Characteristics:

- deep surfaces rather than pure black everywhere
- clear surface hierarchy
- controlled bright accents
- avoid enormous glowing color blocks
- maintain readable contrast
- preserve component relationships

Material 3 uses tonal elevation to distinguish surfaces, including in dark themes, rather than relying only on traditional shadows. citehttps://developer.android.com/develop/ui/compose/designsystems/material3

---

# 6. Surface and Elevation System

## 6.1 Do not use "card shadow" as the main hierarchy mechanism

Material 3 increasingly uses **tonal layering**.

Think:

```text
BACKGROUND
   ↓
SURFACE
   ↓
SURFACE CONTAINER LOW
   ↓
SURFACE CONTAINER
   ↓
SURFACE CONTAINER HIGH
   ↓
SURFACE CONTAINER HIGHEST
```

The visual difference can come from:

- tonal value
- color relationship
- containment
- small shadow where appropriate

Not everything needs a drop shadow.

---

## 6.2 Elevation philosophy

Use elevation to communicate depth:

```text
FLAT
    ↓
CONTAINED
    ↓
RAISED
    ↓
FLOATING
```

Typical floating elements:

- FAB
- floating toolbar
- menus
- dialogs
- bottom sheets

Typical flat / contained elements:

- lists
- cards
- content sections
- forms

---

## 6.3 Avoid fake glassmorphism

Pixel / Material can use transparency or layered surfaces in particular contexts, but that does **not** mean:

```text
blur everything
+
translucent white card
+
background gradient
+
huge shadow
```

Do not turn Material into generic glassmorphism.

---

# 7. Shape System

Shape is one of the biggest differences between generic M3 and expressive M3.

Material's shape system defines a range from minimal rounding through increasingly rounded shapes, with room for customized and expressive shape relationships. Current APIs include expanded shape slots such as Extra Small, Small, Medium, Large, Large Increased, Extra Large, Extra Large Increased, and Extra Extra Large. citehttps://developer.android.com/reference/kotlin/androidx/compose/material3/Shapes

## 7.1 Shape vocabulary

Use semantic shape tokens:

```text
NONE
EXTRA_SMALL
SMALL
MEDIUM
LARGE
LARGE_INCREASED
EXTRA_LARGE
EXTRA_LARGE_INCREASED
EXTRA_EXTRA_LARGE
FULL
```

Do not randomly select a radius per component.

---

## 7.2 Rounded is the default, not the only option

Material shape can be understood as a **relationship system**.

Examples:

```text
small internal element
        ↓
medium container
        ↓
large feature container
        ↓
full/pill action
```

The outer container generally has a larger / stronger shape treatment than tiny internal elements.

---

## 7.3 Expressive shapes

Use expressive shapes for:

- hero moments
- prominent actions
- media
- avatars
- feature tiles
- loading indicators
- special state transitions
- focal content

Do not make every element use a bizarre custom shape.

The goal is:

```text
mostly familiar shapes
+
a few expressive shape moments
=
Material 3 Expressive
```

not:

```text
every component has a different blob
```

---

## 7.4 Shape morphing

Shape can change with state.

Examples:

```text
collapsed → expanded
unselected → selected
inactive → active
play → pause
menu closed → menu open
```

The shape transition should feel continuous rather than a hard swap.

Google's expressive system specifically uses shape morphing in component states and transitions. citehttps://developer.android.com/design/ui/wear/guides/get-started/apply

---

# 8. Shape Composition

Shape should also define relationships.

For a grouped control:

```text
╭─────────────╮╭─────────────╮╭─────────────╮
│    DAY      ││    WEEK     ││   MONTH     │
╰─────────────╯╰─────────────╯╰─────────────╯
```

For connected controls:

```text
╭───────────────╮──────────────╮
│   PRIMARY     │   SECONDARY  │
╰───────────────╯──────────────╯
```

The boundaries between elements may deliberately change based on grouping.

This creates a **single object composed from multiple controls**.

---

# 9. Typography

## 9.1 Preferred typeface: Google Sans Flex

For a close Google / Pixel expressive feel, use:

```text
Google Sans Flex
```

Google Design describes Google Sans Flex as a variable typeface designed specifically to support expressive variation while preserving readability. It supports six important axes:

```text
weight
width
optical size
slant
grade
roundedness
```

Google made Google Sans and Google Sans Flex open-source in 2025. citehttps://design.google/library/google-sans-flex-font

Fallback:

```text
Roboto Flex
Roboto
system-ui
sans-serif
```

---

## 9.2 Expressive typography is variable

Do not use one font weight for the entire product.

Typography can express hierarchy through:

- size
- weight
- width
- grade
- optical size
- roundedness
- spacing

Use stronger variation for:

- display headlines
- metrics
- hero labels
- active states
- critical actions

Use quieter variation for:

- body
- metadata
- navigation
- secondary information

---

## 9.3 Type roles

Use the Material role architecture:

```text
DISPLAY
HEADLINE
TITLE
BODY
LABEL
```

Each role has size variants.

Conceptually:

```text
DISPLAY LARGE
DISPLAY MEDIUM
DISPLAY SMALL

HEADLINE LARGE
HEADLINE MEDIUM
HEADLINE SMALL

TITLE LARGE
TITLE MEDIUM
TITLE SMALL

BODY LARGE
BODY MEDIUM
BODY SMALL

LABEL LARGE
LABEL MEDIUM
LABEL SMALL
```

Current Material 3 APIs also include emphasized versions of these styles. Emphasized type is useful for stronger hierarchy and selective attention, not for making everything bold. citehttps://developer.android.com/reference/kotlin/androidx/compose/material3/Typography

---

## 9.4 Use expressive axes selectively

Example conceptual axis usage:

```text
hero headline:
weight ↑
width slightly wider or slightly condensed
roundness ↑
optical size matched to rendered size

body:
moderate weight
neutral width
neutral roundness

metadata:
smaller size
slightly higher grade if needed for clarity
```

Do not distort every string.

---

# 10. Material Symbols

Use **Material Symbols** instead of random icon libraries.

Google describes Material Symbols as the newer Material icon system, with thousands of glyphs and variable design axes. citehttps://developers.google.com/fonts/docs/material_symbols

## 10.1 Preferred icon family

Choose one family and keep it consistent:

```text
Material Symbols Rounded
```

For a more utilitarian interface:

```text
Material Symbols Outlined
```

Avoid mixing:

```text
Lucide
Font Awesome
Heroicons
Material Icons
random SVG packs
```

inside the same visual system.

---

## 10.2 Material Symbol variables

Use the available axes intentionally:

```text
FILL
wght
GRAD
opsz
```

Material Symbols documentation describes these axes for controlling fill, weight, grade and optical size. citehttps://developers.google.com/fonts/docs/material_symbols

Use:

```text
FILL = 0
```

for a default outline/icon state.

Use:

```text
FILL = 1
```

for a selected / active / emphasized state when appropriate.

The fill axis can itself be animated.

---

## 10.3 Icon sizing

Common sizes:

```text
18px  → compact metadata
20px  → dense UI
24px  → standard
28px  → prominent controls
32px  → large control
40px+ → feature/icon emphasis
```

Interactive icon buttons must have a comfortable hit area even when the glyph itself is small.

Never confuse:

```text
visual icon size
```

with:

```text
interactive target size
```

---

# 11. Component Philosophy

Build around Material's component categories:

```text
ACTION
CONTAINMENT
NAVIGATION
SELECTION
TEXT INPUT
COMMUNICATION
```

Material's component model is intentionally compositional: individual primitives become buttons, cards, lists, navigation systems, dialogs and larger patterns. citehttps://developer.android.com/design/ui/mobile/guides/components/material-overview

---

# 12. Buttons

Buttons are not one component with different colors.

They communicate different emphasis levels.

Use the appropriate semantic variant:

```text
FILLED
FILLED TONAL
OUTLINED
TEXT
ELEVATED
```

M3 also supports expressive sizing and toggle/button-group patterns.

## Button visual language

Buttons should feel:

- tactile
- substantial
- easy to identify
- rounded
- highly legible
- visually related to other controls

Do not:

- use gradients
- add giant shadows
- put huge icons everywhere
- use tiny tap areas
- make every button filled

---

# 13. Icon Buttons

Use icon buttons for compact actions.

Variants:

```text
STANDARD
FILLED
FILLED TONAL
OUTLINED
TOGGLE
```

States should communicate clearly:

```text
rest
hover
focus
pressed
selected
disabled
```

Selected states may use:

- fill changes
- color changes
- shape changes
- icon fill changes

Use a combination, not all of them simultaneously.

---

# 14. FAB

The floating action button is a **high-priority action**.

Use:

```text
small FAB
standard FAB
large FAB
extended FAB
```

Material guidance treats the FAB as a prominent primary action rather than something to sprinkle around the interface. citehttps://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns

### Expressive FAB behavior

A FAB may:

- morph
- expand
- reveal labels
- change icon state
- react spatially to scrolling
- dock into a toolbar

Do not use multiple competing FABs unless the product context clearly requires them.

---

# 15. Extended FAB

Use an extended FAB when:

```text
the action is important
+
the label adds meaningful clarity
```

Example:

```text
╭──────────────────────────────╮
│  +   Create project          │
╰──────────────────────────────╯
```

The label should explain the action.

Don't use extended FABs just because they "look Pixel-like."

---

# 16. Split Buttons

M3 Expressive includes split-button patterns.

Concept:

```text
╭──────────────────────┬──────╮
│       SAVE           │  ▾   │
╰──────────────────────┴──────╯
```

The trailing control may:

- morph
- rotate
- change shape
- open a menu

Use split buttons where one primary action has meaningful alternatives.

---

# 17. Button Groups

When several related choices belong together:

```text
╭────────────╮╭────────────╮╭────────────╮
│    DAY     ││    WEEK    ││   MONTH    │
╰────────────╯╰────────────╯╰────────────╯
```

Use a group instead of three unrelated buttons.

The group may behave as one expressive object.

---

# 18. Chips

Use chips for:

- filtering
- suggestions
- categories
- lightweight selection
- supporting actions

Examples:

```text
Assist
Filter
Input
Suggestion
Elevated
```

Do not use chips as generic decoration.

A chip must represent a small, bounded concept.

---

# 19. Cards

Cards are containment, not decoration.

Use cards to establish:

```text
related content
+
related actions
+
clear visual ownership
```

Variants:

```text
FILLED
ELEVATED
OUTLINED
```

Cards should use tonal hierarchy before heavy shadows.

Avoid nesting cards inside cards unless the hierarchy genuinely requires multiple containment layers.

---

# 20. Lists

Lists should remain lists.

Typical structure:

```text
ICON / AVATAR
TITLE
SUPPORTING TEXT
TRAILING VALUE / ACTION
```

Use:

- consistent row heights
- strong alignment
- accessible targets
- subtle separators only when useful
- clear hierarchy

Do not turn a list into a collage of random cards merely to make it expressive.

Google's research explicitly showed that destroying familiar list structure for visual novelty can hurt recognition and usability. citehttps://design.google/library/expressive-material-design-google-research

---

# 21. Navigation

Use the Material navigation patterns appropriate to device size:

```text
Navigation Bar
Navigation Rail
Navigation Drawer
Tabs
Top App Bar
Floating Toolbar
Docked Toolbar
```

Do not force one navigation pattern onto every viewport.

---

# 22. Top App Bar

The top app bar should be:

- calm
- spatially clear
- contextual
- strongly aligned

Avoid turning it into a giant marketing hero.

For larger pages, use headline hierarchy below or within the app-bar region rather than inflating the navigation itself.

---

# 23. Floating Toolbar

M3 Expressive introduces a more flexible floating toolbar model.

It can:

- float over content
- group actions
- contain icon buttons
- work with a FAB
- change state with scroll
- adapt its arrangement

Use it when action context is local and frequent.

Do not replace every bottom navigation / app-bar pattern with a floating toolbar simply because the component is new.

---

# 24. Progress and Loading

Material 3 Expressive pays particular attention to progress feedback.

Use expressive loading when:

```text
the experience benefits from a little personality
```

Use standard loading when:

```text
the experience should stay quiet and utilitarian
```

The system should support both.

Google's design team specifically calls out the ability to choose between simpler and more expressive loader/spinner treatments. citehttps://design.google/library/design-notes-material-3-expressive-liam-spradlin

---

# 25. Text Fields

Text fields should prioritize:

```text
clarity
state visibility
keyboard usability
focus visibility
error communication
```

Material text fields may be:

```text
Filled
Outlined
```

Use labels properly.

Do not rely on placeholder text as the only field label.

Focus state should be unmistakable without being visually aggressive.

---

# 26. Dialogs

Dialogs should create a clear layer above the current context.

Use:

```text
scrim
surface
strong headline
supporting content
clear action hierarchy
```

Avoid:

- giant empty dialog boxes
- excessive decorative imagery
- too many actions
- ambiguous dismiss behavior

For important actions, the dialog should visually prioritize the intended action without manipulating the user through decoration.

---

# 27. Bottom Sheets

Bottom sheets are especially useful for:

- contextual actions
- filters
- additional information
- temporary editing
- mobile workflows

They should feel spatially connected to the originating content.

Use motion to make the transition feel like:

```text
same surface / expanded state
```

rather than:

```text
random window appears
```

---

# 28. Containment

Containment is a core expressive variable.

Use containment to answer:

> "Which things belong together?"

Possible containment mechanisms:

```text
surface
shape
spacing
divider
background tone
icon group
shared interaction
```

Not every relationship requires a card.

Material explicitly uses both explicit containment, such as cards and dialogs, and implicit containment, such as lists with spacing/dividers. citehttps://developer.android.com/design/ui/mobile/guides/components/material-overview

---

# 29. Layout System

## 29.1 Base spacing

Use a 4dp / 4px base unit.

Preferred rhythm:

```text
4
8
12
16
20
24
28
32
40
48
56
64
80
96
120
128
```

The 8-unit rhythm should dominate ordinary layout.

---

## 29.2 Responsive layout

The UI should adapt based on available width rather than device names.

Think:

```text
COMPACT
MEDIUM
EXPANDED
```

not:

```text
PHONE
TABLET
DESKTOP
```

Use layouts that can recompose.

Example:

```text
COMPACT
┌──────────────┐
│ primary      │
│ secondary    │
│ content      │
│ actions      │
└──────────────┘
```

Expanded:

```text
┌───────────┬──────────────────────┐
│           │                      │
│ secondary │      primary         │
│ navigation│      content         │
│           │                      │
└───────────┴──────────────────────┘
```

---

# 30. Alignment

Material interfaces should feel carefully aligned.

Use:

```text
shared left edges
shared baselines
consistent container padding
consistent action alignment
consistent icon/text spacing
```

Do not create "expressiveness" through misalignment.

Expression comes from:

```text
shape
scale
color
motion
containment
```

not from making the grid sloppy.

---

# 31. Size as an Expressive Variable

Size is not purely spacing.

Size communicates importance.

Use size to create a hierarchy such as:

```text
hero action
    ↓
primary content
    ↓
supporting content
    ↓
secondary controls
```

Example:

```text
small secondary button
       vs
large primary button
```

The larger element should have a clear reason to exist.

Google's research includes component sizing experiments specifically to improve tap time and prominence without overwhelming the interface. citehttps://design.google/library/expressive-material-design-google-research

---

# 32. Motion System

Motion is a core part of the visual identity.

The product should feel:

```text
responsive
natural
springy
spatial
continuous
```

Not:

```text
linear
instant
robotic
over-bouncy
```

---

# 33. Standard vs Expressive Motion

Material 3 now exposes two conceptual motion schemes:

```text
STANDARD
EXPRESSIVE
```

The standard scheme is intended for utilitarian and recurring interactions.

The expressive scheme is recommended for prominent UI and hero interactions and provides a more visually engaging feel. citehttps://developer.android.com/reference/kotlin/androidx/compose/material3/MotionScheme

Use:

```text
STANDARD
```

for:

- routine menus
- repeated list interactions
- minor state changes
- subtle feedback

Use:

```text
EXPRESSIVE
```

for:

- hero interactions
- large state changes
- FAB transformations
- shape morphing
- prominent selection
- major transitions

---

# 34. Motion Physics

Prefer spring-based motion for spatial changes.

Use spring-like behavior for:

```text
position
size
shape
bounds
scale
```

Use less-elastic effects for:

```text
color
alpha
opacity
```

Material's motion API distinguishes **spatial** animation from **effects** animation for exactly this reason. Spatial animation can overshoot; effects such as color/alpha generally should not. citehttps://developer.android.com/reference/kotlin/androidx/compose/material3/MotionScheme

---

# 35. Motion Rules

### Hover

Very small spatial feedback:

```text
translate: 0–2px
scale: 1.00–1.02
```

### Press

Compress slightly:

```text
scale: 0.97–0.99
```

### State change

Prefer:

```text
shape morph
+
color transition
+
icon transition
```

over:

```text
fade old component
+
fade new component
```

### Expansion

Use spatial continuity:

```text
collapsed
   ↓
expand from origin
   ↓
expanded
```

### Navigation

Prefer continuity between surfaces.

The new destination should feel spatially connected to the previous one.

---

# 36. Never Use Generic "Bouncy UI"

Avoid:

```text
overshoot: huge
bounce: constant
duration: 1000ms
```

A Pixel-like interface is springy because it feels physical, not because every button behaves like jelly.

---

# 37. Icon Motion

Material Symbols enable meaningful icon animation.

Use:

```text
FILL 0 → 1
```

for selected states.

Examples:

```text
favorite
bookmark
star
notifications
visibility
play/pause
```

Where appropriate, animate the symbol itself instead of replacing it abruptly.

---

# 38. Microinteractions

Good microinteractions:

```text
checkbox changes
      ↓
icon fills
      ↓
container subtly changes tone
      ↓
small spring feedback
```

The user should understand the state transition.

Avoid animation with no semantic value.

---

# 39. Interaction States

Every interactive component should define:

```text
DEFAULT
HOVER
FOCUS
PRESSED
SELECTED
DISABLED
LOADING
ERROR
```

Not every component needs a visually dramatic difference for every state.

The states must still remain understandable.

---

# 40. Focus and Accessibility

Never sacrifice focus visibility to make the interface "clean".

Use:

- visible keyboard focus
- adequate contrast
- semantic HTML
- proper labels
- accessible names for icons
- logical reading order
- large enough interaction targets
- reduced-motion support

Material components are designed with accessibility as a core concern, including contrast and interaction considerations. Google's M3 Expressive research also evaluated accessibility and found benefits from larger buttons and stronger visual containment. citehttps://design.google/library/expressive-material-design-google-research

---

# 41. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled:

- remove large spatial travel
- reduce spring overshoot
- shorten transitions
- preserve state clarity
- avoid decorative continuous motion

Do not simply disable all feedback.

---

# 42. Elevation + Shape + Color Interaction

These systems must work together.

Example:

```text
PRIMARY ACTION
    =
high-priority color
+
prominent size
+
strong containment
+
expressive shape
+
responsive motion
```

A secondary action may use:

```text
tonal container
+
smaller size
+
quieter motion
```

This is the heart of M3 Expressive.

The five expressive variables should not be treated independently.

---

# 43. Expressive Hierarchy Recipe

For any major interaction, ask:

### Color
What color role tells the user this matters?

### Shape
What shape makes the component identifiable?

### Size
Should it be larger or smaller than surrounding elements?

### Motion
What movement communicates state or continuity?

### Containment
What belongs together?

Only then implement.

---

# 44. Hero Moments

Every product can have a small number of signature moments.

Examples:

```text
success completion
project creation
media playback
important dashboard metric
first-run experience
empty-state transformation
```

For hero moments, allow:

- stronger expressive color
- larger typography
- more distinctive shape
- richer motion
- stronger visual contrast

But hero treatment should be rare enough to remain meaningful.

---

# 45. Empty States

Empty states should not look like giant marketing pages.

Use:

```text
clear explanation
+
one useful visual
+
primary action
```

Expressiveness can come from:

- custom shape
- illustration crop
- typography
- motion
- tonal color

Keep the interaction obvious.

---

# 46. Loading / Skeleton States

Skeleton UI should preserve:

```text
layout
hierarchy
spacing
shape
```

Do not make skeletons generic grey boxes unrelated to the final structure.

The skeleton should already look like the actual page's geometry.

---

# 47. Images and Media

For image-heavy content:

- let imagery provide personality
- use Material surfaces around it
- use shape to create identity
- use expressive crop/container relationships

Do not apply a generic overlay to every image.

Do not make every image circular.

Do not make every image edge-to-edge.

Choose the treatment based on the content role.

---

# 48. Data Visualization

Charts should follow the same semantic color system.

Use:

```text
primary
secondary
tertiary
surface
on-surface
outline
error
```

Avoid rainbow charts unless multiple categories genuinely require independent semantic colors.

Use expressive animation only when it helps users understand change.

---

# 49. Desktop / Web Translation Rules

This project may be web-based, so translate Material rather than blindly copying Android dp measurements.

Use CSS equivalents:

```text
4dp → 4px baseline
8dp → 8px rhythm
```

But preserve the **relationships**, not merely the numbers.

Examples:

```text
large container
>
medium internal element
>
small internal element
```

and:

```text
primary action
>
secondary action
>
supporting action
```

---

# 50. Web Implementation Principles

## Use CSS variables

```css
:root {
  --md-primary: ...;
  --md-on-primary: ...;
  --md-primary-container: ...;
  --md-on-primary-container: ...;

  --md-secondary: ...;
  --md-tertiary: ...;

  --md-surface: ...;
  --md-surface-container: ...;
  --md-surface-container-high: ...;

  --md-outline: ...;
  --md-outline-variant: ...;

  --md-radius-sm: ...;
  --md-radius-md: ...;
  --md-radius-lg: ...;
  --md-radius-xl: ...;
  --md-radius-full: 999px;
}
```

Do not scatter visual values through components.

---

# 51. Component Architecture for AI Coding Agents

Recommended component structure:

```text
/components
    /navigation
        TopAppBar
        NavigationBar
        NavigationRail
        NavigationDrawer
        Tabs
        FloatingToolbar

    /actions
        Button
        IconButton
        FAB
        ExtendedFAB
        SplitButton
        ButtonGroup

    /containment
        Card
        Surface
        Dialog
        BottomSheet
        Menu
        List

    /selection
        Chip
        Checkbox
        Radio
        Switch
        Slider
        SegmentedControl

    /input
        TextField
        SearchField
        Select
        DatePicker

    /feedback
        Snackbar
        ProgressIndicator
        LoadingIndicator
        Badge
        Tooltip

    /icons
        MaterialSymbol

    /layout
        Scaffold
        Section
        ResponsiveContainer
```

---

# 52. AI Agent Rules

When an AI coding agent creates UI:

### First

Read this entire design system.

### Then

Inspect existing components and tokens.

### Then

Determine:

```text
user goal
component type
importance
semantic color
shape
size
motion
containment
responsive behavior
```

### Then implement.

Do not jump directly from:

```text
"Build this page"
```

to:

```text
generate random JSX + Tailwind
```

---

# 53. AI Anti-Slop Rules

The following patterns are prohibited unless explicitly justified.

## No generic SaaS cards

Do not produce:

```text
╭────────────╮
│ icon       │
│ title      │
│ paragraph  │
╰────────────╯
```

repeated 8 times.

## No giant gradients

Especially:

```text
purple → blue
pink → orange
cyan → violet
```

because "AI website".

## No default glassmorphism

Do not make every surface translucent.

## No giant border radii everywhere

A button can be full.
A card does not automatically need to be full.

## No excessive floating

Not every object should cast a shadow and hover.

## No random color

Every color must map to a token.

## No random shape

Every shape must have a semantic purpose.

## No random animation

Every animation must communicate state, continuity or feedback.

## No "Google logo cosplay"

Do not insert colorful G-inspired decoration just to make something feel Google.

The goal is Material behavior, not brand imitation.

---

# 54. Anti-Generic-Design Test

After implementation, ask:

### 1. Could this have been generated with a generic SaaS template?

If yes, redesign the composition.

### 2. Does removing the color destroy the hierarchy?

If yes, color is carrying too much of the design.

### 3. Does removing animation make the interaction unclear?

If yes, motion is probably doing useful work.

### 4. Are the shapes communicating hierarchy?

If no, the shape system is decorative.

### 5. Are components recognizably Material?

If no, verify component anatomy, states and typography.

### 6. Does the interface still feel good when content changes?

If no, the system is not truly reusable.

---

# 55. Visual QA Checklist

Before shipping a screen:

```text
[ ] Semantic Material color roles are used
[ ] Light and dark themes are considered
[ ] No arbitrary colors are introduced
[ ] Surface hierarchy is clear
[ ] Tonal elevation is used before heavy shadows
[ ] Shape tokens are reused
[ ] Shape variation has semantic purpose
[ ] Typography follows Material roles
[ ] Google Sans Flex / appropriate Material typeface is configured
[ ] Material Symbols are used consistently
[ ] Icon family is not mixed randomly
[ ] All interaction states exist
[ ] Focus is visible
[ ] Buttons have adequate targets
[ ] Navigation is appropriate to viewport
[ ] Content is aligned consistently
[ ] Familiar interaction patterns are preserved
[ ] Motion is subtle where routine and expressive where important
[ ] Spring behavior is used for spatial changes
[ ] Color/alpha transitions avoid spatial overshoot
[ ] Reduced motion is supported
[ ] Empty states remain functional
[ ] The page does not look like generic SaaS
[ ] The page does not look like generic AI slop
[ ] Expressive details reinforce hierarchy
[ ] The design still works without decorative elements
```

---

# 56. The "Pixel Test"

A screen should feel Pixel-like when these qualities appear together:

```text
soft but precise surfaces
+
strong semantic color
+
large readable typography
+
rounded but purposeful geometry
+
recognizable Material Symbols
+
tactile controls
+
subtle depth
+
springy interaction
+
clear hierarchy
+
personalizable color
```

It should **not** require:

```text
Google logo
+
blue buttons
+
rounded rectangles
```

---

# 57. Recommended Baseline Tokens

These are starting points for a web implementation, not literal Android system values.

```css
:root {
  /* Layout */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-9: 40px;
  --space-10: 48px;
  --space-11: 56px;
  --space-12: 64px;
  --space-13: 80px;
  --space-14: 96px;
  --space-15: 128px;

  /* Shape */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-full: 999px;

  /* Interaction */
  --control-height-sm: 36px;
  --control-height-md: 40px;
  --control-height-lg: 48px;
  --control-height-xl: 56px;

  /* Icons */
  --icon-sm: 18px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 28px;
  --icon-2xl: 32px;

  /* Motion */
  --motion-fast: 150ms;
  --motion-standard: 250ms;
  --motion-slow: 400ms;
}
```

Use Material's semantic component tokens where the implementation framework provides them. These web values exist primarily to keep custom components coherent.

---

# 58. Recommended CSS Motion Foundation

For routine transitions:

```css
transition:
  color 180ms ease,
  background-color 180ms ease,
  border-color 180ms ease,
  box-shadow 180ms ease,
  transform 180ms ease;
```

For expressive interactions:

```text
Use a spring implementation rather than pretending
a cubic-bezier is physically accurate.
```

For shape morphing:

```text
animate the actual shape parameters whenever possible.
Do not crossfade between two unrelated components.
```

---

# 59. Custom Component Rule

A custom component is allowed when:

```text
Material has no suitable component
OR
the product needs a meaningful brand-specific component
```

A custom component must still inherit:

```text
Material color roles
Material typography
Material shape
Material spacing
Material states
Material motion philosophy
Material accessibility
```

Custom does not mean disconnected.

---

# 60. Design Review Questions

Before accepting a new component:

### Purpose

What user problem does it solve?

### Hierarchy

Why is this component visually stronger or quieter?

### Color

What semantic role does its color represent?

### Shape

Why does it have this shape?

### Size

Why is it this large?

### Motion

Why does it move?

### Containment

What content belongs inside it?

### Familiarity

Would a user recognize what it does immediately?

### Accessibility

Can keyboard, low-vision and assistive-technology users operate it?

---

# 61. Source-Grounded Principles

This design system is based primarily on the following Google / Android sources:

1. **Google Design — Expressive Design: Google's UX Research**
   - M3 Expressive research
   - color, shape, size, motion, containment
   - preference, usability, accessibility
   - importance of preserving familiar interaction patterns

2. **Google Design — Inside M3 Expressive**
   - expressive design as contextual
   - quiet vs loud expression
   - flexibility
   - color vibrance
   - motion physics
   - product-specific expression

3. **Google Design — Google Sans Flex**
   - variable typography
   - weight
   - width
   - optical size
   - slant
   - grade
   - roundedness

4. **Android Developers — Material 3 in Compose**
   - color
   - typography
   - shape
   - elevation
   - dynamic color
   - component system

5. **Android Developers — Material Color**
   - semantic color roles
   - dynamic color
   - tonal palettes
   - hierarchy

6. **Google Fonts — Material Symbols**
   - icon family
   - fill
   - weight
   - grade
   - optical size

7. **Android Developers — MotionScheme**
   - standard motion
   - expressive motion
   - spatial animation
   - effects animation

---

# 62. Final Rule

Do not interpret this document as:

> "Make everything colorful, huge and rounded."

Interpret it as:

> **Use Material's design primitives as a controlled language. Increase expression only where it improves hierarchy, context, personality, or feedback.**

The final product should feel like:

```text
Material 3
      +
Pixel sensibility
      +
Material 3 Expressive
      +
product-specific personality
```

not:

```text
generic SaaS
+
rounded corners
+
Google colors
=
"Material"
```

The objective is to make a completely original application that could plausibly sit beside modern Google / Pixel experiences without looking like a clone.
