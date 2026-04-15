export class StorageService {
  static getUser() {
    return {
      userId: localStorage.getItem("userId"),
      userName: localStorage.getItem("userName"),
    };
  }

  static setUser(userId, userName) {
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
  }

  static clearUser() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
  }

  static getTheme() {
    return localStorage.getItem("theme") || "light";
  }

  static setTheme(theme) {
    localStorage.setItem("theme", theme);
  }

  static getLanguage() {
    return localStorage.getItem("language") || "pt";
  }

  static setLanguage(language) {
    localStorage.setItem("language", language);
  }
}

export default StorageService;
