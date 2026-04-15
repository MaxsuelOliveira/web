import ApiService from "../service/api.js";
import { StorageService } from "../service/storage.js";
import CsvExportService from "../view/csvExport.js";
import InteractionService from "../view/interactions.js";
import NotificationService from "../view/notifications.js";
import ConversionController from "./conversionController.js";
import HistoryController from "./historyController.js";
import LanguageController from "./languageController.js";
import ThemeController from "./themeController.js";

export class AppController {
  constructor() {
    this.userInfo = StorageService.getUser();
    this.themeCtrl = new ThemeController();
    this.languageCtrl = new LanguageController();
    this.conversionCtrl = new ConversionController();
    this.historyCtrl = new HistoryController();
    this.notificationService = new NotificationService();
    this.salvarBtn = document.getElementById("salvarBtn");
    this.exportBtn = document.querySelector(".btn-secondary");

    // PERMITIR ENTRADA MESMO SEM USUÁRIO
    if (this.userInfo.userId) {
      this.conversionCtrl.setUserId(this.userInfo.userId);
    }

    // Expor globalmente para deletar conversões via HTML
    window.appInstance = this;
    window.deleteConversion = (conversionId) =>
      this.deleteConversionAndReload(conversionId);
  }

  async initialize() {
    try {
      // Inicializar temas e idioma
      this.themeCtrl.initialize();
      await this.languageCtrl.initialize();

      // Setup da interface
      this.setupUI();

      // Carregar histórico APENAS SE TIVER USUÁRIO
      if (this.userInfo.userId) {
        await this.historyCtrl.loadConversions(this.userInfo.userId);
      }

      // Setup interações
      this.setupInteractions();
    } catch (erro) {
      console.error("Erro na inicialização:", erro);
    }
  }

  setupUI() {
    // Mostrar informações do usuário
    InteractionService.setupUserInfo(
      this.userInfo.userName,
      this.userInfo.userId,
    );
  }

  setupInteractions() {
    // Setup dos cards de resultado
    InteractionService.setupResultCardInteractions(this.conversionCtrl);

    // Setup do botão salvar
    if (this.salvarBtn) {
      this.salvarBtn.addEventListener("click", () => this.saveConversion());
    }

    // Setup dos conversores
    document
      .getElementById("horasResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromHoras(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("minutosResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromMinutos(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("segundosResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromSegundos(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("diasResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromDias(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("semanasResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromSemanas(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("mesesResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromMeses(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    document
      .getElementById("anosResult")
      ?.addEventListener("change", () =>
        this.conversionCtrl.convertFromAnos(
          this.languageCtrl,
          this.notificationService,
        ),
      );

    // Setup do botão sair
    const logoutBtn = document.querySelector(".btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    // Setup do botão exportar
    const csvBtn = document.getElementById("exportBtn");
    if (csvBtn) {
      csvBtn.addEventListener("click", () => this.exportToCSV());
    }
  }

  async saveConversion() {
    const conversion = this.conversionCtrl.getCurrentConversion();

    if (!conversion) {
      this.notificationService.error(
        this.languageCtrl.getTranslation("notifications.error") +
          "dados inválidos",
      );
      return;
    }

    // SE NÃO TEM USUÁRIO, CRIAR UM ANTES DE SALVAR
    if (!this.userInfo.userId) {
      try {
        this.notificationService.info(
          "Criando usuário para salvar conversão...",
        );
        const usuario = await ApiService.createTempUser();
        this.userInfo.userId = usuario.id;
        this.userInfo.userName = usuario.name;
        StorageService.setUser(usuario.id, usuario.name);
        this.conversionCtrl.setUserId(usuario.id);
        InteractionService.setupUserInfo(usuario.name, usuario.id);
        this.notificationService.success("Usuário criado com sucesso!");
      } catch (erro) {
        this.notificationService.error(
          "Erro ao criar usuário: " + erro.message,
        );
        return;
      }
    }

    try {
      this.notificationService.info(
        this.languageCtrl.getTranslation("notifications.saving"),
      );

      const payload = {
        days: conversion.days,
        userId: this.userInfo.userId,
      };

      await ApiService.saveConversion(payload);

      this.notificationService.success(
        this.languageCtrl.getTranslation("notifications.saved"),
      );

      this.conversionCtrl.clearResults();
      await this.historyCtrl.loadConversions(this.userInfo.userId);
    } catch (erro) {
      this.notificationService.error(
        this.languageCtrl.getTranslation("notifications.error") + erro.message,
      );
    }
  }

  exportToCSV() {
    const conversions = this.historyCtrl.getConversions();

    if (!conversions || conversions.length === 0) {
      this.notificationService.info(
        this.languageCtrl.getTranslation("notifications.noData"),
      );
      return;
    }

    try {
      const csv = CsvExportService.exportHistoryToCSV(
        conversions,
        this.languageCtrl,
      );
      CsvExportService.downloadCSV(csv);

      this.notificationService.success(
        this.languageCtrl.getTranslation("notifications.exported"),
      );
    } catch (erro) {
      this.notificationService.error("Erro ao exportar: " + erro.message);
    }
  }

  logout() {
    StorageService.clearUser();
    this.userInfo = { userId: null, userName: null };
    window.location.href = "index.html";
  }

  async deleteConversionAndReload(conversionId) {
    if (!confirm("Tem certeza que deseja deletar esta conversão?")) {
      return;
    }

    try {
      await ApiService.deleteConversion(conversionId);
      this.notificationService.success(
        this.languageCtrl.getTranslation("notifications.deleted"),
      );
      await this.historyCtrl.loadConversions(this.userInfo.userId);
    } catch (erro) {
      this.notificationService.error(
        this.languageCtrl.getTranslation("notifications.deleteError") +
          erro.message,
      );
    }
  }
}

export default AppController;
