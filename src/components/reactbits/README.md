# React Bits components

Vendored from the React Bits registry (JS + plain CSS variant), fetched from
`https://reactbits.dev/r/<Name>-JS-CSS.json`. The `npx shadcn add` path does not apply
here: this project is plain Vite with no `components.json` and no Tailwind, so the
sources were taken straight from the registry JSON instead.

| Component | Used by |
|---|---|
| `Stack` | `TopPicksDeck` — the featured collaborator deck on the home page |
| `DotField` | Landing page hero background |
| `LineSidebar` | Primary navigation in the app shell |
| `OptionWheel` | Landing page skills wheel |
| `ParticleText` | Landing page "MESH" title |
| `BubbleMenu` | Landing page navigation at narrow widths |

npm dependencies these pulled in: `motion` (Stack) and `gsap` (BubbleMenu).

`TextLoop` was fetched for a landing-page ribbon that was later removed, so its files are
gone. `DotField` is no longer used inside the application either; the workspace uses a
static CSS grid instead, because an ambient canvas loop is not worth the frame budget on
a surface people keep open for an hour.

## Local modifications

Everything here is upstream source except one fix, marked `LOCAL PATCH` in the file:

- **`Stack.jsx`** — three fixes:
  1. Its reset effect keyed on the `cards` **array identity**, so any parent re-render that
     produced a fresh array rebuilt the stack and silently undid the reorder the user had
     just made. The deck appeared to ignore clicks entirely. It now accepts an optional
     `cardsKey` describing the *content*, and only resets when that changes.
  2. The click handler covered the whole card, so pressing a button inside one also sent
     that card to the back — every action looked like it "just swapped". Clicks starting
     on a control are now ignored.
  3. Card tilts were drawn with `Math.random()` during render, so every re-render
     reshuffled them and the deck twitched. They are now drawn once per card and kept.
  4. On dismissal the card's drag offset was never reset. The component key is stable so
     it is not remounted, which meant a card you dragged away kept its offset and came
     back crooked. A card that did *not* pass the threshold snapped home with `x.set(0)` —
     an instant teleport with no animation at all.
  5. The dismiss decision read the raw drag offset and ignored velocity, so a short fast
     flick — the most natural way to throw a card away — did nothing. It now projects the
     release momentum (exponential decay, the scroll-deceleration form) and decides on
     where the flick is heading. Both release paths spring home seeded with the release
     velocity, on separate X and Y springs, so there is no seam between dragging and
     animating and the two axes cannot desynchronise.
  It also gained an optional `onTopCardChange` callback, so a detail panel beside the deck
  can follow whichever card is on top.

- **`OptionWheel.jsx`** — two fixes:
  1. `startLoop` cancelled and rescheduled the animation frame on every call, resetting the
     clock with it. A mouse wheel fires a burst of events between two frames, so each one
     pushed the timestamp forward; by the time a frame ran, `dt` was ~2ms instead of ~16.7ms
     and the exponential smoothing collapsed with it, moving the wheel about a quarter as
     far per frame as intended. It crawled while you scrolled, then snapped when you stopped.
     An in-flight frame is now left alone, so `dt` stays continuous.
  2. Its `onWheel` called `preventDefault()` unconditionally, so once a non-looping wheel
     reached its first or last option it still swallowed scroll and the page could not be
     scrolled past it. It now only consumes events it can act on, and damps how far one
     burst can push the target ahead of the eased position.

- **`ParticleText.jsx`** — added `gatherOnMount`. The component always played an assembling
  animation on load; `gatherOnMount={false}` starts the word already formed, for callers
  that want the text simply present and reacting only to the pointer. Reduced motion takes
  the same path, since that animation is precisely what it asks us to skip.

- **`DotField.jsx`** — the component measured its container once at mount and then only
  re-measured on `window.resize`. A page opened in a background tab mounts at 0x0, so the
  field stayed blank forever once that tab was focused, since the window never resized.
  It now also observes its container with a `ResizeObserver`, and re-measures on
  `visibilitychange` (ResizeObserver callbacks are withheld while a tab is hidden, so the
  visibility listener covers that case directly rather than depending on delivery timing).
  It also gained a `maxDpr` prop (rendering a decorative dot pattern at 2x costs four times
  the fill for no visible gain), caches its gradient instead of rebuilding it every frame,
  and stops its animation loop entirely while it is scrolled out of view or the tab is
  hidden — previously it repainted the full viewport forever.

Re-fetching a component from the registry will overwrite that patch.
