export type Classification = "pass" | "potential" | "fail";

export type ScoreComponents = {
  skills: number;
  experience: number;
  education: number;
  language: number;
};

/** Normalize model-provided scores into the public 0-100 range. */
export function normalizeScore(value: unknown, fallback = 0): number {
  let numeric: number;

  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string") {
    const match = value.match(/\d+(?:\.\d+)?/);
    if (!match) return fallback;
    numeric = Number(match[0]);
    if (numeric > 0 && numeric <= 1) numeric *= 100;
  } else {
    return fallback;
  }

  if (!Number.isFinite(numeric)) return fallback;
  return Math.round(Math.max(0, Math.min(100, numeric)));
}

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
