# HR Skill Studio & Dynamic CV Screening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform HiLab-HR CV screening from static prompts to a dynamic Skill-driven engine, and provide a full-featured Skill Studio with AI Co-pilot chat to inspect, customize, and balance screening rubrics and weights.

**Architecture:** 
Decouples prompt and weight logic in `gemini.ts` and `scoring.ts` into a dynamic `SkillConfig` system initialized from `.agents/skills/hr-cv-screening/`. Creates an AI Co-pilot endpoint `/api/skills/ai-edit` using Gemini 3.1 Flash Lite, a dual-pane `/skills` Studio UI, and integrates skill selection into `/analyze` and `/analyze/batch`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Google Gemini 3.1 Flash Lite (`@google/genai`), LocalStorage/Prisma.

## Global Constraints
- Framework: Next.js 15 App Router, React 19, TypeScript
- Styling: Tailwind CSS v4, Glassmorphism design system matching HiLab-HR
- AI Model: Google Gemini 3.1 Flash Lite (`@google/genai`) accessing key via `process.env.GEMINI_API_KEY`
- Never break existing `/api/analyze` or `/api/analyze/batch` contracts (fallback to default skill if none provided)
- Total weight of Skill criteria must always normalize to 100%

---

### Task 1: Skill Types & Default Skill Definition
**Files:**
- Create: `hilab-hr/src/lib/types/skill.ts`
- Create: `hilab-hr/src/lib/defaultSkill.ts`

**Interfaces:**
- Produces: `SkillWeights`, `SkillConfig`, `AICopilotRequest`, `AICopilotResponse`, `DEFAULT_HR_SKILL`

- [ ] **Step 1: Create `src/lib/types/skill.ts`** with full type contracts.
- [ ] **Step 2: Create `src/lib/defaultSkill.ts`** exporting `DEFAULT_HR_SKILL` with instructions & rubrics sourced directly from `.agents/skills/hr-cv-screening/`.
- [ ] **Step 3: Verify TypeScript compilation** of the newly created types.

---

### Task 2: Dynamic Scoring & Gemini Prompt Engine
**Files:**
- Modify: `hilab-hr/src/lib/scoring.ts`
- Modify: `hilab-hr/src/lib/gemini.ts`

**Interfaces:**
- Consumes: `SkillConfig`, `SkillWeights`, `DEFAULT_HR_SKILL` from Task 1
- Produces: `calculateOverallScore(scores, weights?)`, `analyzeCVWithGemini(pdfBuffer, fileName, jdText, skillConfig?)`

- [ ] **Step 1: Update `scoring.ts`** to support optional `SkillWeights` parameter in `calculateOverallScore` while preserving default fallback.
- [ ] **Step 2: Update `gemini.ts`** to inject dynamic role instructions and scoring rubric from `SkillConfig` into `buildPrompt` and `buildGroqPrompt`.
- [ ] **Step 3: Verify prompt building & scoring logic** with a mock skill config.

---

### Task 3: AI Co-pilot API (`/api/skills/ai-edit`)
**Files:**
- Create: `hilab-hr/src/app/api/skills/ai-edit/route.ts`

**Interfaces:**
- Consumes: `AICopilotRequest`, `SkillConfig` from Task 1, `@google/genai`
- Produces: `POST /api/skills/ai-edit` returning `AICopilotResponse`

- [ ] **Step 1: Implement the route handler** using Gemini 3.1 Flash Lite with structured schema output (`replyMessage`, `changes`, `updatedSkill`).
- [ ] **Step 2: Add validation** to guarantee `updatedSkill.weights` sums to 100% and contains required fields.
- [ ] **Step 3: Test API endpoint** with sample modification prompts.

---

### Task 4: Client Skill Storage Helper
**Files:**
- Create: `hilab-hr/src/lib/skillStorage.ts`

**Interfaces:**
- Consumes: `SkillConfig`, `DEFAULT_HR_SKILL`
- Produces: `getSavedPresets()`, `savePreset(skill)`, `deletePreset(id)`, `getActivePreset()`, `setActivePresetId(id)`, `resetToDefault()`

- [ ] **Step 1: Implement `skillStorage.ts`** with local storage persistence and default preset fallback.
- [ ] **Step 2: Add export & import helpers** for JSON/Markdown skill portability.

---

### Task 5: Skill Studio UI Page (`/skills`)
**Files:**
- Create: `hilab-hr/src/app/skills/page.tsx`
- Modify: `hilab-hr/src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `skillStorage.ts`, `/api/skills/ai-edit`, `SkillConfig`

- [ ] **Step 1: Update `Navbar.tsx`** to add "Bộ Skills HR" link with icon.
- [ ] **Step 2: Build Topbar** with Preset selector dropdown, "+ Tạo mới", "💾 Lưu Preset", "🔄 Khôi phục mặc định".
- [ ] **Step 3: Build Left Column** with:
  - Tab 1: Weight sliders (% visual progress bar & balance validator).
  - Tab 2: Markdown Rubric editor with Preview toggle.
  - Tab 3: System Prompt preview.
- [ ] **Step 4: Build Right Column** with AI Co-pilot chat, quick suggestion pills, diff/change summaries, and undo button.
- [ ] **Step 5: Test UI interactivity** and live synchronization between AI chat responses and Left Column state.

---

### Task 6: Screening Flow Integration (Single & Batch)
**Files:**
- Create: `hilab-hr/src/components/SkillSelector.tsx`
- Modify: `hilab-hr/src/app/api/analyze/route.ts`
- Modify: `hilab-hr/src/app/api/analyze/batch/route.ts`
- Modify: `hilab-hr/src/app/analyze/page.tsx`
- Modify: `hilab-hr/src/app/analyze/batch/page.tsx`

**Interfaces:**
- Consumes: `SkillSelector`, `skillStorage.ts`, `SkillConfig`

- [ ] **Step 1: Create `SkillSelector.tsx`** component allowing recruiters to switch presets and view active weights directly above the upload area.
- [ ] **Step 2: Update `/api/analyze` and `/api/analyze/batch`** to parse `skillConfig` from formData and pass to `analyzeCVWithGemini`.
- [ ] **Step 3: Integrate `SkillSelector`** into `/analyze` and `/analyze/batch`.

---

### Task 7: End-to-End Verification & Build Check
- [ ] **Step 1: Verify AI Co-pilot Chat** modifying a skill (e.g. adjust weights & add criteria).
- [ ] **Step 2: Verify Single & Batch CV Screening** using the modified skill.
- [ ] **Step 3: Run `npm run build`** to ensure clean build with zero TypeScript or styling errors.
- [ ] **Step 4: Update task tracker and documentation** in `docs/features/hr-cv-screening/tasks.md`.
