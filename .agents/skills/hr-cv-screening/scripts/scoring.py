import re


def normalize_score(value, fallback=0) -> int:
    if isinstance(value, bool):
        return fallback
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        match = re.search(r"\d+(?:\.\d+)?", value)
        if not match:
            return fallback
        number = float(match.group(0))
    else:
        return fallback
    if number != number or number in (float("inf"), float("-inf")):
        return fallback
    if 0 < number <= 1:
        number *= 100
    return round(max(0, min(100, number)))


def calculate_overall_score(skills, experience, education, language) -> int:
    return round(
        normalize_score(skills) * 0.35
        + normalize_score(experience) * 0.30
        + normalize_score(education) * 0.20
        + normalize_score(language) * 0.15
    )


def classify_score(score: int) -> str:
    score = normalize_score(score)
    return "pass" if score >= 70 else "potential" if score >= 50 else "fail"
