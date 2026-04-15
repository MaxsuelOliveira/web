export class NotificationService {
  constructor() {
    this.notificationEl = document.getElementById("notification");
  }

  show(mensaje, tipo = "info") {
    this.notificationEl.textContent = mensaje;
    this.notificationEl.className = `notification notification-${tipo} show`;

    setTimeout(() => {
      this.notificationEl.classList.remove("show");
    }, 4000);
  }

  success(mensaje) {
    this.show(mensaje, "success");
  }

  error(mensaje) {
    this.show(mensaje, "error");
  }

  warning(mensaje) {
    this.show(mensaje, "warning");
  }

  info(mensaje) {
    this.show(mensaje, "info");
  }
}

export default NotificationService;
