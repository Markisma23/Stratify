import { logger } from "../config/logger.js";
import { processOutboxBatch } from "./outboxProcessor.js";

const run = async () => {
  const result = await processOutboxBatch(50);
  logger.info({ result }, "Outbox worker run completed");
  process.exit(0);
};

run().catch((error) => {
  logger.error({ error }, "Outbox worker run failed");
  process.exit(1);
});
