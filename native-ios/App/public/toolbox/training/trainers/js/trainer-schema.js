import { REQUIRED_COLUMNS, ARRAY_FIELDS } from "./constants.js";
import { asTrimmedString, toArray, uid } from "./utils.js";

function normalizeArrayField(value) {
  return toArray(value);
}

function normalizeState(value) {
  const trimmed = asTrimmedString(value).toUpperCase();
  return trimmed.length > 2 ? trimmed : trimmed;
}

export function ensureLifecycleDefaults(trainer) {
  if (!trainer.recordStatus) {
    trainer.recordStatus = "pending";
  }
  if (!trainer.submitterType) {
    trainer.submitterType = "self-submitted";
  }
  if (!trainer.submittedAt) {
    trainer.submittedAt = new Date().toISOString();
  }
  if (!trainer.visibility) {
    trainer.visibility = trainer.recordStatus === "approved" ? "public" : "admin-only";
  }
  if (trainer.recordStatus === "approved" && !trainer.visibility) {
    trainer.visibility = "public";
  }
  if (trainer.recordStatus !== "approved" && trainer.visibility === "public") {
    trainer.visibility = "admin-only";
  }
  return trainer;
}

export function normalizeTrainerRecord(input, options = {}) {
  const record = { ...REQUIRED_COLUMNS, ...(input || {}) };

  const normalized = {
    ...record,
    id: asTrimmedString(record.id) || uid(),
    name: asTrimmedString(record.name),
    org: asTrimmedString(record.org),
    email: asTrimmedString(record.email),
    phone: asTrimmedString(record.phone),
    specialty: asTrimmedString(record.specialty),
    topics: asTrimmedString(record.topics),
    notes: asTrimmedString(record.notes),
    lat: Number.isFinite(Number(record.lat)) ? Number(record.lat) : null,
    lng: Number.isFinite(Number(record.lng)) ? Number(record.lng) : null,
    locationLabel: asTrimmedString(record.locationLabel || record.location_label),
    travelCapability: asTrimmedString(record.travelCapability || record.travel_capability),
    state: normalizeState(record.state),
    region: asTrimmedString(record.region),
    experienceLevel: asTrimmedString(record.experienceLevel || record.experience_level),
    classSize: asTrimmedString(record.classSize || record.class_size),
    customCurriculum: asTrimmedString(record.customCurriculum || record.custom_curriculum),
    priceRange: asTrimmedString(record.priceRange || record.price_range),
    availability: asTrimmedString(record.availability),
    recordStatus: asTrimmedString(record.recordStatus || record.record_status || "pending"),
    submittedAt: asTrimmedString(record.submittedAt || record.submitted_at),
    reviewedAt: asTrimmedString(record.reviewedAt || record.reviewed_at),
    reviewedBy: asTrimmedString(record.reviewedBy || record.reviewed_by),
    rejectionReason: asTrimmedString(record.rejectionReason || record.rejection_reason),
    submitterType: asTrimmedString(record.submitterType || record.submitter_type || "self-submitted"),
    visibility: asTrimmedString(record.visibility || ""),
    createdAt: asTrimmedString(record.createdAt || record.created_at),
    updatedAt: asTrimmedString(record.updatedAt || record.updated_at)
  };

  ARRAY_FIELDS.forEach((field) => {
    const snake = field.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
    normalized[field] = normalizeArrayField(record[field] ?? record[snake]);
  });

  ensureLifecycleDefaults(normalized);

  if (options.forSubmission && !normalized.submittedAt) {
    normalized.submittedAt = new Date().toISOString();
  }

  return normalized;
}

export function normalizeTrainerArray(records) {
  return (records || []).map((record) => normalizeTrainerRecord(record));
}

export function trainerToDbRow(trainer) {
  const normalized = normalizeTrainerRecord(trainer);
  return {
    id: normalized.id,
    name: normalized.name,
    org: normalized.org,
    email: normalized.email,
    phone: normalized.phone,
    specialty: normalized.specialty,
    topics: normalized.topics,
    notes: normalized.notes,
    lat: normalized.lat,
    lng: normalized.lng,
    location_label: normalized.locationLabel,
    discipline: normalized.discipline,
    hazmat_specialties: normalized.hazmatSpecialties,
    travel_capability: normalized.travelCapability,
    state: normalized.state,
    region: normalized.region,
    certifications: normalized.certifications,
    experience_level: normalized.experienceLevel,
    background: normalized.background,
    industry_experience: normalized.industryExperience,
    training_type: normalized.trainingType,
    class_size: normalized.classSize,
    custom_curriculum: normalized.customCurriculum,
    price_range: normalized.priceRange,
    availability: normalized.availability,
    record_status: normalized.recordStatus,
    submitted_at: normalized.submittedAt,
    reviewed_at: normalized.reviewedAt || null,
    reviewed_by: normalized.reviewedBy || null,
    rejection_reason: normalized.rejectionReason || null,
    submitter_type: normalized.submitterType,
    visibility: normalized.visibility
  };
}
