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

export interface SkillWeightsInput {
  skills: number;
  experience: number;
  education: number;
  language: number;
}

export function calculateOverallScore(
  scores: ScoreComponents,
  weights?: SkillWeightsInput
): number {
  const sk = normalizeScore(scores.skills);
  const ex = normalizeScore(scores.experience);
  const ed = normalizeScore(scores.education);
  const la = normalizeScore(scores.language);

  if (weights) {
    const total = (weights.skills || 0) + (weights.experience || 0) + (weights.education || 0) + (weights.language || 0);
    if (total > 0) {
      const wSkills = weights.skills / total;
      const wExp = weights.experience / total;
      const wEdu = weights.education / total;
      const wLang = weights.language / total;
      return Math.round(sk * wSkills + ex * wExp + ed * wEdu + la * wLang);
    }
  }

  return Math.round(sk * 0.35 + ex * 0.30 + ed * 0.20 + la * 0.15);
}

export function classifyScore(score: number): Classification {
  const normalized = normalizeScore(score);
  return normalized >= 70 ? "pass" : normalized >= 50 ? "potential" : "fail";
}
