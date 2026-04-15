const API_URL = "http://127.0.0.1:8765/api/system";
const REFRESH_INTERVAL = 4000;
const HISTORY_LIMIT = 30;

const fieldElements = new Map(
  Array.from(document.querySelectorAll("[data-field]"), (element) => [
    element.dataset.field,
    element,
  ]),
);

const historyState = {
  cpu: [],
  memory: [],
  network: [],
};

const chartConfigs = {
  cpu: {
    canvas: document.getElementById("cpu-history-chart"),
    color: "#79f6d4",
    fill: "rgba(121, 246, 212, 0.12)",
    maxValue: 100,
  },
  memory: {
    canvas: document.getElementById("memory-history-chart"),
    color: "#9c89ff",
    fill: "rgba(156, 137, 255, 0.12)",
    maxValue: 100,
  },
  network: {
    canvas: document.getElementById("network-history-chart"),
    color: "#76a2ff",
    fill: "rgba(118, 162, 255, 0.12)",
    maxValue: null,
  },
};

const apiStatusText = document.getElementById("api-status-text");
const apiStatusDot = document.getElementById("api-status-dot");
const coreGrid = document.getElementById("core-grid");
const processList = document.getElementById("process-list");
const healthList = document.getElementById("health-list");
const summaryText = document.getElementById("summary-text");
const summaryRingValue = document.getElementById("summary-ring-value");
const healthScore = document.getElementById("health-score");
const clockTime = document.getElementById("clock-time");
const clockDate = document.getElementById("clock-date");
const hostName = document.getElementById("host-name");
const automationList = document.getElementById("automation-list");
const googleAuthLink = document.getElementById("google-auth-link");

function setField(name, value) {
  const element = fieldElements.get(name);
  if (element) {
    element.textContent = value;
  }
}

function formatPercent(value) {
  return `${Math.round(value ?? 0)}%`;
}

function formatBytes(value) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatSpeed(bytesPerSecond) {
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) {
    return "--";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }
  if (hours || days) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}min`);

  return parts.join(" ");
}

function formatTemperature(value) {
  if (value == null) {
    return "Temperatura indisponivel";
  }

  return `${value.toFixed(1)} graus`;
}

function formatBattery(battery) {
  if (!battery || battery.percent == null) {
    return "Sem leitura";
  }

  const state = battery.power_plugged ? "carregando" : "na bateria";
  return `${Math.round(battery.percent)}% ${state}`;
}

function pushHistory(key, value) {
  const series = historyState[key];
  series.push(value);
  if (series.length > HISTORY_LIMIT) {
    series.shift();
  }
}

function drawSparkline(canvas, values, color, fill, maxValue) {
  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(10, Math.floor(rect.width || 220));
  const height = Math.max(10, Math.floor(rect.height || 70));
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 1);
  ctx.lineTo(width, height - 1);
  ctx.stroke();

  if (!values.length) {
    return;
  }

  const peak = maxValue ?? Math.max(...values, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = index * stepX;
    const y = height - (Math.min(value, peak) / peak) * (height - 6) - 3;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.lineTo(width, height - 2);
  ctx.lineTo(0, height - 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = index * stepX;
    const y = height - (Math.min(value, peak) / peak) * (height - 6) - 3;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderCharts() {
  drawSparkline(
    chartConfigs.cpu.canvas,
    historyState.cpu,
    chartConfigs.cpu.color,
    chartConfigs.cpu.fill,
    chartConfigs.cpu.maxValue,
  );
  drawSparkline(
    chartConfigs.memory.canvas,
    historyState.memory,
    chartConfigs.memory.color,
    chartConfigs.memory.fill,
    chartConfigs.memory.maxValue,
  );
  drawSparkline(
    chartConfigs.network.canvas,
    historyState.network,
    chartConfigs.network.color,
    chartConfigs.network.fill,
    chartConfigs.network.maxValue,
  );
}

function buildHealthItems(items) {
  return items
    .map((item) => {
      const icon =
        item.status === "ok" ? "bi-shield-check" : "bi-exclamation-triangle";
      return `
        <li class="health-item">
          <i class="bi ${icon}"></i>
          <div>
            <strong>${item.title}</strong>
            <span>${item.description}</span>
          </div>
        </li>
      `;
    })
    .join("");
}

function buildCoreItems(cpuPerCore) {
  return cpuPerCore
    .map(
      (usage, index) => `
        <div class="core-item">
          <div class="core-item__label">
            <span>N${index + 1}</span>
            <strong>${Math.round(usage)}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-bar" style="width: ${Math.min(usage, 100)}%"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function buildProcessItems(processes) {
  return processes
    .map(
      (process) => `
        <div class="process-item">
          <div>
            <div class="process-item__name">${process.name}</div>
            <div class="process-item__meta">PID ${process.pid}</div>
          </div>
          <div class="text-end">
            <div class="process-item__name">${Math.round(process.cpu_percent)}% CPU</div>
            <div class="process-item__meta">${formatBytes(process.memory_rss)}</div>
          </div>
        </div>
      `,
    )
    .join("");
}

