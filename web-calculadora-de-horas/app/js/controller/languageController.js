import { StorageService } from "../service/storage.js";

export class LanguageController {
  constructor() {
    this.currentLanguage = StorageService.getLanguage();
    this.translations = {};
    this.languageSelector = document.getElementById("languageSelector");
  }

  changeLanguage(lang) {
    this.currentLanguage = lang;
    StorageService.setLanguage(lang);
    this.applyTranslations();
  }

  async initialize() {
    try {
      const response = await fetch("./translations.json");
      this.translations = await response.json();

      if (this.languageSelector) {
        this.languageSelector.value = this.currentLanguage;
        this.languageSelector.addEventListener("change", (e) => {
          this.changeLanguage(e.target.value);
        });
      }

      this.applyTranslations();
    } catch (erro) {
      console.error("Erro ao carregar traduções:", erro);
    }
  }

  getTranslation(key) {
    const keys = key.split(".");
    let value = this.translations[this.currentLanguage];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }

  applyTranslations() {
    document.title = this.getTranslation("main.title");

    const sectionTitle = document.querySelector(".section-title h1");
    if (sectionTitle) {
      sectionTitle.textContent = this.getTranslation("main.title");
    }

    const sectionSubtitle = document.querySelector(".section-title p");
    if (sectionSubtitle) {
      sectionSubtitle.textContent = this.getTranslation("main.subtitle");
    }

    this.updateElementText("#horasResult ~ .result-label", "main.horas");
    this.updateElementText("#minutosResult ~ .result-label", "main.minutos");
    this.updateElementText("#segundosResult ~ .result-label", "main.segundos");
    this.updateElementText("#semanasResult ~ .result-label", "main.semanas");
    this.updateElementText("#mesesResult ~ .result-label", "main.meses");
    this.updateElementText("#anosResult ~ .result-label", "main.anos");

    const saveBtn = document.getElementById("salvarBtn");
    if (saveBtn) saveBtn.textContent = this.getTranslation("buttons.save");

    const historyTitle = document.querySelector(".history-section h2");
    if (historyTitle) {
      historyTitle.textContent = this.getTranslation("history.title");
    }
  }

  updateElementText(selector, translationKey) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = this.getTranslation(translationKey);
    }
  }
}

export default LanguageController;
