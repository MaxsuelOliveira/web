export function createFormatter(currency = "USD") {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 6,
  });

  return (value) => formatter.format(value);
}

function getButtonIcon(name, options = {}) {
  if (name === "favorite") {
    const favoriteIcon = options.isActive ? "bi-star-fill" : "bi-star";
    return `
      <span class="button-icon" aria-hidden="true">
        <i class="bi ${favoriteIcon}"></i>
      </span>
    `;
  }

  if (name === "alert") {
    return `
      <span class="button-icon" aria-hidden="true">
        <i class="bi bi-bell"></i>
      </span>
    `;
  }

  if (name === "delete") {
    return `
      <span class="button-icon" aria-hidden="true">
        <i class="bi bi-trash3-fill"></i>
      </span>
    `;
  }

  return "";
}

function createAssetLoadingCard(index) {
  return `
    <article class="asset-card asset-card--loading" style="--loading-delay: ${index * 120}ms" aria-hidden="true">
      <div class="asset-card__header">
        <div class="asset-card__identity asset-card__identity--loading">
          <span class="skeleton skeleton--coin"></span>
          <div class="asset-card__identity-copy">
            <span class="skeleton skeleton--title"></span>
            <span class="skeleton skeleton--text"></span>
          </div>
        </div>
        <span class="skeleton skeleton--badge"></span>
      </div>

      <div class="asset-card__body">
        <div class="asset-card__body-copy">
          <span class="skeleton skeleton--price"></span>
          <span class="skeleton skeleton--text"></span>
        </div>
        <span class="skeleton skeleton--change"></span>
      </div>

      <div class="asset-card__trend asset-card__trend--loading">
        <span class="skeleton skeleton--trend-label"></span>
        <span class="skeleton skeleton--sparkline"></span>
      </div>

      <dl class="asset-card__stats">
        <div>
          <span class="skeleton skeleton--stat-label"></span>
          <span class="skeleton skeleton--stat-value"></span>
          <span class="skeleton skeleton--stat-text"></span>
        </div>
        <div>
          <span class="skeleton skeleton--stat-label"></span>
          <span class="skeleton skeleton--stat-value"></span>
          <span class="skeleton skeleton--stat-text"></span>
        </div>
      </dl>

      <div class="asset-card__actions">
        <span class="skeleton skeleton--action"></span>
        <span class="skeleton skeleton--action"></span>
      </div>
    </article>
  `;
}

export function renderAssetListLoading({ target, count = 6 }) {
  target.setAttribute("aria-busy", "true");
  target.innerHTML = Array.from({ length: count }, (_, index) =>
    createAssetLoadingCard(index),
  ).join("");
}

export function renderFeaturedAsset(
  asset,
  elements,
  formatPrice,
  formatPriceBrl,
) {
  if (!asset) {
    return;
  }

  elements.rank.textContent = asset.marketCapRank
    ? `Top ${asset.marketCapRank}`
    : "Em destaque";
  elements.image.src = asset.image;
  elements.image.alt = asset.name;
  elements.symbol.textContent = asset.symbol;
  elements.name.textContent = asset.name;
  elements.price.textContent = formatPrice(asset.price);
  elements.priceBrl.textContent = formatPriceBrl(asset.priceBrl);
  elements.change.textContent = `${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(2)}%`;
  elements.change.classList.remove("positive", "negative");
  elements.change.classList.add(asset.change24h >= 0 ? "positive" : "negative");
  elements.change.dataset.variation =
    asset.change24h >= 0 ? "positive" : "negative";
  elements.high.textContent = formatPrice(asset.high24h);
  elements.low.textContent = formatPrice(asset.low24h);
}

