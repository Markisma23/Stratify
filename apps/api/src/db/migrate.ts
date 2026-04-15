import { logger } from "../config/logger.js";
import { pool } from "./client.js";
import { schemaSql } from "./schema.js";

export const runMigrations = async () => {
  await pool.query(schemaSql);
  logger.info("Database migrations applied");
};
