# Design Spec: Dual Skill Document & Rubric Editor in HR Skill Studio

**Date:** 2026-08-06  
**Status:** Approved by User  
**Target:** HiLab-HR Skill Studio (`/skills`)

---

## 1. Overview & Objective

Enhance the **HR Skill Studio** editor tab to provide dual-document editing capabilities for both `scoring_rubric.md` (scoring criteria) and `SKILL.md` (full skill specification, persona, and execution workflow). This enables recruiters to customize not just the scoring rubric, but the entire skill instructions and prompt architecture, with full two-way binding between the UI editor and the AI Co-pilot Chat.

---

## 2. Architecture & Data Model

### 2.1 Extended `SkillConfig`
Update `SkillConfig` interface in `src/lib/types/skill.ts`:
```typescript
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  roleInstructions: string;
  scoringRubric: string;      // Content of scoring_rubric.md
  skillDocument: string;      // Content of SKILL.md
  weights: SkillWeights;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2.2 Default Skill Definition
In `src/lib/defaultSkill.ts`:
- Define `DEFAULT_SKILL_DOCUMENT` containing the full markdown from `.agents/skills/hr-cv-screening/SKILL.md`.
- Populate `DEFAULT_HR_SKILL.skillDocument` with this content.

---

## 3. UI/UX Specification (`/skills`)

### 3.1 Sub-Navigation within Tab 2
Replace the previous "Soạn thảo / Xem trước" buttons with:
1. **File Switcher Tabs**:
   - `[📄 scoring_rubric.md]` (Scoring rubric editor)
   - `[📋 SKILL.md]` (Full skill specification editor)
2. **Right-aligned Toggle Action**:
   - `[👁️ Xem trước / ✏️ Sửa]` to toggle Markdown rendered preview for the currently active file tab.

### 3.2 Editing & Persistence Flow
- When switching between `scoring_rubric.md` and `SKILL.md`, editor state preserves changes in the active `SkillConfig` draft.
- Clicking **"💾 Lưu thay đổi"** persists both markdown files into LocalStorage / active preset.
- Clicking **"Khôi phục mặc định"** resets both files to their canonical contents from `.agents/skills/hr-cv-screening/`.

---

## 4. AI Co-pilot Chat Engine (`/api/skills/ai-edit`)

### 4.1 Schema Update
In `src/app/api/skills/ai-edit/route.ts`:
- Include `skillDocument: { type: Type.STRING }` in the structured response schema.
- Pass both `scoringRubric` and `skillDocument` in the context sent to Gemini 3.1 Flash Lite.
- AI Co-pilot automatically updates `scoringRubric`, `skillDocument`, and `weights` according to user chat requests.

---

## 5. Verification Plan

1. **Unit/TypeScript Build**: `npm run build` with 0 errors.
2. **UI Verification**:
   - Switching between `scoring_rubric.md` and `SKILL.md` displays correct content and allows manual editing.
   - Toggle preview correctly renders Markdown for each file.
   - Chatting with AI updates either or both files based on prompt intent.
   - Preset save/reload retains changes in both files.
