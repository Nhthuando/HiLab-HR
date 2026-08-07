# Task Tracker: HR Skill Studio & Dynamic CV Screening

- [x] **Phase 1: Core Types & Dynamic Prompt Engine**
  - [x] `1.1` Define `SkillConfig`, `SkillWeights`, `AICopilotRequest/Response` types in `src/lib/types/skill.ts`
  - [x] `1.2` Implement default skill loader from `.agents/skills/hr-cv-screening/` in `src/lib/defaultSkill.ts`
  - [x] `1.3` Refactor `src/lib/gemini.ts` and `src/lib/scoring.ts` to support dynamic weights & rubric injection

- [x] **Phase 2: AI Co-pilot & Skill Management APIs**
  - [x] `2.1` Create API route `/api/skills/ai-edit` for conversational skill editing
  - [x] `2.2` Implement client storage helper for skill presets in `src/lib/skillStorage.ts`

- [x] **Phase 3: Skill Studio UI (`/skills`)**
  - [x] `3.1` Build Topbar with Preset selector, Create, Save, Reset actions
  - [x] `3.2` Build Left Pane: Weight Sliders, Markdown Rubric Editor & Preview, Prompt Inspector
  - [x] `3.3` Build Right Pane: AI Co-pilot Chat with Quick Suggestion Pills & Diff Summaries

- [x] **Phase 4: Screening Flow Integration & UI Polish**
  - [x] `4.1` Update Navbar navigation to include "Bộ Skills HR" (`/skills`)
  - [x] `4.2` Add Skill Selector Dropdown on Single Screening (`/analyze`)
  - [x] `4.3` Add Skill Selector Dropdown on Batch Screening (`/analyze/batch`)
  - [x] `4.4` Update API routes `/api/analyze` and `/api/analyze/batch` to accept custom skill configuration

- [x] **Phase 5: Verification & Documentation**
  - [x] `5.1` Verify AI chat editing, weight auto-balancing, and preset switching
  - [x] `5.2` Verify Single & Batch CV analysis with customized skills
  - [x] `5.3` Run `npm run build` and ensure zero errors

- [x] **Phase 6: Responsive & Accessible UI Remediation**
  - [x] `6.1` Add accessible mobile navigation dropdown to Navbar
  - [x] `6.2` Name screening file inputs and Skill selectors programmatically
  - [x] `6.3` Make Skill Studio header responsive and name audited controls
  - [x] `6.4` Introduce shared keyboard-safe modal dialog behaviour
  - [x] `6.5` Correct audited contrast and heading-level defects
  - [x] `6.6` Verify 375px, desktop, axe and production build regression cases
