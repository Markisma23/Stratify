import { randomBytes, randomUUID } from "node:crypto";
import { query } from "../client.js";

type DbUser = {
  id: string;
  email: string;
  role: string;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  account_type: "personal" | "organization";
};

export const findUserByEmail = async (email: string) => {
  const result = await query<DbUser>(
    "SELECT id, email, role, mfa_enabled, mfa_secret, account_type FROM app_users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] ?? null;
};

export const createUser = async (email: string, role: string, accountType: "personal" | "organization" = "organization") => {
  const id = randomUUID();
  await query("INSERT INTO app_users (id, email, role, account_type) VALUES ($1, $2, $3, $4)", [id, email, role, accountType]);
  return { id, email, role, mfa_enabled: false, mfa_secret: null, account_type: accountType };
};

export const setupMfa = async (email: string) => {
  const secret = randomBytes(20).toString("hex");
  await query("UPDATE app_users SET mfa_secret = $1 WHERE email = $2", [secret, email]);
  return secret;
};

export const enableMfa = async (email: string) => {
  await query("UPDATE app_users SET mfa_enabled = TRUE WHERE email = $1", [email]);
};
