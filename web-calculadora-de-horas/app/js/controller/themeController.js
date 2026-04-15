import { StorageService } from "../service/storage.js";

export class ThemeController {
  constructor() {
    this.theme = StorageService.getTheme();
  }

  initialize() {
    // Aguardar a próxima frame para garantir que o DOM está pronto
    setTimeout(() => {
      this.applyTheme(this.theme);
      this.themeToggle = document.getElementById("themeToggle");
      if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => this.toggleTheme());
      }
    }, 0);
  }

  applyTheme(theme) {
    const body = document.body;

    if (theme === "dark") {
      body.classList.add("dark-theme");
      const toggle = document.getElementById("themeToggle");
      if (toggle) toggle.textContent = "☀️";
    } else {
      body.classList.remove("dark-theme");
      const toggle = document.getElementById("themeToggle");
      if (toggle) toggle.textContent = "🌙";
    }

    this.theme = theme;
    StorageService.setTheme(theme);
  }

  toggleTheme() {
    const newTheme = this.theme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
  }

  getTheme() {
    return this.theme;
  }
}

export default ThemeController;
