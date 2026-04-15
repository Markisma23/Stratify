import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";
import { inc } from "../observability/metrics.js";

export const recordDriftMetric = async (modelName: string, metricName: string, metricValue: number, threshold: number) => {
  const breached = metricValue > threshold;
  await query(
    `INSERT INTO model_drift_metrics (id, model_name, metric_name, metric_value, threshold, is_breached)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), modelName, metricName, metricValue, threshold, breached]
  );

  if (breached) {
    inc("stratify_drift_breaches_total");
  }
};
