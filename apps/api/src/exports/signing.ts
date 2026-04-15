import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";

export const signArtifact = async (frameworkId: string, format: string, filePath: string) => {
  const bytes = await readFile(filePath);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const immutableRef = `sha256:${digest}`;

  await query(
    `INSERT INTO artifact_signatures (id, framework_id, format, file_path, digest_sha256, immutable_ref)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), frameworkId, format, filePath, digest, immutableRef]
  );

  return { digest, immutableRef };
};
