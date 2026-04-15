import { randomUUID } from "node:crypto";
import { query } from "../client.js";
import type { ExtractedEntity } from "../../nlp/pipeline.js";

export const replaceEntitiesForDoc = async (docId: string, entities: ExtractedEntity[]) => {
  await query("DELETE FROM extracted_entities WHERE doc_id = $1", [docId]);

  for (const entity of entities) {
    await query(
      `INSERT INTO extracted_entities (id, doc_id, entity_type, value, confidence, ontology_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), docId, entity.type, entity.value, entity.confidence, null]
    );
  }
};

export const listEntities = async (docId: string) => {
  const result = await query<{
    id: string;
    entity_type: string;
    value: string;
    confidence: number;
    ontology_code: string | null;
  }>("SELECT id, entity_type, value, confidence, ontology_code FROM extracted_entities WHERE doc_id = $1 ORDER BY created_at", [docId]);

  return result.rows;
};

export const addHitlCorrection = async (entityId: string, reviewerEmail: string, correctedValue: string, reason?: string) => {
  await query(
    "INSERT INTO hitl_corrections (id, entity_id, reviewer_email, corrected_value, reason) VALUES ($1, $2, $3, $4, $5)",
    [randomUUID(), entityId, reviewerEmail, correctedValue, reason ?? null]
  );

  await query("UPDATE extracted_entities SET value = $1, confidence = 0.99 WHERE id = $2", [correctedValue, entityId]);
};
