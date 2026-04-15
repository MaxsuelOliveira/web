import {
  DEFAULT_FILTER,
  MAX_RENDERED_ASSETS,
  REFRESH_INTERVAL_MS,
} from "./config.js";
import { fetchMarketData } from "./services/market-api.js";
import {
  notifyAlert,
  registerNotificationWorker,
  requestNotificationPermission,
} from "./services/notifications.js";
import {
  createAlert,
  incrementViews,
  markAlertTriggered,
  readAlerts,
  readFavorites,
  readLastFilter,
  readTheme,
  removeAlert,
  saveLastFilter,
  saveTheme,
  toggleFavorite,
} from "./services/storage.js";
import {
  createFormatter,
  renderAlertList,
  renderAlertOptions,
  renderAssetList,
  renderAssetListLoading,
  renderFeaturedAsset,
  setActiveFilter,
  setStatus,
} from "./ui.js";

const elements = {
  featured: {
    rank: document.getElementById("featured-rank"),
    image: document.getElementById("featured-image"),
    symbol: document.getElementById("featured-symbol"),
    name: document.getElementById("featured-name"),
    price: document.getElementById("featured-price"),
    priceBrl: document.getElementById("featured-price-brl"),
    change: document.getElementById("featured-change"),
    high: document.getElementById("featured-high"),
    low: document.getElementById("featured-low"),
  },
  refreshButton: document.getElementById("refresh-button"),
  featuredFavoriteButton: document.getElementById("featured-favorite-button"),
  featuredFavoriteIcon: document.querySelector(
    "#featured-favorite-button .button-icon .bi",
  ),
  featuredFavoriteLabel: document.querySelector(
    "#featured-favorite-button [data-featured-favorite-label]",
  ),
  searchInput: document.getElementById("search-input"),
  filterButtons: [...document.querySelectorAll("[data-filter]")],
  statusLine: document.getElementById("status-line"),
  assetCount: document.getElementById("asset-count"),
  usageTotalAssets: document.getElementById("usage-total-assets"),
  usageTotalFavorites: document.getElementById("usage-total-favorites"),
  usageTotalAlerts: document.getElementById("usage-total-alerts"),
  usageTotalViews: document.getElementById("usage-total-views"),
  assetList: document.getElementById("asset-list"),
  alertForm: document.getElementById("alert-form"),
  alertAsset: document.getElementById("alert-asset"),
  alertCondition: document.getElementById("alert-condition"),
  alertPrice: document.getElementById("alert-price"),
  alertList: document.getElementById("alert-list"),
  notificationButton: document.getElementById("notification-button"),
  alertsCloseTriggers: [
    ...document.querySelectorAll("[data-close-alerts-panel]"),
  ],
  settingsPanel: document.getElementById("settings-panel"),
  settingsCloseTriggers: [
    ...document.querySelectorAll("[data-close-settings-panel]"),
  ],
  themeOptions: [...document.querySelectorAll("[data-theme-option]")],
  dockSettings: document.getElementById("dock-settings"),
  marketPanel: document.getElementById("market-panel"),
  alertsPanel: document.getElementById("alerts-panel"),
  dockMarket: document.getElementById("dock-market"),
  dockAlert: document.getElementById("dock-alert"),
};

const THEMES = {
  light: {
    themeColor: "#f6efe7",
    statusMessage: "Tema Light ativado.",
  },
  dark: {
    themeColor: "#0c1220",
    statusMessage: "Tema Dark ativado.",
  },
};

const DEFAULT_THEME = "dark";

const formatPrice = createFormatter("USD");
const formatPriceBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const state = {
  assets: [],
  totalAvailableAssets: 0,
  alerts: readAlerts(),
  favorites: new Set(readFavorites()),
  filter: readLastFilter(DEFAULT_FILTER),
  query: "",
  isAlertsPanelOpen: false,
  isSettingsPanelOpen: false,
  lastFocusedElement: null,
  theme: readTheme(DEFAULT_THEME),
  notificationRegistration: null,
  views: 0,
};

function formatInteger(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function setRefreshLoading(isLoading) {
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);
  elements.refreshButton.setAttribute("aria-busy", String(isLoading));
}

function showMarketLoading() {
  renderAssetListLoading({
    target: elements.assetList,
    count: window.matchMedia("(min-width: 1040px)").matches ? 6 : 4,
  });
  elements.assetCount.textContent = "Carregando...";
}

