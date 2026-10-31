# MESH 2.0 — Design Direction: Material 3 Expressive

**Design Theme:** Material 3 Expressive × Creative Project Workbench  
**Aesthetic Core:** High-utility engineering tool; restrained, elegant, purpose-driven.  

---

## 1. Aesthetic Identity & Anti-Patterns

### Explicitly Rejected Anti-Patterns
- **Generic Purple SaaS Aesthetics:** Avoid neon purple gradients, floating cards with glowing borders, and fuzzy AI sparkles.
- **Decorative Charts & Dials:** No radial SVG meters showing "94% Compatibility" or "88% Team Synergy". Every metric must correspond to a verifiable fact (e.g., *"3 of 4 required skills covered"*).
- **Overanimated Transitions:** No distracting page-flip effects or bouncy springs. Keep Motion transitions to 150–250ms ease-out functional state indicators.

### Desired Personality: The Creative Project Workbench
- **Surfaces:** Clean MD3 container elevation. Light background (`#FEF7FF`) with subtly elevated tonal cards (`--md-sys-color-surface-container-low` / `high`).
- **Typography:** Crisp sans-serif hierarchy paired with monospace badges (`SF Mono`, `JetBrains Mono`) for technical skills, GitHub commit evidence, and team capacity indicators.
- **Color Accent Roles:**
  - **Primary (Iris Purple `#6750A4`):** Active selections, primary actions (`Start a Project`, `Send Invitations`).
  - **Synergy (Forest Green `#0B6B2B`):** Covered skills, accepted invitations, verified GitHub proof.
  - **Warning (Warm Ochre `#7A5900`):** Missing required skills, recruitment gaps, pending invitations.
  - **Tertiary (Rose Mauve `#7D5260`):** Learning goals, student interests.

---

## 2. Material 3 Design Token Alignment

The existing tokens in `src/theme/tokens.css` will be leveraged directly:

```css
/* Core Surface Hierarchy */
--md-sys-color-surface: #FEF7FF;
--md-sys-color-surface-container-low: #F7F2FA;
--md-sys-color-surface-container: #F3EDF7;
--md-sys-color-surface-container-high: #ECE6F0;

/* Outlines & Dividers */
--md-sys-color-outline: #79747E;
--md-sys-color-outline-variant: #CAC4D0;

/* Semantic Action & Status Colors */
--md-sys-color-primary: #6750A4;
--md-sys-color-on-primary: #FFFFFF;
--md-custom-color-synergy: #0B6B2B;
--md-custom-color-synergy-container: #D4F8D3;
--md-custom-color-warning: #7A5900;
--md-custom-color-warning-container: #FFF0D4;

/* Shape System */
--md-sys-shape-corner-small: 8px;
--md-sys-shape-corner-medium: 12px;
--md-sys-shape-corner-large: 16px;
--md-sys-shape-corner-full: 9999px;
```

---

## 3. Micro-Interactions & Component States

1. **Skill Requirement Pip Selector:**
   - Instead of a generic number dropdown, proficiencies 1 to 5 are selected via interactive circular pips:
     `● ○ ○ ○ ○` (1 - Beginner) $\rightarrow$ `● ● ● ○ ○` (3 - Competent) $\rightarrow$ `● ● ● ● ●` (5 - Expert).
2. **Alternative Switcher in Team Simulator:**
   - An expressive segmented button allowing instantaneous crossfades between Alternative 1, 2, and 3 without triggering full-page layout re-renders.
3. **Slot Pinning Feedback:**
   - Clicking "Pin" on a candidate card gives immediate tonal feedback: the card border shifts to solid Primary, a subtle pin badge appears, and the remaining slots pulse gently to show recalculation.

