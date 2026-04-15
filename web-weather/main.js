const DEFAULT_LOCATION = {
  city: "Barreiras",
  state: "Bahia",
  country: "Brasil",
  latitude: -12.1528,
  longitude: -44.99,
  source: "Local padrão",
};

const ICONS = {
  sunny: "./assets/icons/005-sunny.png",
  sun: "./assets/icons/009-sun.png",
  cloudyDay: "./assets/icons/002-cloudy-day.png",
  rainy: "./assets/icons/003-rainy-day.png",
  hail: "./assets/icons/004-hailstorm.png",
  thunder: "./assets/icons/006-thunderstorm.png",
  cloudyNight: "./assets/icons/007-night.png",
  snow: "./assets/icons/008-snowy.png",
  night: "./assets/icons/010-night-1.png",
  windy: "./assets/icons/001-windy.png",
};

const appState = {
  currentLocation: null,
  currentSource: "",
  lastCep: "",
  forecastItems: [],
  forecastPage: 0,
  isPreciseLocationActive: false,
};

const elements = {
  cepForm: document.querySelector("#cepForm"),
  cepInput: document.querySelector("#cepInput"),
  statusMessage: document.querySelector("#statusMessage"),
  useLocationButton: document.querySelector("#useLocationButton"),
  refreshButton: document.querySelector("#refreshButton"),
  forecastPrevButton: document.querySelector("#forecastPrevButton"),
  forecastNextButton: document.querySelector("#forecastNextButton"),
  locationName: document.querySelector("#locationName"),
  locationDate: document.querySelector("#locationDate"),
  currentTemperature: document.querySelector("#currentTemperature"),
  currentCondition: document.querySelector("#currentCondition"),
  weatherIllustration: document.querySelector("#weatherIllustration"),
  humidityValue: document.querySelector("#humidityValue"),
  pressureValue: document.querySelector("#pressureValue"),
  summaryIcon: document.querySelector("#summaryIcon"),
  feelsLikeValue: document.querySelector("#feelsLikeValue"),
  summaryTitle: document.querySelector("#summaryTitle"),
  summaryRegion: document.querySelector("#summaryRegion"),
  updatedAt: document.querySelector("#updatedAt"),
  forecastList: document.querySelector("#forecastList"),
  panel: document.querySelector(".weather-panel"),
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeWeather();
});

function bindEvents() {
  elements.cepForm.addEventListener("submit", handleCepSubmit);
  elements.useLocationButton.addEventListener("click", () => {
    loadWeatherForCurrentLocation(true);
  });
  elements.refreshButton.addEventListener("click", refreshCurrentWeather);
  elements.forecastPrevButton.addEventListener("click", () =>
    changeForecastPage(-1),
  );
  elements.forecastNextButton.addEventListener("click", () =>
    changeForecastPage(1),
  );
  elements.cepInput.addEventListener("input", formatCepInput);
  window.addEventListener("resize", handleViewportResize);
}

async function initializeWeather() {
  const storedCep = window.localStorage.getItem("weather:lastCep");

  if (storedCep) {
    elements.cepInput.value = formatCep(storedCep);
  }
  await loadWeatherForCurrentLocation(false);
}

async function handleCepSubmit(event) {
  event.preventDefault();

  const cep = onlyDigits(elements.cepInput.value);

  if (cep.length !== 8) {
    showStatus("Digite um CEP com 8 números.", true);
    elements.cepInput.focus();
    return;
  }

  elements.cepInput.value = formatCep(cep);
  await searchWeatherByCep(cep);
}

async function refreshCurrentWeather() {
  if (!appState.currentLocation) {
    await loadWeatherForCurrentLocation(false);
    return;
  }

  await fetchAndRenderWeather(
    appState.currentLocation,
    appState.currentSource || "Atualização manual",
  );
}

async function searchWeatherByCep(cep) {
  try {
    setLoading("Buscando localização pelo CEP...");

    const viaCepData = await fetchJson(`https://viacep.com.br/ws/${cep}/json/`);

    if (viaCepData.erro) {
      throw new Error("CEP não encontrado.");
    }

    const geocodedLocation = await geocodeLocation({
      city: viaCepData.localidade,
      state: viaCepData.estado || viaCepData.uf,
      countryCode: "BR",
      postalCode: cep,
    });

    const location = {
      city: viaCepData.localidade,
      state: viaCepData.estado || viaCepData.uf,
      country: "Brasil",
      postalCode: viaCepData.cep,
      latitude: geocodedLocation.latitude,
      longitude: geocodedLocation.longitude,
    };

    appState.lastCep = cep;
    window.localStorage.setItem("weather:lastCep", cep);

    await fetchAndRenderWeather(location, "Busca por CEP");
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Não foi possível buscar esse CEP.", true);
  }
}

