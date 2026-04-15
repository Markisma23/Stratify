import test from "node:test";
import assert from "node:assert/strict";
import { detectChangePoints, pearson, upliftEstimate } from "../analytics/kpiAnalytics.js";

test("kpi analytics computes correlation and uplift", () => {
  const corr = pearson([1, 2, 3], [2, 4, 6]);
  assert.equal(corr, 1);

  const uplift = upliftEstimate([10, 10], [12, 12]);
  assert.equal(uplift, 20);
});

test("change point detection returns events", () => {
  const points = [
    { t: "2025-01-01", v: 10 },
    { t: "2025-02-01", v: 11 },
    { t: "2025-03-01", v: 50 },
    { t: "2025-04-01", v: 51 }
  ];
  const result = detectChangePoints(points, 1);
  assert.ok(result.length >= 1);
});
