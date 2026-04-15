import { STORAGE_KEYS } from "../config.js";

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function readAlerts() {
  return parseJson(localStorage.getItem(STORAGE_KEYS.alerts), []);
}

export function saveAlerts(alerts) {
  localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
}

export function readFavorites() {
  return parseJson(localStorage.getItem(STORAGE_KEYS.favorites), []);
}

export function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

export function toggleFavorite(assetId) {
  const favorites = new Set(readFavorites());

  if (favorites.has(assetId)) {
    favorites.delete(assetId);
  } else {
    favorites.add(assetId);
  }

  const nextFavorites = [...favorites];
  saveFavorites(nextFavorites);
  return nextFavorites;
}

export function createAlert({
  assetId,
  assetName,
  symbol,
  condition,
  targetPrice,
}) {
  const alerts = readAlerts();
  const nextAlerts = [
    {
      id: crypto.randomUUID(),
      assetId,
      assetName,
      symbol,
      condition,
      targetPrice,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
    },
    ...alerts,
  ];

  saveAlerts(nextAlerts);
  return nextAlerts;
}

export function removeAlert(alertId) {
  const nextAlerts = readAlerts().filter((alert) => alert.id !== alertId);
  saveAlerts(nextAlerts);
  return nextAlerts;
}

export function markAlertTriggered(alertId) {
  const nextAlerts = readAlerts().map((alert) => {
    if (alert.id !== alertId || alert.triggeredAt) {
      return alert;
    }

    return {
      ...alert,
      triggeredAt: new Date().toISOString(),
    };
  });

  saveAlerts(nextAlerts);
  return nextAlerts;
}

export function readLastFilter(defaultValue) {
  return localStorage.getItem(STORAGE_KEYS.lastFilter) ?? defaultValue;
}

export function saveLastFilter(filter) {
  localStorage.setItem(STORAGE_KEYS.lastFilter, filter);
}

export function readTheme(defaultValue) {
  return localStorage.getItem(STORAGE_KEYS.theme) ?? defaultValue;
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function readViews() {
  return Number(localStorage.getItem(STORAGE_KEYS.views) ?? 0);
}

export function incrementViews() {
  const nextViews = readViews() + 1;
  localStorage.setItem(STORAGE_KEYS.views, String(nextViews));
  return nextViews;
}