function createSparklineMarkup(points, variationClass) {
  if (!points.length) {
    return '<div class="sparkline sparkline--empty"></div>';
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const polylinePoints = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * 100;
      const y = 30 - ((point - min) / range) * 30;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return `
    <svg class="sparkline sparkline--${variationClass}" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${polylinePoints}" />
    </svg>
  `;
}

export function renderAssetList({
  assets,
  alerts,
  favorites,
  target,
  formatPrice,
  formatPriceBrl,
  onCreateAlert,
  onToggleFavorite,
}) {
  target.innerHTML = "";
  target.setAttribute("aria-busy", "false");

  if (!assets.length) {
    target.innerHTML =
      '<p class="empty-state">Nenhuma moeda encontrada para esse filtro.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  assets.forEach((asset) => {
    const card = document.createElement("article");
    card.className = "asset-card";
    card.style.setProperty("--asset-accent", asset.accent);

    const alertCount = alerts.filter(
      (alert) => alert.assetId === asset.id,
    ).length;
    const changeClass = asset.change24h >= 0 ? "positive" : "negative";
    const isFavorite = favorites.has(asset.id);

    card.innerHTML = `
      <div class="asset-card__header">
        <div class="asset-card__identity">
          <img src="${asset.image}" alt="${asset.name}" loading="lazy">
          <div>
            <strong>${asset.name}</strong>
            <span>${asset.symbol}</span>
          </div>
        </div>
        <span class="mini-badge">${alertCount} alerta${alertCount === 1 ? "" : "s"}</span>
      </div>

      <div class="asset-card__body">
        <div>
          <p class="asset-price">${formatPrice(asset.price)}</p>
          <p class="asset-price-brl">${formatPriceBrl(asset.priceBrl)}</p>
        </div>
        <p class="asset-change ${changeClass}">${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(2)}%</p>
      </div>

      <div class="asset-card__trend">
        <span>Hist\u00f3rico 7d</span>
        ${createSparklineMarkup(asset.sparkline, changeClass)}
      </div>

      <dl class="asset-card__stats">
        <div>
          <dt>Max 24h</dt>
          <dd>${formatPrice(asset.high24h)}</dd>
          <small>${formatPriceBrl(asset.high24hBrl)}</small>
        </div>
        <div>
          <dt>Min 24h</dt>
          <dd>${formatPrice(asset.low24h)}</dd>
          <small>${formatPriceBrl(asset.low24hBrl)}</small>
        </div>
      </dl>

      <div class="asset-card__actions">
        <button class="favorite-toggle favorite-toggle--icon ${isFavorite ? "is-active" : ""}" type="button" aria-label="${isFavorite ? `Remover ${asset.name} dos favoritos` : `Favoritar ${asset.name}`}" title="${isFavorite ? "Remover dos favoritos" : "Favoritar"}" aria-pressed="${isFavorite}">
          ${getButtonIcon("favorite", { isActive: isFavorite })}
        </button>
        <button class="secondary-button secondary-button--icon" type="button" aria-label="Criar alerta para ${asset.name}" title="Criar alerta">${getButtonIcon("alert")}</button>
      </div>
    `;

    const [favoriteButton, alertButton] = card.querySelectorAll("button");

    favoriteButton.addEventListener("click", () => onToggleFavorite(asset.id));
    alertButton.addEventListener("click", () => onCreateAlert(asset));
    fragment.appendChild(card);
  });

  target.appendChild(fragment);
}

export function renderAlertOptions({ assets, select }) {
  select.innerHTML = assets
    .map(
      (asset) =>
        `<option value="${asset.id}">${asset.name} (${asset.symbol})</option>`,
    )
    .join("");
}

export function renderAlertList({ alerts, target, formatPrice, onRemove }) {
  target.innerHTML = "";

  if (!alerts.length) {
    target.innerHTML =
      '<p class="empty-state">Nenhum alerta salvo. Crie um alvo para ser avisado automaticamente.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  alerts.forEach((alert) => {
    const item = document.createElement("article");
    item.className = "alert-item";
    item.innerHTML = `
      <div>
        <strong>${alert.assetName} (${alert.symbol})</strong>
        <p>${alert.condition === "above" ? "Acima de" : "Abaixo de"} ${formatPrice(alert.targetPrice)}</p>
        <small>${alert.triggeredAt ? "Disparado" : "Monitorando"}</small>
      </div>
      <button class="ghost-button" type="button">${getButtonIcon("delete")}<span>Remover</span></button>
    `;

    item
      .querySelector("button")
      .addEventListener("click", () => onRemove(alert.id));
    fragment.appendChild(item);
  });

  target.appendChild(fragment);
}

export function setActiveFilter(buttons, filter) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });
}

export function setStatus(target, message, tone = "neutral") {
  target.textContent = message;
  target.dataset.tone = tone;
}
