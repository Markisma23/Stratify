import { query } from "../db/client.js";
import { inc } from "../observability/metrics.js";

const processJob = async (id: string, jobType: string, payload: Record<string, unknown>) => {
  switch (jobType) {
    case "ocr":
    case "parse_document":
    case "parse_bpmn":
      inc("stratify_jobs_processed_total");
      await query("UPDATE ingestion_jobs SET status = 'completed', updated_at = NOW() WHERE id = $1", [id]);
      return;
    default:
      throw new Error(`Unsupported job type: ${jobType}`);
  }
};

export const processIngestionBatch = async (limit = 20) => {
  const claimed = await query<{ id: string; job_type: string; payload: Record<string, unknown>; attempts: number }>(
    `UPDATE ingestion_jobs
       SET status = 'processing', updated_at = NOW()
     WHERE id IN (
      SELECT id FROM ingestion_jobs
      WHERE status IN ('queued', 'retry')
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, job_type, payload, attempts`,
    [limit]
  );

  for (const job of claimed.rows) {
    try {
      await processJob(job.id, job.job_type, job.payload);
    } catch (error) {
      inc("stratify_jobs_failed_total");
      if (job.attempts + 1 >= 5) {
        await query(
          "INSERT INTO ingestion_dead_letters (id, job_type, payload, reason, created_at) VALUES ($1, $2, $3, $4, NOW())",
          [job.id, job.job_type, JSON.stringify(job.payload), String(error)]
        );
        await query("UPDATE ingestion_jobs SET status = 'dead_letter', attempts = attempts + 1, updated_at = NOW() WHERE id = $1", [
          job.id
        ]);
      } else {
        await query("UPDATE ingestion_jobs SET status = 'retry', attempts = attempts + 1, updated_at = NOW() WHERE id = $1", [job.id]);
      }
    }
  }

  return claimed.rowCount ?? 0;
};
