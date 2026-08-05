# CV Screening Scoring & Quota Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CV ranking deterministic from component scores, improve JD evidence matching, and reduce model input/output tokens with one structured call per CV.

**Architecture:** Keep Gemini-first with Groq fallback and text-first PDF processing. Add a small shared TypeScript scoring module for normalization, weighted total, and classification; make the model return component evidence plus mandatory gaps while the application owns the final total. Mirror the compact prompt and deterministic post-processing in the Python screening skill.

**Tech Stack:** Next.js App Router, TypeScript, `@google/genai`, Groq SDK, `pdf-parse`, Python `google-genai`, JSON Schema.

## Global Constraints

- Overall score is always `round(skills*0.35 + experience*0.30 + education*0.20 + language*0.15)`.
- Classification is always derived from the calculated score: `pass >= 70`, `potential 50-69`, `fail < 50`.
- Missing mandatory requirements reduce the relevant component score but never cause an automatic hard reject.
- Never hardcode API keys or credentials; use existing environment variables.
- Preserve text-first processing and send inline PDF data only when extracted text is unavailable or too short.
- Keep the existing API response shape compatible; `must_have_gaps` is additive under `skills_analysis`.
- Run `npm run build` in `hilab-hr` before handoff.

---

### Task 1: Add deterministic scoring primitives and extend the response schema

**Files:**
- Create: `hilab-hr/src/lib/scoring.ts`
- Modify: `hilab-hr/src/lib/gemini.ts` near `CVAnalysisResult`, `analysisSchema`, and `parseJsonResult`
- Test: `hilab-hr/scripts/verify-scoring.mjs`

**Interfaces:**
- `scoring.ts` produces `normalizeScore(value: unknown, fallback?: number): number`, `calculateOverallScore(scores: ScoreComponents): number`, and `classifyScore(score: number): Classification`.
- `gemini.ts` consumes those helpers and produces normalized `CVAnalysisResult` values with `skills_analysis.must_have_gaps`.

- [ ] **Step 1: Write the regression checks**

Create a small executable regression script that asserts the public scoring cases:

```js
import assert from "node:assert/strict";

const weighted = (skills, experience, education, language) =>
  Math.round(skills * 0.35 + experience * 0.30 + education * 0.20 + language * 0.15);

assert.equal(weighted(60, 20, 90, 70), 56);
assert.equal(weighted(40, 20, 80, 50), 44);
assert.equal(weighted(100, 100, 100, 100), 100);
assert.equal(weighted(0, 0, 0, 0), 0);
console.log("scoring regression checks passed");
```

- [ ] **Step 2: Run the regression checks and confirm the baseline case is represented**

Run: `node scripts/verify-scoring.mjs` from `hilab-hr`.

Expected: PASS and the two screenshot values are 56 and 44.

- [ ] **Step 3: Implement the scoring module**

Define the exact shared types and clamp all component scores to `0..100`:

```ts
export type Classification = "pass" | "potential" | "fail";
export type ScoreComponents = {
  skills: number;
  experience: number;
  education: number;
  language: number;
};

export function calculateOverallScore(scores: ScoreComponents): number {
  return Math.round(
    normalizeScore(scores.skills) * 0.35 +
      normalizeScore(scores.experience) * 0.30 +
      normalizeScore(scores.education) * 0.20 +
      normalizeScore(scores.language) * 0.15
  );
}

export function classifyScore(score: number): Classification {
  const normalized = normalizeScore(score);
  return normalized >= 70 ? "pass" : normalized >= 50 ? "potential" : "fail";
}
```

`normalizeScore` must accept numeric strings, percentages, and finite numbers while returning the fallback (default `0`) for missing/invalid values.

- [ ] **Step 4: Extend schema and parser without trusting model totals**

Add `must_have_gaps: string[]` to the skills schema/interface. Parse it from `must_have_gaps`, `missing_must_have`, or `required_gaps`, cap it at 12 items, and cap matched/missing arrays at 12 items. Change `parseJsonResult` to always calculate `overall_score` from the four normalized component scores and always derive `classification` from that result. Set missing category-score fallbacks to `0`, not invented scores such as 70 or 75.

- [ ] **Step 5: Run TypeScript/build checks for the scoring changes**

Run: `npm run build` from `hilab-hr`.

Expected: production build completes without TypeScript errors.

### Task 2: Replace verbose prompts with compact evidence-based prompts and budget guards

**Files:**
- Modify: `hilab-hr/src/lib/gemini.ts` in `buildPrompt`, `buildGroqPrompt`, and provider request configuration
- Modify: `hilab-hr/src/lib/gemini.ts` near text extraction helpers

**Interfaces:**
- `compactText(text: string, maxChars: number): string` consumes raw JD/CV text and produces normalized, bounded text.
- Prompt builders consume compact text and produce one compact instruction set for Gemini and Groq.

- [ ] **Step 1: Add deterministic text compaction**

Normalize repeated whitespace and cap JD at 8,000 characters and extracted CV text at 16,000 characters. If truncation is needed, retain the beginning and end with a clear marker so contact/header and closing sections are not silently discarded. Keep regex email/phone extraction on the unmodified extracted text.

