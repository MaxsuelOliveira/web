import AppController from "./controller/appController.js";
import { StorageService } from "./service/storage.js";

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
  const app = new AppController();
  await app.initialize();

  // Expor globalmente para acesso via HTML (se necessário)
  window.appInstance = app;

  // Funções globais para HTML
  window.novoUsuario = () => {
    StorageService.clearUser();
    location.reload();
  };

  window.converterDeHoras = () =>
    app.conversionCtrl.convertFromHoras(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeMinutos = () =>
    app.conversionCtrl.convertFromMinutos(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeSegundos = () =>
    app.conversionCtrl.convertFromSegundos(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeDias = () =>
    app.conversionCtrl.convertFromDias(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeSemanas = () =>
    app.conversionCtrl.convertFromSemanas(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeMeses = () =>
    app.conversionCtrl.convertFromMeses(
      app.languageCtrl,
      app.notificationService,
    );

  window.converterDeAnos = () =>
    app.conversionCtrl.convertFromAnos(
      app.languageCtrl,
      app.notificationService,
    );

  window.toggleTheme = () => app.themeCtrl.toggleTheme();

  window.changeLanguage = (lang) => app.languageCtrl.changeLanguage(lang);
});

export default AppController;
