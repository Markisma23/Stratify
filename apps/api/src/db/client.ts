import { Pool } from "pg";
import { env } from "../config/env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === "production" ? 20 : 5,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false
});

export const query = <T>(text: string, params: unknown[] = []) => pool.query<T>(text, params);
