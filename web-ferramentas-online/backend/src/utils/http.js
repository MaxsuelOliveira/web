export async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.message || data?.errors?.[0]?.message || `Falha ao acessar ${url}`,
    );
  }

  return data;
}

export function safeJsonParse(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeIdentifier(value) {
  return String(value || "").replace(/\D/g, "");
}
