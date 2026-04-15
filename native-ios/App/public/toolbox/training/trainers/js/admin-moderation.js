export const DEFAULT_REJECTION_REASON = "Rejected by Super Admin";

export function buildModerationUpdate({ trainer, status, adminIdentifier, rejectionReasonInput }) {
  if (!trainer?.id) {
    throw new Error("Trainer id is required for moderation updates.");
  }

  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!normalizedStatus) {
    throw new Error("Moderation status is required.");
  }

  const update = {
    record_status: normalizedStatus,
    visibility: normalizedStatus === "approved" ? "public" : "admin-only",
    reviewed_at: new Date().toISOString(),
    reviewed_by: String(adminIdentifier || "unknown-admin").trim() || "unknown-admin"
  };

  if (normalizedStatus === "approved") {
    update.rejection_reason = null;
  }

  if (normalizedStatus === "rejected") {
    if (rejectionReasonInput === null) {
      return { cancelled: true };
    }

    const reason = String(rejectionReasonInput || "").trim();
    update.rejection_reason = reason || DEFAULT_REJECTION_REASON;
  }

  return { cancelled: false, update };
}
