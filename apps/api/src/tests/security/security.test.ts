import test from "node:test";
import assert from "node:assert/strict";
import { anonymizePii } from "../../compliance/pii.js";

test("security: PII is redacted", () => {
  const result = anonymizePii("Reach me at someone@example.com and +1 202 555 1234");
  assert.match(result, /\[EMAIL_REDACTED\]/);
  assert.match(result, /\[PHONE_REDACTED\]/);
});
