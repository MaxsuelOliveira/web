(() => {
  const App = (window.PlantApp = window.PlantApp || {});

  App.keys = {
    users: "gestor-plantas::users",
    session: "gestor-plantas::session",
    legacyPlants: "gestor-plantas::dados",
    plantsPrefix: "gestor-plantas::plants::",
    notifiedPrefix: "gestor-plantas::notified::",
  };

  const DAY_IN_MS = 1000 * 60 * 60 * 24;

  function createId() {
    return crypto.randomUUID();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function shiftDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function diffDays(fromDate, toDate) {
    return Math.ceil(
      (new Date(`${toDate}T00:00:00`).getTime() -
        new Date(`${fromDate}T00:00:00`).getTime()) /
        DAY_IN_MS,
    );
  }

  function daysUntilDue(lastDate, frequency) {
    const dueDate = new Date(
      `${addDays(lastDate, Number(frequency))}T00:00:00`,
    );
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate.getTime() - startOfToday.getTime()) / DAY_IN_MS);
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateString}T00:00:00`));
  }

  function formatBytes(value) {
    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${Math.round(value / 1024)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeLegacyCopy(value) {
    return normalizeText(value)
      .replaceAll("Lirio", "Lírio")
      .replaceAll("Escritorio", "Escritório")
      .replaceAll("umido", "úmido")
      .replaceAll("caidas", "caídas")
      .replaceAll("ventilacao", "ventilação");
  }

  function buildInitials(name) {
    return String(name || "Planta")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function getPlantEmoji(plant) {
    const species = `${plant.name} ${plant.species}`.toLowerCase();

    if (species.includes("orqu") || species.includes("rosa")) {
      return "🌸";
    }

    if (
      species.includes("alecrim") ||
      species.includes("manjer") ||
      species.includes("erva")
    ) {
      return "🌿";
    }

    if (species.includes("samambaia") || species.includes("jiboia")) {
      return "🪴";
    }

    if (species.includes("cacto") || species.includes("suculent")) {
      return "🌵";
    }

    if (plant.sunlight === "Sol pleno") {
      return "🌻";
    }

    if (plant.sunlight === "Meia-sombra") {
      return "🍀";
    }

    return "🌱";
  }

  function createSeededPlants() {
    return [
      {
        id: createId(),
        name: "Jiboia da sala",
        species: "Epipremnum aureum",
        environment: "Sala",
        sunlight: "Meia-sombra",
        wateringFrequency: 4,
        sunlightFrequency: 2,
        acquiredDate: shiftDate(-48),
        lastWateredAt: shiftDate(-5),
        lastSunbathAt: shiftDate(-1),
        lifeExpectancyMonths: 48,
        photoDataUrl: "",
        notes: "Gosta de solo levemente umido e luz indireta forte.",
      },
      {
        id: createId(),
        name: "Alecrim da varanda",
        species: "Salvia rosmarinus",
        environment: "Varanda",
        sunlight: "Sol pleno",
        wateringFrequency: 3,
        sunlightFrequency: 1,
        acquiredDate: shiftDate(-120),
        lastWateredAt: shiftDate(-2),
        lastSunbathAt: shiftDate(0),
        lifeExpectancyMonths: 30,
        photoDataUrl: "",
        notes: "Precisa de vaso drenado e bastante ventilacao.",
      },
      {
        id: createId(),
        name: "Lirio da paz",
        species: "Spathiphyllum wallisii",
        environment: "Escritorio",
        sunlight: "Sombra clara",
        wateringFrequency: 2,
        sunlightFrequency: 3,
        acquiredDate: shiftDate(-210),
        lastWateredAt: shiftDate(-1),
        lastSunbathAt: shiftDate(-4),
        lifeExpectancyMonths: 60,
        photoDataUrl: "",
        notes: "Folhas caidas indicam sede. Evitar sol direto forte.",
      },
    ];
  }

  function loadJson(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPlantsKey(userId) {
    return `${App.keys.plantsPrefix}${userId}`;
  }

  function getNotifiedKey(userId) {
    return `${App.keys.notifiedPrefix}${userId}`;
  }

  function loadLegacyPlants() {
    const legacy = loadJson(App.keys.legacyPlants, []);
    return Array.isArray(legacy) ? legacy : [];
  }

  function ensurePlantShape(plant) {
    return {
      id: plant.id || createId(),
      name: normalizeLegacyCopy(plant.name),
      species: normalizeLegacyCopy(plant.species),
      environment: normalizeLegacyCopy(plant.environment),
      sunlight: normalizeText(plant.sunlight) || "Meia-sombra",
      wateringFrequency: Number(plant.wateringFrequency || 3),
      sunlightFrequency: Number(plant.sunlightFrequency || 2),
      acquiredDate: plant.acquiredDate || today(),
      lastWateredAt: plant.lastWateredAt || today(),
      lastSunbathAt: plant.lastSunbathAt || today(),
      lifeExpectancyMonths: Number(plant.lifeExpectancyMonths || 24),
      photoDataUrl: plant.photoDataUrl || "",
      notes: normalizeLegacyCopy(plant.notes),
      deadAt: plant.deadAt || "",
      deathReason: normalizeLegacyCopy(plant.deathReason),
    };
  }

  function loadPlants(userId) {
    const key = getPlantsKey(userId);
    const stored = loadJson(key, null);

    if (Array.isArray(stored)) {
      return stored.map(ensurePlantShape);
    }

    const legacyPlants = loadLegacyPlants();
    const seeded = legacyPlants.length
      ? legacyPlants.map(ensurePlantShape)
      : createSeededPlants();
    saveJson(key, seeded);
    return seeded;
  }

  function savePlants(userId, plants) {
    saveJson(getPlantsKey(userId), plants.map(ensurePlantShape));
  }

  function clearPlants(userId) {
    saveJson(getPlantsKey(userId), []);
  }

  function loadNotifiedMap(userId) {
    const map = loadJson(getNotifiedKey(userId), {});
    return map && typeof map === "object" ? map : {};
  }

  function saveNotifiedMap(userId, map) {
    saveJson(getNotifiedKey(userId), map);
  }

  App.utils = {
    DAY_IN_MS,
    addDays,
    buildInitials,
    createId,
    daysUntilDue,
    diffDays,
    escapeHtml,
    formatBytes,
    formatDate,
    getPlantEmoji,
    normalizeText,
    shiftDate,
    today,
  };

  App.store = {
    clearPlants,
    createSeededPlants,
    ensurePlantShape,
    loadJson,
    loadNotifiedMap,
    loadPlants,
    saveJson,
    saveNotifiedMap,
    savePlants,
  };
})();