function orderAssets(assets) {
  return [...assets].sort((left, right) => {
    const favoritesDelta =
      Number(state.favorites.has(right.id)) -
      Number(state.favorites.has(left.id));

    if (favoritesDelta !== 0) {
      return favoritesDelta;
    }

    return (
      (left.marketCapRank ?? Number.MAX_SAFE_INTEGER) -
      (right.marketCapRank ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

function getFeaturedAsset() {
  return orderAssets(state.assets)[0];
}

function getFilteredAssets() {
  let assets = orderAssets(state.assets);

  if (state.query) {
    const query = state.query.toLowerCase();
    assets = assets.filter((asset) => {
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
      );
    });
  }

  if (state.filter === "gainers") {
    assets = assets.filter((asset) => asset.change24h >= 0);
  }

  if (state.filter === "losers") {
    assets = assets.filter((asset) => asset.change24h < 0);
  }

  if (state.filter === "favorites") {
    assets = assets.filter((asset) => state.favorites.has(asset.id));
  }

  if (state.filter === "alerts") {
    const alertIds = new Set(state.alerts.map((alert) => alert.assetId));
    assets = assets.filter((asset) => alertIds.has(asset.id));
  }

  return assets;
}

function syncAlertOptions() {
  const selectedAsset = elements.alertAsset.value;

  renderAlertOptions({
    assets: state.assets,
    select: elements.alertAsset,
  });

  if (selectedAsset) {
    elements.alertAsset.value = selectedAsset;
  }
}

function updateView() {
  const assets = getFilteredAssets();
  const displayedAssets = assets.slice(0, MAX_RENDERED_ASSETS);
  const featuredAsset = getFeaturedAsset();

  renderFeaturedAsset(featuredAsset, elements.featured, formatPrice, (value) =>
    formatPriceBrl.format(value),
  );

  syncFeaturedFavoriteButton(featuredAsset);
  renderAssetList({
    assets: displayedAssets,
    alerts: state.alerts,
    favorites: state.favorites,
    target: elements.assetList,
    formatPrice,
    formatPriceBrl: (value) => formatPriceBrl.format(value),
    onCreateAlert: prefillAlertForm,
    onToggleFavorite: handleToggleFavorite,
  });
  renderAlertList({
    alerts: state.alerts,
    target: elements.alertList,
    formatPrice,
    onRemove: handleRemoveAlert,
  });

  const showingSuffix =
    assets.length > MAX_RENDERED_ASSETS
      ? ` / exibindo ${formatInteger(displayedAssets.length)}`
      : "";

  elements.assetCount.textContent = `${formatInteger(assets.length)} ativos${showingSuffix}`;
  elements.usageTotalAssets.textContent = formatInteger(
    state.totalAvailableAssets || state.assets.length,
  );
  elements.usageTotalFavorites.textContent = formatInteger(state.favorites.size);
  elements.usageTotalAlerts.textContent = formatInteger(state.alerts.length);
  elements.usageTotalViews.textContent = formatInteger(state.views);

  setActiveFilter(elements.filterButtons, state.filter);
  syncThemeOptions();
}

function syncFeaturedFavoriteButton(asset) {
  const label = elements.featuredFavoriteLabel;

  if (!asset) {
    elements.featuredFavoriteButton.disabled = true;
    elements.featuredFavoriteButton.classList.remove("is-active");
    elements.featuredFavoriteButton.setAttribute("aria-pressed", "false");
    if (label) {
      label.textContent = "Favoritar";
    }
    return;
  }

  const isFavorite = state.favorites.has(asset.id);
  elements.featuredFavoriteButton.disabled = false;
  elements.featuredFavoriteButton.classList.toggle("is-active", isFavorite);
  elements.featuredFavoriteButton.setAttribute(
    "aria-pressed",
    String(isFavorite),
  );
  elements.featuredFavoriteIcon?.classList.toggle("bi-star", !isFavorite);
  elements.featuredFavoriteIcon?.classList.toggle("bi-star-fill", isFavorite);
  if (label) {
    label.textContent = isFavorite ? "Favorito" : "Favoritar";
  }
}

function handleToggleFavorite(assetId) {
  state.favorites = new Set(toggleFavorite(assetId));
  const asset = state.assets.find((item) => item.id === assetId);
  updateView();
  setStatus(
    elements.statusLine,
    state.favorites.has(assetId)
      ? `${asset?.name ?? "Moeda"} adicionada aos favoritos.`
      : `${asset?.name ?? "Moeda"} removida dos favoritos.`,
    "neutral",
  );
}

function prefillAlertForm(asset) {
  openAlertsPanel({ focusTarget: elements.alertPrice });
  syncAlertOptions();
  elements.alertAsset.value = asset.id;
  elements.alertPrice.value = asset.price.toFixed(asset.price >= 1 ? 2 : 6);
  elements.alertPrice.focus();
  setStatus(
    elements.statusLine,
    `Alerta pronto para ${asset.name}. Ajuste o alvo e salve.`,
    "neutral",
  );
}

function handleRemoveAlert(alertId) {
  state.alerts = removeAlert(alertId);
  updateView();
  setStatus(elements.statusLine, "Alerta removido com sucesso.", "neutral");
}

async function enableNotifications() {
  try {
    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      setStatus(
        elements.statusLine,
        "Permissao de notificacao nao concedida.",
        "warning",
      );
      return;
    }

    setStatus(
      elements.statusLine,
      "Notificacoes ativadas para os alertas salvos.",
      "success",
    );
  } catch (error) {
    setStatus(elements.statusLine, error.message, "warning");
  }
}

async function checkAlerts() {
  if (!state.assets.length || !state.alerts.length) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const alertsToTrigger = state.alerts.filter((alert) => {
    if (alert.triggeredAt) {
      return false;
    }

    const asset = state.assets.find((item) => item.id === alert.assetId);

    if (!asset) {
      return false;
    }

    if (alert.condition === "above") {
      return asset.price >= alert.targetPrice;
    }

    return asset.price <= alert.targetPrice;
  });

  for (const alert of alertsToTrigger) {
    const asset = state.assets.find((item) => item.id === alert.assetId);
    await notifyAlert(state.notificationRegistration, alert, asset.price);
    state.alerts = markAlertTriggered(alert.id);
  }

  if (alertsToTrigger.length) {
    updateView();
    setStatus(
      elements.statusLine,
      `${alertsToTrigger.length} alerta${alertsToTrigger.length === 1 ? "" : "s"} disparado${alertsToTrigger.length === 1 ? "" : "s"}.`,
      "success",
    );
  }
}

async function loadMarketData({ silent = false } = {}) {
  const loadedAssets = [];

  if (!silent) {
    setRefreshLoading(true);
    if (!state.assets.length) {
      showMarketLoading();
    }
    setStatus(elements.statusLine, "Atualizando cotacoes...", "neutral");
  }

  try {
    const result = await fetchMarketData({
      onProgress: ({ batch, loaded, total, done }) => {
        if (batch.length) {
          loadedAssets.push(...batch);
          state.assets = [...loadedAssets];
          state.totalAvailableAssets = total ?? loadedAssets.length;
          updateView();

          if (state.isAlertsPanelOpen) {
            syncAlertOptions();
          }
        }

        if (!silent) {
          const totalLabel = total ? ` de ${formatInteger(total)}` : "";
          const prefix = done
            ? "Catalogo completo carregado."
            : "Carregando moedas...";
          setStatus(
            elements.statusLine,
            `${prefix} ${formatInteger(loaded)}${totalLabel}.`,
            "neutral",
          );
        }
      },
    });

    state.assets = result.assets;
    state.totalAvailableAssets = result.totalAvailable;
    updateView();
    await checkAlerts();
    setStatus(
      elements.statusLine,
      `Cotacoes atualizadas as ${new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}.`,
      "success",
    );
  } catch (error) {
    if (!state.assets.length) {
      elements.assetList.setAttribute("aria-busy", "false");
      elements.assetList.innerHTML = `<p class="empty-state">${error.message}</p>`;
      elements.assetCount.textContent = "0 ativos";
    }
    setStatus(elements.statusLine, error.message, "warning");
  } finally {
    if (!silent) {
      setRefreshLoading(false);
    }
  }
}

function handleFilterClick(event) {
  state.filter = event.currentTarget.dataset.filter;
  saveLastFilter(state.filter);
  updateView();
}

function handleSearchInput(event) {
  state.query = event.target.value.trim();
  updateView();
}

function handleAlertSubmit(event) {
  event.preventDefault();

  const assetId = elements.alertAsset.value;
  const targetPrice = Number(elements.alertPrice.value);
  const asset = state.assets.find((item) => item.id === assetId);

  if (!asset || Number.isNaN(targetPrice) || targetPrice <= 0) {
    setStatus(
      elements.statusLine,
      "Preencha um alvo valido para salvar o alerta.",
      "warning",
    );
    return;
  }

  state.alerts = createAlert({
    assetId: asset.id,
    assetName: asset.name,
    symbol: asset.symbol,
    condition: elements.alertCondition.value,
    targetPrice,
  });

  updateView();
  elements.alertForm.reset();
  syncAlertOptions();
  setStatus(elements.statusLine, `Alerta salvo para ${asset.name}.`, "success");
}

function syncOverlayState() {
  const isOverlayOpen = state.isAlertsPanelOpen || state.isSettingsPanelOpen;
  document.body.classList.toggle("alerts-screen-open", isOverlayOpen);
}

function syncAlertsPanelState() {
  elements.alertsPanel.hidden = !state.isAlertsPanelOpen;
  elements.dockAlert.setAttribute(
    "aria-expanded",
    String(state.isAlertsPanelOpen),
  );
  elements.dockAlert.classList.toggle("is-active", state.isAlertsPanelOpen);
  syncOverlayState();
}

function syncSettingsPanelState() {
  elements.settingsPanel.hidden = !state.isSettingsPanelOpen;
  elements.dockSettings.setAttribute(
    "aria-expanded",
    String(state.isSettingsPanelOpen),
  );
  elements.dockSettings.classList.toggle("is-active", state.isSettingsPanelOpen);
  syncOverlayState();
}

function syncThemeOptions() {
  elements.themeOptions.forEach((button) => {
    const isActive = button.dataset.themeOption === state.theme;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
    button.setAttribute("role", "radio");
  });
}

function applyTheme(theme, options = {}) {
  const nextTheme = THEMES[theme] ? theme : DEFAULT_THEME;
  state.theme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.body.dataset.theme = nextTheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEMES[nextTheme].themeColor);
  saveTheme(nextTheme);
  syncThemeOptions();

  if (options.silent !== true) {
    setStatus(elements.statusLine, THEMES[nextTheme].statusMessage, "success");
  }
}

function openAlertsPanel(options = {}) {
  if (!state.isAlertsPanelOpen) {
    state.lastFocusedElement = document.activeElement;
    state.isAlertsPanelOpen = true;
    syncAlertsPanelState();
  }

  syncAlertOptions();

  window.setTimeout(() => {
    options.focusTarget?.focus();
  }, 60);
}

function closeAlertsPanel() {
  if (!state.isAlertsPanelOpen) {
    return;
  }

  state.isAlertsPanelOpen = false;
  syncAlertsPanelState();
  window.setTimeout(() => {
    const target =
      state.lastFocusedElement instanceof HTMLElement
        ? state.lastFocusedElement
        : elements.dockAlert;
    target.focus();
    state.lastFocusedElement = null;
  }, 60);
}

function openSettingsPanel() {
  if (!state.isSettingsPanelOpen) {
    state.lastFocusedElement = document.activeElement;
    state.isSettingsPanelOpen = true;
    syncSettingsPanelState();
  }
}

function closeSettingsPanel() {
  if (!state.isSettingsPanelOpen) {
    return;
  }

  state.isSettingsPanelOpen = false;
  syncSettingsPanelState();
  window.setTimeout(() => {
    const target =
      state.lastFocusedElement instanceof HTMLElement
        ? state.lastFocusedElement
        : elements.dockSettings;
    target.focus();
    state.lastFocusedElement = null;
  }, 60);
}

function toggleSettingsPanel() {
  if (state.isSettingsPanelOpen) {
    closeSettingsPanel();
    return;
  }

  openSettingsPanel();
}

function toggleAlertsPanel() {
  if (state.isAlertsPanelOpen) {
    closeAlertsPanel();
    return;
  }

  openAlertsPanel({ focusTarget: elements.alertAsset });
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => loadMarketData());
  elements.featuredFavoriteButton.addEventListener("click", () => {
    const featuredAsset = getFeaturedAsset();

    if (featuredAsset) {
      handleToggleFavorite(featuredAsset.id);
    }
  });
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", handleFilterClick);
  });
  elements.alertForm.addEventListener("submit", handleAlertSubmit);
  elements.notificationButton.addEventListener("click", enableNotifications);
  elements.alertsCloseTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeAlertsPanel);
  });
  elements.settingsCloseTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeSettingsPanel);
  });
  elements.themeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeOption);
    });
  });
  elements.dockMarket.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  elements.dockSettings.addEventListener("click", toggleSettingsPanel);
  elements.dockAlert.addEventListener("click", toggleAlertsPanel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.isSettingsPanelOpen) {
        closeSettingsPanel();
        return;
      }

      closeAlertsPanel();
    }
  });
}

async function init() {
  state.views = incrementViews();
  applyTheme(state.theme, { silent: true });
  state.notificationRegistration = await registerNotificationWorker();
  syncAlertsPanelState();
  syncSettingsPanelState();
  bindEvents();
  showMarketLoading();
  setStatus(elements.statusLine, "Carregando moedas...", "neutral");
  await loadMarketData();
  window.setInterval(() => {
    loadMarketData({ silent: true });
  }, REFRESH_INTERVAL_MS);
}

init();
