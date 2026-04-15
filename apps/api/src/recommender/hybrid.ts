import { generateRecommendations, type GapSignal } from "../services/recommender.js";

export type RankedRecommendation = {
  interventionId: string;
  title: string;
  confidence: number;
  rationale: string;
  modelVersion: string;
};

const learnedRank = (signals: GapSignal[]) => {
  const base = generateRecommendations(signals);
  return base.map((r, idx) => ({ ...r, confidence: Math.min(0.99, r.confidence + 0.01 * (3 - idx)) }));
};

export const rankHybrid = (signals: GapSignal[], canaryPercent = 20): RankedRecommendation[] => {
  const bucket = Math.floor(Math.random() * 100);
  const canary = bucket < canaryPercent;
  const ranked = canary ? learnedRank(signals) : generateRecommendations(signals);
  return ranked.map((r) => ({ ...r, modelVersion: canary ? "learned-v0-canary" : "heuristic-v1" }));
};
