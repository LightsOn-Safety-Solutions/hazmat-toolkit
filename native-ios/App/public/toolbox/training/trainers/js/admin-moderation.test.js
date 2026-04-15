import test from "node:test";
import assert from "node:assert/strict";

import { buildModerationUpdate, DEFAULT_REJECTION_REASON } from "./admin-moderation.js";

test("buildModerationUpdate builds rejected payload with trimmed reason", () => {
  const result = buildModerationUpdate({
    trainer: { id: "trainer-1" },
    status: "rejected",
    adminIdentifier: "admin@example.com",
    rejectionReasonInput: "  Missing credentials  "
  });

  assert.equal(result.cancelled, false);
  assert.equal(result.update.record_status, "rejected");
  assert.equal(result.update.visibility, "admin-only");
  assert.equal(result.update.reviewed_by, "admin@example.com");
  assert.equal(result.update.rejection_reason, "Missing credentials");
  assert.ok(Number.isFinite(Date.parse(result.update.reviewed_at)));
});

test("buildModerationUpdate uses default reason when rejected without reason", () => {
  const result = buildModerationUpdate({
    trainer: { id: "trainer-1" },
    status: "rejected",
    adminIdentifier: "admin@example.com",
    rejectionReasonInput: "   "
  });

  assert.equal(result.cancelled, false);
  assert.equal(result.update.rejection_reason, DEFAULT_REJECTION_REASON);
});

test("buildModerationUpdate cancels rejected update when prompt is cancelled", () => {
  const result = buildModerationUpdate({
    trainer: { id: "trainer-1" },
    status: "rejected",
    adminIdentifier: "admin@example.com",
    rejectionReasonInput: null
  });

  assert.equal(result.cancelled, true);
  assert.equal("update" in result, false);
});

test("buildModerationUpdate clears rejection reason when approved", () => {
  const result = buildModerationUpdate({
    trainer: { id: "trainer-1" },
    status: "approved",
    adminIdentifier: "admin@example.com"
  });

  assert.equal(result.cancelled, false);
  assert.equal(result.update.record_status, "approved");
  assert.equal(result.update.visibility, "public");
  assert.equal(result.update.rejection_reason, null);
});
