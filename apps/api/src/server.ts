import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { runMigrations } from "./db/migrate.js";

const start = async () => {
  await runMigrations();

  app.listen(env.PORT, () => {
    logger.info(`API listening on :${env.PORT}`);
  });
};

start().catch((error) => {
  logger.error({ error }, "Failed to start API");
  process.exit(1);
});
