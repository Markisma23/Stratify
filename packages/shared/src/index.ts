import { z } from "zod";

export const GapSignalSchema = z.object({
  category: z.enum(["people", "process", "performance"]),
  severity: z.enum(["low", "medium", "high"]),
  title: z.string().min(3)
});

export const RecommendationSchema = z.object({
  interventionId: z.string(),
  title: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string()
});

export type GapSignal = z.infer<typeof GapSignalSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
