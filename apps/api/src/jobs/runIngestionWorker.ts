import { logger } from "../config/logger.js";
import { processIngestionBatch } from "../ingestion/worker.js";

const run = async () => {
  const processed = await processIngestionBatch(50);
  logger.info({ processed }, "Ingestion worker run completed");
  process.exit(0);
};

run().catch((error) => {
  logger.error({ error }, "Ingestion worker run failed");
  process.exit(1);
});
