import {
  MARKET_MAX_PAGES,
  MARKET_PAGE_BATCH_SIZE,
  MARKET_PAGE_SIZE,
  SPARKLINE_POINTS,
} from "../config.js";

const API_URL = "https://api.coingecko.com/api/v3/coins/markets";
const COINS_LIST_URL =
  "https://api.coingecko.com/api/v3/coins/list?include_platform=false";
const USD_BRL_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";

let cachedCatalogSize = null;

export async function fetchMarketData({ onProgress } = {}) {
  const [exchangeRate, catalogSize] = await Promise.all([
    fetchUsdBrlRate(),
    fetchCatalogSize(),
  ]);

  const assets = [];
  let currentPage = 1;

  while (currentPage <= MARKET_MAX_PAGES) {
    const pages = Array.from({ length: MARKET_PAGE_BATCH_SIZE }, (_, index) => {
      return currentPage + index;
    }).filter((page) => page <= MARKET_MAX_PAGES);

    const batches = await Promise.all(pages.map((page) => fetchMarketPage(page)));
    let reachedLastPage = false;

    batches.forEach((batch) => {
      if (batch.length < MARKET_PAGE_SIZE) {
        reachedLastPage = true;
      }

      if (!batch.length) {
        return;
      }

      const normalizedBatch = batch.map((item) =>
        normalizeAsset(item, exchangeRate),
      );
      assets.push(...normalizedBatch);

      onProgress?.({
        batch: normalizedBatch,
        loaded: assets.length,
        total: catalogSize,
        done: false,
      });
    });

    if (reachedLastPage) {
      break;
    }

    currentPage += MARKET_PAGE_BATCH_SIZE;
  }

  onProgress?.({
    batch: [],
    loaded: assets.length,
    total: catalogSize ?? assets.length,
    done: true,
  });

  return {
    assets,
    totalAvailable: catalogSize ?? assets.length,
  };
}

async function fetchMarketPage(page) {
  const url = new URL(API_URL);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(MARKET_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (response.ok) {
      const payload = await response.json();
      return Array.isArray(payload) ? payload : [];
    }

    if (response.status !== 429 || attempt === 4) {
      throw new Error("Nao foi possivel carregar as cotacoes agora.");
    }

    await wait(1500 * (attempt + 1));
  }

  return [];
}

async function fetchCatalogSize() {
  if (cachedCatalogSize) {
    return cachedCatalogSize;
  }

  try {
    const response = await fetch(COINS_LIST_URL, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    cachedCatalogSize = Array.isArray(payload) ? payload.length : null;
    return cachedCatalogSize;
  } catch {
    return null;
  }
}

function normalizeAsset(item, exchangeRate) {
  return {
    id: item.id,
    name: item.name,
    symbol: item.symbol?.toUpperCase() ?? "--",
    accent: createAccentFromId(item.id),
    image: item.image,
    price: item.current_price,
    priceBrl: item.current_price * exchangeRate,
    high24h: item.high_24h,
    high24hBrl: item.high_24h * exchangeRate,
    low24h: item.low_24h,
    low24hBrl: item.low_24h * exchangeRate,
    change24h:
      item.price_change_percentage_24h_in_currency ??
      item.price_change_percentage_24h ??
      0,
    marketCapRank: item.market_cap_rank,
    marketCap: item.market_cap,
    totalVolume: item.total_volume,
    lastUpdated: item.last_updated,
    sparkline: compressSparkline([], SPARKLINE_POINTS),
  };
}

function createAccentFromId(id) {
  const palette = [
    "#f97316",
    "#6366f1",
    "#14b8a6",
    "#2563eb",
    "#ec4899",
    "#eab308",
    "#06b6d4",
    "#ef4444",
    "#8b5cf6",
    "#22c55e",
  ];

  let hash = 0;

  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}

async function fetchUsdBrlRate() {
  try {
    const response = await fetch(USD_BRL_URL, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return 5.5;
    }

    const payload = await response.json();
    const bid = Number(payload?.USDBRL?.bid);

    return Number.isFinite(bid) ? bid : 5.5;
  } catch {
    return 5.5;
  }
}

function compressSparkline(points, targetPoints) {
  if (!points.length) {
    return [];
  }

  if (points.length <= targetPoints) {
    return points;
  }

  const sampled = [];

  for (let index = 0; index < targetPoints; index += 1) {
    const pointIndex = Math.round(
      (index / (targetPoints - 1)) * (points.length - 1),
    );
    sampled.push(points[pointIndex]);
  }

  return sampled;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
