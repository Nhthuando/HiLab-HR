# CV Screening Scoring, Prompt & Quota Design

## Goal

Make CV screening rankings consistent with the four displayed component scores, improve JD-to-CV matching, and reduce Gemini/Groq token usage without adding a second model call.

## Current Problem

The model currently returns `overall_score`, and the application trusts that value. The server only calculates a weighted score when the model returns zero. This allows two candidates with different component scores to receive the same total. The prompt also leaves must-have versus preferred requirements, evidence quality, and score calculation too implicit.

## Chosen Design

Use one structured model call per CV. The model identifies JD requirements and scores four categories; application code owns the final arithmetic and classification.

### Scoring contract

The application always calculates:

```text
overall_score = round(
  skills_score * 0.35 +
  experience_score * 0.30 +
  education_score * 0.20 +
  language_score * 0.15
)
```

Classification is derived from this calculated score: `pass` at 70+, `potential` from 50 through 69, and `fail` below 50. The model's `overall_score` and `classification` are accepted only as input-compatible fields and never override the server result.

Missing must-have requirements are not hard rejects. They reduce the relevant component score substantially; preferred requirements affect the score less. The model must distinguish direct evidence, transferable evidence, and no evidence, and must not infer a skill merely because a related keyword appears.

### Structured output

Keep the existing response contract and add `must_have_gaps` to `skills_analysis`. The list contains only unmet mandatory requirements, with concise labels. `matched` and `missing` remain available for the existing UI and exports.

The prompt limits output to five strengths, five weaknesses, five interview questions, twelve matched skills, and twelve missing skills. Details and summary are concise, evidence-based Vietnamese text.

### Prompt and input budget

- Send a compact scoring rubric instead of the full rubric document on every request.
- Normalize and cap JD text and extracted CV text before interpolation into the prompt.
- Preserve text-first processing for text PDFs; use inline PDF only when text extraction is unavailable or too short.
- Keep deterministic email and phone extraction outside the model.
- Use structured JSON schema and low temperature for predictable, compact responses.

### Shared behavior

The Next.js provider and the Python skill script use the same scoring instructions and weighted-score rule. Parsing/normalization remains defensive, but score defaults are neutral rather than invented high scores when a provider omits a category.

## Error Handling

If a provider returns malformed or incomplete data, normalize scores into 0–100, compute the total from normalized component values, derive classification, and preserve deterministic contact fallbacks. Existing Gemini-to-Groq fallback remains unchanged.

## Testing

Add unit-level coverage for weighted-score arithmetic, classification boundaries, and the regression case where component scores differ but model totals match. Add prompt budget/field assertions where practical. Verify the Python script remains syntactically valid and run the production build.

## Acceptance Criteria

1. The screenshot scenario produces 56 for `(60, 20, 90, 70)` and 44 for `(40, 20, 80, 50)`.
2. A model-supplied total cannot make two different component vectors share an incorrect total.
3. Missing mandatory JD requirements are visible as `must_have_gaps` and reduce the relevant score without an automatic hard reject.
4. Text-first requests do not include the full rubric or unbounded CV/JD text.
5. Gemini structured output, Groq fallback, Python CLI output, and existing UI contracts remain functional.
