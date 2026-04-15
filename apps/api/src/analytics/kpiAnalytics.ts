export type Point = { t: string; v: number };

export const detectChangePoints = (series: Point[], threshold = 2) => {
  if (series.length < 3) return [];
  const diffs = series.slice(1).map((p, i) => p.v - series[i].v);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((acc, d) => acc + (d - mean) ** 2, 0) / diffs.length;
  const std = Math.sqrt(variance || 1);

  return diffs
    .map((d, i) => ({ idx: i + 1, z: Math.abs((d - mean) / std) }))
    .filter((x) => x.z >= threshold)
    .map((x) => ({ timestamp: series[x.idx].t, score: Number(x.z.toFixed(2)) }));
};

export const pearson = (a: number[], b: number[]) => {
  if (!a.length || a.length !== b.length) return 0;
  const meanA = a.reduce((x, y) => x + y, 0) / a.length;
  const meanB = b.reduce((x, y) => x + y, 0) / b.length;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da ** 2;
    denB += db ** 2;
  }
  return Number((num / Math.sqrt((denA || 1) * (denB || 1))).toFixed(3));
};

export const upliftEstimate = (pre: number[], post: number[]) => {
  const preMean = pre.reduce((x, y) => x + y, 0) / (pre.length || 1);
  const postMean = post.reduce((x, y) => x + y, 0) / (post.length || 1);
  const uplift = ((postMean - preMean) / (Math.abs(preMean) || 1)) * 100;
  return Number(uplift.toFixed(2));
};
