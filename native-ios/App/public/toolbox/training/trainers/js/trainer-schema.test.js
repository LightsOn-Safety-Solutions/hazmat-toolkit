import test from "node:test";
import assert from "node:assert/strict";

import { normalizeTrainerRecord } from "./trainer-schema.js";

test("normalizeTrainerRecord prefers snake_case record_status over camelCase recordStatus", () => {
  const normalized = normalizeTrainerRecord({
    id: "trainer-1",
    name: "Example Trainer",
    recordStatus: "pending",
    record_status: "rejected"
  });

  assert.equal(normalized.recordStatus, "rejected");
});