async function loadWeatherForCurrentLocation(showPreciseMessage) {
  appState.isPreciseLocationActive = showPreciseMessage;

  try {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocalização indisponível no navegador.");
    }

    updateLocationButton(true, "Localizando...");
    setLoading("Buscando sua localização atual...");

    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const reverseLocation = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
    );

    const location = {
      city:
        reverseLocation.city ||
        reverseLocation.locality ||
        DEFAULT_LOCATION.city,
      state: reverseLocation.principalSubdivision || DEFAULT_LOCATION.state,
      country: reverseLocation.countryName || DEFAULT_LOCATION.country,
      postalCode: reverseLocation.postcode || "",
      latitude,
      longitude,
    };

    await fetchAndRenderWeather(
      location,
      showPreciseMessage ? "Minha localização" : "Localização atual",
    );
  } catch (error) {
    console.warn("Falha ao obter geolocalização precisa:", error);
    await loadWeatherFromApproximateLocation(showPreciseMessage);
  } finally {
    updateLocationButton(false, "Minha localização");
  }
}

async function loadWeatherFromApproximateLocation(triggeredByUser = false) {
  try {
    setLoading(
      triggeredByUser
        ? "Sua localização precisa não respondeu. Usando região aproximada..."
        : "Usando sua região aproximada...",
    );

    const approximateLocation = await fetchJson(
      "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt",
    );

    let geocodedLocation = null;

    try {
      geocodedLocation = await geocodeLocation({
        city:
          approximateLocation.city ||
          approximateLocation.locality ||
          DEFAULT_LOCATION.city,
        state:
          approximateLocation.principalSubdivision || DEFAULT_LOCATION.state,
        countryCode: approximateLocation.countryCode || "BR",
      });
    } catch (error) {
      console.warn("Geocodificação aproximada indisponível:", error);
    }

    const location = {
      city:
        approximateLocation.city ||
        approximateLocation.locality ||
        geocodedLocation?.name ||
        DEFAULT_LOCATION.city,
      state:
        approximateLocation.principalSubdivision ||
        geocodedLocation?.admin1 ||
        DEFAULT_LOCATION.state,
      country:
        approximateLocation.countryName ||
        geocodedLocation?.country ||
        DEFAULT_LOCATION.country,
      postalCode: approximateLocation.postcode || "",
      latitude: geocodedLocation?.latitude || DEFAULT_LOCATION.latitude,
      longitude: geocodedLocation?.longitude || DEFAULT_LOCATION.longitude,
    };

    await fetchAndRenderWeather(location, "Localização aproximada");
    showStatus(
      triggeredByUser
        ? "Localização precisa indisponível. Previsão carregada pela sua região aproximada."
        : "Previsão carregada com localização aproximada.",
    );
  } catch (error) {
    console.warn("Falha na localização aproximada:", error);
    await fetchAndRenderWeather(DEFAULT_LOCATION, DEFAULT_LOCATION.source);
    showStatus(
      triggeredByUser
        ? "Não foi possível usar sua localização. Exibindo a localização padrão."
        : "Usando a localização padrão do widget.",
    );
  }
}

async function fetchAndRenderWeather(location, sourceLabel) {
  setLoading("Atualizando previsão do tempo...");

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", location.latitude);
  weatherUrl.searchParams.set("longitude", location.longitude);
  weatherUrl.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "surface_pressure",
      "wind_speed_10m",
      "weather_code",
      "is_day",
    ].join(","),
  );
  weatherUrl.searchParams.set(
    "hourly",
    ["temperature_2m", "weather_code"].join(","),
  );
  weatherUrl.searchParams.set("timezone", "auto");
  weatherUrl.searchParams.set("forecast_hours", "18");

  const weatherData = await fetchJson(weatherUrl.toString());

  appState.currentLocation = location;
  appState.currentSource = sourceLabel;

  renderWeather(weatherData, location, sourceLabel);
  showStatus(`Previsão carregada para ${location.city}.`);
}

