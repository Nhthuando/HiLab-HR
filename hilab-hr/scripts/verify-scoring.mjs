import assert from "node:assert/strict";

const weighted = (skills, experience, education, language) =>
  Math.round(skills * 0.35 + experience * 0.30 + education * 0.20 + language * 0.15);

assert.equal(weighted(60, 20, 90, 70), 56);
assert.equal(weighted(40, 20, 80, 50), 44);
assert.equal(weighted(100, 100, 100, 100), 100);
assert.equal(weighted(0, 0, 0, 0), 0);
assert.equal(weighted(49, 49, 49, 49) < 50, true);
assert.equal(weighted(50, 50, 50, 50) >= 50, true);
console.log("scoring regression checks passed");