- [ ] **Step 2: Implement the compact scoring prompt**

Use a short prompt with these rules:

```text
Use only evidence present in the JD and CV. Do not infer a skill from a related keyword.
Separate JD requirements into must-have and preferred.
For each category return a 0-100 score and concise evidence.
Missing must-have items lower the relevant category strongly but do not hard-reject the candidate.
Direct evidence scores higher than transferable evidence; no evidence scores 0 for that requirement.
The application calculates overall_score and classification; ignore any total you may produce.
Return Vietnamese text, at most 5 strengths, 5 weaknesses, 5 questions, 12 matched skills, 12 missing skills, and 12 must_have_gaps.
```

Keep the four weights, score bands, evidence rule, output field names, and classification thresholds explicit. Do not embed the full `scoring_rubric.md` in every request.

- [ ] **Step 3: Reduce Groq prompt overhead**

Remove the large example JSON object from the Groq system prompt. Keep only the required field contract and the compact JD/CV instructions. Pass compact CV/JD text to Groq as well as Gemini.

- [ ] **Step 4: Tune structured output settings**

Keep `responseMimeType: "application/json"` and the existing schema. Retain temperature `0.3`; do not add a second model call. Preserve inline PDF fallback for scanned files, but use the compact JD prompt in that branch.

- [ ] **Step 5: Verify prompt budget behavior without an API call**

Run the build and inspect the generated source to verify the full rubric is not interpolated into provider prompts and that `compactText` is applied before prompt construction. Run `node scripts/verify-scoring.mjs` again.

### Task 3: Align the Python HR screening skill with the web scorer

**Files:**
- Modify: `.agents/skills/hr-cv-screening/scripts/analyze_cv.py`
- Modify: `.agents/skills/hr-cv-screening/resources/scoring_rubric.md` only if the documented weights or mandatory-gap semantics need correction
- Test: `.agents/skills/hr-cv-screening/scripts/verify_scoring.py`

**Interfaces:**
- Python prompt uses the compact scoring rules and the additive `must_have_gaps` field.
- Python post-processing returns a total and classification computed from component scores, matching TypeScript arithmetic.

- [ ] **Step 1: Add Python regression checks**

Create executable assertions for 56, 44, classification boundaries 49/50/69/70, and clamping invalid scores to the fallback. Keep the checks dependency-free.

- [ ] **Step 2: Replace full-rubric interpolation with compact rules**

Keep `load_scoring_rubric` available for documentation compatibility, but use a compact constant in the API prompt. Add the `must_have_gaps` schema property and cap verbose output lists in the prompt.

- [ ] **Step 3: Normalize and recompute Python results**

After `json.loads`, normalize each component score, compute the weighted total, derive classification, cap arrays, and default missing scores to zero. Do not trust model `overall_score` or `classification`.

- [ ] **Step 4: Run Python syntax and regression checks**

Run: `python -m py_compile .agents/skills/hr-cv-screening/scripts/analyze_cv.py .agents/skills/hr-cv-screening/scripts/verify_scoring.py`.

Run: `python .agents/skills/hr-cv-screening/scripts/verify_scoring.py`.

Expected: both commands pass with no API key required.

### Task 4: Update product specs and acceptance tests

**Files:**
- Modify: `docs/features/hr-cv-screening/spec.md`
- Modify: `docs/features/hr-cv-screening/plan.md`
- Modify: `docs/features/hr-cv-screening/tasks.md`
- Modify: `docs/features/hr-cv-screening/test-plan.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Document deterministic scoring ownership**

Update the API/AI sections to state that the server computes the weighted total and classification from component scores, and that missing must-have requirements are strong penalties rather than hard rejects.

- [ ] **Step 2: Document the additive `must_have_gaps` field and input budgets**

Record the field in `CVAnalysisResult`, the compact prompt behavior, the 8,000-character JD cap, the 16,000-character CV text cap, and the inline PDF scan fallback.

- [ ] **Step 3: Add regression acceptance cases**

Add test cases for the screenshot vectors, model total mismatch, classification boundaries, missing must-have penalty visibility, and bounded prompt inputs. Mark only tests actually executed as passed.

- [ ] **Step 4: Review docs for conflicting weights**

Correct any stale references that say experience is 35% or education is 15%; the implemented contract is skills 35%, experience 30%, education 20%, language 15%.

### Task 5: Final verification and handoff

**Files:**
- Verify: `hilab-hr/src/lib/scoring.ts`
- Verify: `hilab-hr/src/lib/gemini.ts`
- Verify: `.agents/skills/hr-cv-screening/scripts/analyze_cv.py`

- [ ] **Step 1: Run dependency-free scoring checks**

Run both JavaScript and Python regression scripts.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint` and `npm run build` from `hilab-hr`.

Expected: no lint, type, or production compilation errors.

- [ ] **Step 3: Inspect final diff and preserve unrelated work**

Run: `git status --short` and `git diff --stat`. Confirm only the scoring/prompt/quota implementation, its tests, design/plan docs, and required feature documentation changed; do not reset or overwrite the user's existing modifications.