function renderWeather(weatherData, location, sourceLabel) {
  const current = weatherData.current;
  const iconMeta = getWeatherVisual(
    current.weather_code,
    Boolean(current.is_day),
  );
  const formattedLocation = [location.city, location.state]
    .filter(Boolean)
    .join(", ");

  elements.locationName.textContent = formattedLocation || location.city;
  elements.locationDate.textContent = formatFullDate(
    current.time,
    weatherData.timezone,
  );
  elements.currentTemperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  elements.currentCondition.textContent = iconMeta.label;
  elements.humidityValue.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.pressureValue.textContent = `${Math.round(current.surface_pressure)} hPa`;
  elements.feelsLikeValue.textContent = `${Math.round(current.apparent_temperature)}°C`;
  elements.summaryTitle.textContent = `Vento ${Math.round(current.wind_speed_10m)} km/h`;
  elements.summaryRegion.textContent = [location.state, location.country]
    .filter(Boolean)
    .join(", ");

  const updatedParts = [
    `Atualizado ${formatShortDateTime(current.time, weatherData.timezone)}`,
  ];
  if (location.postalCode) {
    updatedParts.push(`CEP ${location.postalCode}`);
  }
  updatedParts.push(sourceLabel);
  elements.updatedAt.textContent = updatedParts.join(" • ");

  elements.weatherIllustration.style.backgroundImage = `url('${iconMeta.icon}')`;
  elements.summaryIcon.src = iconMeta.icon;
  elements.summaryIcon.alt = iconMeta.label;
  elements.summaryIcon.dataset.kind = iconMeta.kind;
  elements.panel.dataset.period = current.is_day ? "day" : "night";
  elements.panel.dataset.weatherKind = iconMeta.kind;

  renderForecast(weatherData.hourly, current.time, Boolean(current.is_day));
}

function renderForecast(hourly, currentTime, isDay) {
  appState.forecastItems = selectForecastItems(hourly, currentTime, 8);
  appState.forecastPage = 0;
  const visibleItems = getVisibleForecastItems();

  elements.forecastList.innerHTML = visibleItems
    .map((item) => {
      const iconMeta = getWeatherVisual(item.weatherCode, item.isDay ?? isDay);

      return `
        <article class="weather-forecast-item weather-forecast-item--${iconMeta.kind}">
					<b>${formatHour(item.time)}</b>
          <img class="weather-forecast-icon" data-kind="${iconMeta.kind}" src="${iconMeta.icon}" alt="${iconMeta.label}" width="60" />
					<span>${Math.round(item.temperature)}°C</span>
				</article>
			`;
    })
    .join("");

  updateForecastButtons();
}

function selectForecastItems(hourly, currentTime, count) {
  const items = hourly.time.map((time, index) => ({
    time,
    temperature: hourly.temperature_2m[index],
    weatherCode: hourly.weather_code[index],
    isDay: extractHour(time) >= 6 && extractHour(time) < 18,
  }));

  const startIndex = items.findIndex(
    (item) => item.time >= currentTime.slice(0, 13) + ":00",
  );
  const normalizedStart = startIndex >= 0 ? startIndex : 0;

  return items.slice(normalizedStart, normalizedStart + count);
}

function getVisibleForecastItems() {
  const pageSize = getForecastPageSize();
  const start = appState.forecastPage * pageSize;
  return appState.forecastItems.slice(start, start + pageSize);
}

function changeForecastPage(direction) {
  const maxPage = getForecastMaxPage();
  const nextPage = Math.min(
    maxPage,
    Math.max(0, appState.forecastPage + direction),
  );

  if (nextPage === appState.forecastPage) {
    return;
  }

  appState.forecastPage = nextPage;
  const fallbackIsDay = elements.panel.dataset.period !== "night";
  elements.forecastList.classList.add("is-sliding");
  renderForecastItems(getVisibleForecastItems(), fallbackIsDay);
  window.setTimeout(() => {
    elements.forecastList.classList.remove("is-sliding");
  }, 220);
}

