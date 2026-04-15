import { randomUUID } from "node:crypto";
import { withTransaction } from "../transaction.js";

type FileRecordInput = {
  uploaderEmail: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  ingestionStatus: string;
};

export const createUploadedFileRecord = async (file: FileRecordInput) => {
  const id = randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO uploaded_files (id, uploader_email, original_name, mime_type, size_bytes, ingestion_status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, file.uploaderEmail, file.originalName, file.mimeType, file.sizeBytes, file.ingestionStatus]
    );

    const jobTypes = ["ocr", "parse_document"];
    for (const jobType of jobTypes) {
      await client.query(
        `INSERT INTO ingestion_jobs (id, file_id, job_type, payload, status)
         VALUES ($1, $2, $3, $4::jsonb, 'queued')`,
        [randomUUID(), id, jobType, JSON.stringify({ filename: file.originalName })]
      );
    }
  });

  return { id, ...file };
};
