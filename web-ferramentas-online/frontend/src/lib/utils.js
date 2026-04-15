export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function slugifyText(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  const chars = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(chars);
}

export function decodeBase64(value) {
  const chars = atob(value);
  const bytes = Uint8Array.from(chars, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer), (item) =>
    item.toString(16).padStart(2, "0"),
  ).join("");
}

export function formatJsonPreview(value) {
  return JSON.stringify(value, null, 2);
}
