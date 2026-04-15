import { query } from "../db/client.js";

export const getSloSnapshot = async () => {
  const failedJobs = await query<{ count: string }>("SELECT COUNT(*)::text as count FROM ingestion_jobs WHERE status = 'dead_letter'");
  const driftBreaches = await query<{ count: string }>("SELECT COUNT(*)::text as count FROM model_drift_metrics WHERE is_breached = TRUE");

  return {
    ingestionDeadLetters: Number(failedJobs.rows[0]?.count ?? 0),
    driftBreaches: Number(driftBreaches.rows[0]?.count ?? 0),
    targetAvailability: 99.5
  };
};
