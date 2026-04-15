import { ARRAY_FIELDS, SEARCHABLE_FIELDS, SINGLE_FILTER_FIELDS } from "./constants.js";
import { asTrimmedString, toArray } from "./utils.js";

export function buildSearchIndexString(trainer) {
  const tokens = [];
  SEARCHABLE_FIELDS.forEach((field) => {
    const value = trainer[field];
    if (Array.isArray(value)) {
      tokens.push(value.join(" "));
    } else if (value) {
      tokens.push(String(value));
    }
  });
  return tokens.join(" ").toLowerCase();
}

function matchArrayField(trainerValues, selectedValues) {
  if (!selectedValues.length) {
    return true;
  }
  const set = new Set(toArray(trainerValues));
  return selectedValues.some((value) => set.has(value));
}

function matchSingleField(trainerValue, selectedValue) {
  if (!selectedValue) {
    return true;
  }
  return asTrimmedString(trainerValue) === selectedValue;
}

export function trainerMatchesFilters(trainer, filters) {
  for (const field of ARRAY_FIELDS) {
    if (!matchArrayField(trainer[field], filters[field] || [])) {
      return false;
    }
  }

  for (const field of SINGLE_FILTER_FIELDS) {
    if (!matchSingleField(trainer[field], filters[field] || "")) {
      return false;
    }
  }

  const query = asTrimmedString(filters.query).toLowerCase();
  if (query) {
    const index = buildSearchIndexString(trainer);
    if (!index.includes(query)) {
      return false;
    }
  }

  return true;
}

export function getFilteredTrainers(trainers, filters) {
  return (trainers || []).filter((trainer) => trainerMatchesFilters(trainer, filters));
}
