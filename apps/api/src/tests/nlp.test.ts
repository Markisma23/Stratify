import test from "node:test";
import assert from "node:assert/strict";
import { extractEntities, mapToOntology } from "../nlp/pipeline.js";

test("extracts strategy entities", () => {
  const entities = extractEntities("Objective: Revenue Growth. Initiative: Cloud Migration. KPI: Revenue Growth.");
  assert.ok(entities.length >= 2);
});

test("maps ontology key", () => {
  assert.equal(mapToOntology("Revenue Growth"), "KPI_REVENUE_GROWTH");
});