function renderForecastItems(items, fallbackIsDay) {
  elements.forecastList.innerHTML = items
    .map((item) => {
      const iconMeta = getWeatherVisual(
        item.weatherCode,
        item.isDay ?? fallbackIsDay,
      );

      return `
        <article class="weather-forecast-item weather-forecast-item--${iconMeta.kind}">
					<b>${formatHour(item.time)}</b>
          <img class="weather-forecast-icon" data-kind="${iconMeta.kind}" src="${iconMeta.icon}" alt="${iconMeta.label}" width="60" />
					<span>${Math.round(item.temperature)}°C</span>
				</article>
			`;
    })
    .join("");

  updateForecastButtons();
}

function getForecastPageSize() {
  return window.innerWidth <= 520 ? 3 : 4;
}

function getForecastMaxPage() {
  const pageSize = getForecastPageSize();
  return Math.max(0, Math.ceil(appState.forecastItems.length / pageSize) - 1);
}

function updateForecastButtons() {
  const maxPage = getForecastMaxPage();
  elements.forecastPrevButton.disabled = appState.forecastPage <= 0;
  elements.forecastNextButton.disabled = appState.forecastPage >= maxPage;
}

function handleViewportResize() {
  if (!appState.forecastItems.length) {
    return;
  }

  const maxPage = getForecastMaxPage();
  appState.forecastPage = Math.min(appState.forecastPage, maxPage);
  renderForecastItems(
    getVisibleForecastItems(),
    elements.panel.dataset.period !== "night",
  );
}

async function geocodeLocation({ city, state, countryCode, postalCode }) {
  const attempts = [
    [city, state].filter(Boolean).join(", "),
    city,
    postalCode,
  ].filter(Boolean);

  for (const name of attempts) {
    const params = new URLSearchParams({
      name,
      count: "10",
      language: "pt",
      format: "json",
    });

    if (countryCode) {
      params.set("countryCode", countryCode);
    }

    const response = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    );

    if (!response.results?.length) {
      continue;
    }

    const exactMatch = response.results.find((result) => {
      const normalizedName = normalizeText(result.name);
      const normalizedCity = normalizeText(city);
      const normalizedState = normalizeText(state || "");

      return (
        normalizedName === normalizedCity &&
        (!normalizedState ||
          normalizeText(result.admin1 || "") === normalizedState)
      );
    });

    return exactMatch || response.results[0];
  }

  throw new Error("Não foi possível localizar essa cidade no mapa.");
}

function getWeatherVisual(code, isDay) {
  if (code === 0) {
    return {
      icon: isDay ? ICONS.sunny : ICONS.night,
      label: isDay ? "Céu limpo" : "Noite de céu limpo",
      kind: isDay ? "sunny" : "night",
    };
  }

  if ([1, 2, 3, 45, 48].includes(code)) {
    return {
      icon: isDay ? ICONS.cloudyDay : ICONS.cloudyNight,
      label: code === 3 ? "Nublado" : "Parcialmente nublado",
      kind: isDay ? "cloudy" : "night-cloudy",
    };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      icon: ICONS.rainy,
      label: "Chuva",
      kind: "rain",
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      icon: ICONS.snow,
      label: "Neve",
      kind: "snow",
    };
  }

  if ([95].includes(code)) {
    return {
      icon: ICONS.thunder,
      label: "Trovoadas",
      kind: "storm",
    };
  }

  if ([96, 99].includes(code)) {
    return {
      icon: ICONS.hail,
      label: "Granizo",
      kind: "storm",
    };
  }

  return {
    icon: ICONS.windy,
    label: "Tempo instável",
    kind: "wind",
  };
}

function setLoading(message) {
  elements.panel.classList.add("is-loading");
  showStatus(message);
}

function showStatus(message, isError = false) {
  elements.panel.classList.remove("is-loading");
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.error = isError ? "true" : "false";
}

function formatCepInput(event) {
  const digits = onlyDigits(event.target.value).slice(0, 8);
  event.target.value = formatCep(digits);
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatFullDate(dateString, timezone) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(dateString));
}

function formatShortDateTime(dateString, timezone) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(dateString));
}

function formatHour(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });
}

function updateLocationButton(isLoading, label) {
  elements.useLocationButton.disabled = isLoading;
  elements.useLocationButton.innerHTML = isLoading
    ? '<i class="bi bi-arrow-repeat rotating"></i>' + label
    : '<i class="bi bi-crosshair"></i>' + label;
}

function extractHour(dateString) {
  return Number(dateString.slice(11, 13));
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Não foi possível concluir a consulta de previsão.");
  }

  return response.json();
}
