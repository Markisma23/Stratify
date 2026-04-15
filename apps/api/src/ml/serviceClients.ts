import { env } from "../config/env.js";

const postJson = async <T>(url: string, body: object): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.ML_SERVICE_TOKEN}` },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`ML service error ${response.status}`);
  return (await response.json()) as T;
};

export const nlpExtractRemote = async (text: string) =>
  postJson<{ entities: Array<{ type: string; value: string; confidence: number }> }>(`${env.ML_SERVICE_URL}/nlp/extract`, { text });

export const recommendRemote = async (signals: unknown) =>
  postJson<{ recommendations: Array<{ interventionId: string; title: string; confidence: number; rationale: string }>; modelVersion: string }>(
    `${env.ML_SERVICE_URL}/recommend/rank`,
    { signals }
  );

export const analyticsRemote = async (payload: unknown) =>
  postJson<{ changePoints: unknown[]; correlation: number; uplift: number }>(`${env.ML_SERVICE_URL}/analytics/kpi`, payload);
