# Accessible Responsive UI Redesign

## Goal

Correct the observed responsive, accessibility, and keyboard-flow defects in HiLab-HR while preserving its existing light glassmorphism design system, indigo/violet accent palette, typography, and interaction language.

## Scope

- Add an accessible mobile navigation dropdown to the shared navbar.
- Prevent the Skill Studio header preset selector from overflowing narrow viewports.
- Give all affected form controls and icon-only buttons an accessible name.
- Replace the three ad-hoc Skill Studio modal shells with a shared accessible modal primitive.
- Correct observed contrast failures and the Skill Studio heading-level jump.
- Update the project Spec-Driven documents and add regression coverage to the existing test plan.

## Non-goals

- No changes to the screening APIs, skill data model, Gemini behaviour, preset persistence, or visual theme.
- No new UI dependency or design-system migration.
- No broad refactor outside the navbar, selector, Skill Studio, and audited copy styles.

## Design

### Mobile navigation

`Navbar` remains a sticky glass header. Below the `md` breakpoint, its navigation links are replaced by a labelled menu button. Activating it opens a bordered white dropdown immediately below the header containing the four current primary destinations. The dropdown uses the existing compact rounded-card and indigo active-state treatment, closes after a destination is selected or when Escape is pressed, and exposes `aria-expanded`, `aria-controls`, and an accessible label.

### Responsive Skill Studio header

The desktop header keeps its existing horizontal controls. On narrow screens, the title/action area and preset selector become stacked rows. The selector uses the available width rather than a fixed width, so its selected value and affordance remain visible inside the 375px viewport.

### Accessible controls

Visible labels become programmatic labels using stable `id`/`htmlFor` pairs. The single and batch file inputs receive explicit labels, as do their associated Skill selectors. In Skill Studio, the preset selector, each numeric weight input, each range slider, the chat send control, and all icon-only close controls receive meaningful names. The existing Vietnamese labels and design are retained.

### Modal keyboard behaviour

A shared `ModalDialog` component owns dialog semantics and focus behaviour for create, delete, and reset flows. It supplies `role="dialog"`, `aria-modal="true"`, an accessible title relation, Escape-to-close, focus placement on the initial field or primary modal control, Tab/Shift+Tab focus containment, and focus restoration to the launcher after closing. It preserves the current backdrop, blur, panel, colour variants, and action buttons.

### Contrast and headings

Only the audited text tokens change: low-contrast code examples on the home page, AI message timestamps, and optional-field copy use darker existing stone/indigo shades that meet WCAG AA for normal text. The AI Skill Co-pilot heading becomes the next valid heading level under the page heading without changing its visual weight or size.

## Validation

- At 375px, each page has a reachable mobile primary navigation and `/skills` has no horizontal clipping in its header.
- Keyboard-only checks cover opening, navigating, and closing each Skill Studio modal, including focus restoration.
- axe scans report no accessible-name, form-label, heading-order, or audited contrast violations on `/`, `/analyze`, `/analyze/batch`, `/skills`, and `/history`.
- `npm run build` completes without TypeScript or production-build errors.

## Documentation impact

The feature spec records responsive and accessible interaction requirements. The architecture plan records the shared modal and navbar responsibilities. The task tracker records completion of the UI remediation phase, and the test plan adds viewport, keyboard, and automated accessibility regression cases.
