# Test Plan: HR Skill Studio & Dynamic CV Screening

## 1. Test Scenarios

### TC-01: Load Default Skill
- **Action**: Access `/skills` for the first time.
- **Expected**: Default preset is loaded with values matching `.agents/skills/hr-cv-screening/` (Weights: 35/30/20/15, complete rubric markdown).

### TC-02: AI Co-pilot Edit Skill
- **Action**: Type natural language prompt: "Tăng trọng số kỹ năng lên 40% và thêm tiêu chí chứng chỉ AWS".
- **Expected**: AI responds with concise summary, weights update automatically, and rubric markdown gains AWS criteria. Total weights = 100%.

### TC-03: Create & Save Custom Preset
- **Action**: Create new preset named "Senior Backend", modify weights, save.
- **Expected**: Preset is persisted in storage and appears in preset dropdown list.

### TC-04: Screening with Custom Skill
- **Action**: Go to `/analyze`, select "Senior Backend", upload CV and submit.
- **Expected**: Analysis score is computed using the custom weights and rubric from the selected skill.

### TC-05: Build Verification
- **Action**: Run `npm run build`.
- **Expected**: Compiles cleanly with zero type errors.
