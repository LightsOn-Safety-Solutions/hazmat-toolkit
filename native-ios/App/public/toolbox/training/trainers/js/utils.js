export function escapeHtml(input) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function uid() {
  return `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

export function toArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function asTrimmedString(value) {
  return String(value ?? "").trim();
}

export function createOption(label, value = label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

export function createCheckbox(name, value, checked = false) {
  const label = document.createElement("label");
  label.className = "checkItem";
  label.innerHTML = `<input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${checked ? "checked" : ""}/> <span>${escapeHtml(value)}</span>`;
  return label;
}

export function debounce(fn, delay = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function setStatus(el, msg, kind = "info") {
  if (!el) {
    return;
  }
  const klass = kind === "ok" ? "ok" : kind === "bad" ? "bad" : "";
  el.innerHTML = `<strong>Status:</strong> <span class="${klass}">${escapeHtml(msg)}</span>`;
}

export function joinSummary(values, max = 3) {
  const list = toArray(values);
  if (!list.length) {
    return "";
  }
  if (list.length <= max) {
    return list.join(", ");
  }
  return `${list.slice(0, max).join(", ")} +${list.length - max} more`;
}