function buildAutomationItems(items) {
  return items
    .map(
      (item) => `
        <div class="automation-item">
          <div>
            <div class="automation-title">${item.title}</div>
            <div class="automation-copy">${item.description}</div>
          </div>
          <span class="automation-tag">${item.status_label}</span>
        </div>
      `,
    )
    .join("");
}

function updateClock() {
  const now = new Date();
  clockTime.textContent = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  clockDate.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
}

function setApiStatus(online, text) {
  apiStatusText.textContent = text;
  apiStatusDot.classList.toggle("online", online);
}

function renderIntegration(google) {
  const title = google.connected
    ? `Google conectado${google.profile_email ? `: ${google.profile_email}` : ""}`
    : google.configured
      ? "Google pronto para login"
      : "Google nao configurado";

  setField("google-status-title", title);
  setField("google-status-description", google.message);
  setField("google-status-badge", google.badge);

  if (google.auth_url) {
    googleAuthLink.href = google.auth_url;
    googleAuthLink.classList.remove("disabled");
  } else {
    googleAuthLink.href = "#";
    googleAuthLink.classList.add("disabled");
  }
}

function renderData(data) {
  const {
    system,
    resources,
    network,
    processes,
    health,
    integrations,
    automations,
  } = data;
  const throughput = network.upload_speed + network.download_speed;

  hostName.textContent = system.hostname;
  setField("cpu-percent", formatPercent(resources.cpu.percent));
  setField("cpu-temp", formatTemperature(resources.cpu.temperature_celsius));
  setField("memory-percent", formatPercent(resources.memory.percent));
  setField(
    "memory-used",
    `${formatBytes(resources.memory.used)} de ${formatBytes(resources.memory.total)}`,
  );
  setField("disk-percent", formatPercent(resources.disk.percent));
  setField(
    "disk-used",
    `${formatBytes(resources.disk.used)} de ${formatBytes(resources.disk.total)}`,
  );
  setField("network-status", network.online ? "Online" : "Offline");
  setField(
    "network-throughput",
    `${formatSpeed(network.upload_speed)} up / ${formatSpeed(network.download_speed)} down`,
  );
  setField("cpu-cores", `${resources.cpu.core_count} nucleos`);
  setField("platform-name", `${system.platform} ${system.release}`);
  setField("platform-version", system.version);
  setField("uptime", formatUptime(system.uptime_seconds));
  setField("local-ip", system.local_ip || "Nao encontrado");
  setField("battery", formatBattery(system.battery));
  setField("user-name", system.user_name);
  setField("upload-speed", formatSpeed(network.upload_speed));
  setField("download-speed", formatSpeed(network.download_speed));
  setField("process-count", `${processes.total} ativos`);
  setField("automation-count", `${automations.items.length} rotinas`);
  setField("chart-cpu-current", formatPercent(resources.cpu.percent));
  setField("chart-memory-current", formatPercent(resources.memory.percent));
  setField("chart-network-current", formatSpeed(throughput));

  pushHistory("cpu", resources.cpu.percent);
  pushHistory("memory", resources.memory.percent);
  pushHistory("network", throughput);
  renderCharts();

  coreGrid.innerHTML = buildCoreItems(resources.cpu.per_core);
  processList.innerHTML = buildProcessItems(processes.top);
  healthList.innerHTML = buildHealthItems(health.items);
  automationList.innerHTML = buildAutomationItems(automations.items);

  healthScore.textContent = `${health.score}%`;
  summaryRingValue.textContent = `${health.score}%`;
  summaryText.textContent = health.summary;

  renderIntegration(integrations.google);
  setApiStatus(true, `Servidor online em ${data.meta.refreshed_at}`);
}

function renderFallback(error) {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  setApiStatus(false, `Servidor offline: ${message}`);
  summaryText.textContent =
    "Inicie o servidor Python local para liberar metricas, historico e integracoes.";
  summaryRingValue.textContent = "--";
  healthScore.textContent = "offline";

  if (!processList.innerHTML.trim()) {
    processList.innerHTML = `
      <div class="process-item">
        <div>
          <div class="process-item__name">Servidor desconectado</div>
          <div class="process-item__meta">Rode o app em server/app.py</div>
        </div>
      </div>
    `;
  }

  if (!automationList.innerHTML.trim()) {
    automationList.innerHTML = `
      <div class="automation-item">
        <div>
          <div class="automation-title">Automacoes indisponiveis</div>
          <div class="automation-copy">O backend precisa estar online para montar as rotinas locais.</div>
        </div>
        <span class="automation-tag">offline</span>
      </div>
    `;
  }
}

async function fetchMetrics() {
  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderData(data);
  } catch (error) {
    renderFallback(error);
  }
}

window.addEventListener("resize", renderCharts);

updateClock();
setInterval(updateClock, 1000);
fetchMetrics();
setInterval(fetchMetrics, REFRESH_INTERVAL);
