from scoring import calculate_overall_score, classify_score, normalize_score


assert calculate_overall_score(60, 20, 90, 70) == 56
assert calculate_overall_score(40, 20, 80, 50) == 44
assert calculate_overall_score(100, 100, 100, 100) == 100
assert normalize_score("not a score") == 0
assert normalize_score(150) == 100
assert classify_score(49) == "fail"
assert classify_score(50) == "potential"
assert classify_score(69) == "potential"
assert classify_score(70) == "pass"
print("python scoring regression checks passed")
