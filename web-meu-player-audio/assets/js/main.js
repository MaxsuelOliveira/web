import { createPlayerApp } from "./app.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  });
}

createPlayerApp().catch((error) => {
  console.error("Falha ao iniciar o player:", error);
});
