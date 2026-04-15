export async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register("./sw.js");
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Este navegador não oferece suporte a notificações.");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  return Notification.requestPermission();
}

export async function notifyAlert(registration, alert, currentPrice) {
  const title = `${alert.symbol} atingiu o preço definido`;
  const body = `${alert.assetName} está em US$ ${formatCompactPrice(currentPrice)} e cruzou o alvo de US$ ${formatCompactPrice(alert.targetPrice)}.`;

  if (registration) {
    await registration.showNotification(title, {
      body,
      tag: `price-alert-${alert.id}`,
      data: {
        url: "./",
      },
    });
    return;
  }

  new Notification(title, { body });
}

function formatCompactPrice(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}
