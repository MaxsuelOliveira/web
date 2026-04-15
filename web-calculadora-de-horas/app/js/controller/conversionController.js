export class ConversionController {
  constructor() {
    this.horasInput = document.getElementById("horasResult");
    this.minutosInput = document.getElementById("minutosResult");
    this.segundosInput = document.getElementById("segundosResult");
    this.diasInput = document.getElementById("diasResult");
    this.semanasInput = document.getElementById("semanasResult");
    this.mesesInput = document.getElementById("mesesResult");
    this.anosInput = document.getElementById("anosResult");
    this.salvarBtn = document.getElementById("salvarBtn");

    this.currentConversion = null;
    this.userId = null;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  updateAllFields(segundosBase) {
    if (segundosBase < 0) segundosBase = 0;

    const horas = Math.floor(segundosBase / 3600);
    const minutos = Math.floor(segundosBase / 60);
    const dias = Math.floor(segundosBase / (24 * 60 * 60));
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    const anos = Math.floor(dias / 365);

    this.horasInput.value = horas;
    this.minutosInput.value = minutos;
    this.segundosInput.value = segundosBase;
    this.diasInput.value = dias;
    this.semanasInput.value = semanas;
    this.mesesInput.value = meses;
    this.anosInput.value = anos;

    this.currentConversion = {
      days: dias,
      horas,
      minutos,
      segundos: segundosBase,
      semanas,
      meses,
      anos,
    };

    this.salvarBtn.style.display = segundosBase > 0 ? "block" : "none";
  }

  convertFromHoras(languageCtrl, notificationCtrl) {
    const horas = parseInt(this.horasInput.value) || 0;
    if (horas < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.horas") + " inválido",
        "warning",
      );
      this.horasInput.value = 0;
      return;
    }

    this.updateAllFields(horas * 3600);
  }

  convertFromMinutos(languageCtrl, notificationCtrl) {
    const minutos = parseInt(this.minutosInput.value) || 0;
    if (minutos < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.minutos") + " inválido",
        "warning",
      );
      this.minutosInput.value = 0;
      return;
    }

    this.updateAllFields(minutos * 60);
  }

  convertFromSegundos(languageCtrl, notificationCtrl) {
    const segundos = parseInt(this.segundosInput.value) || 0;
    if (segundos < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.segundos") + " inválido",
        "warning",
      );
      this.segundosInput.value = 0;
      return;
    }

    this.updateAllFields(segundos);
  }

  convertFromSemanas(languageCtrl, notificationCtrl) {
    const semanas = parseInt(this.semanasInput.value) || 0;
    if (semanas < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.semanas") + " inválido",
        "warning",
      );
      this.semanasInput.value = 0;
      return;
    }

    this.updateAllFields(semanas * 7 * 24 * 60 * 60);
  }

  convertFromMeses(languageCtrl, notificationCtrl) {
    const meses = parseInt(this.mesesInput.value) || 0;
    if (meses < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.meses") + " inválido",
        "warning",
      );
      this.mesesInput.value = 0;
      return;
    }

    this.updateAllFields(meses * 30 * 24 * 60 * 60);
  }

  convertFromAnos(languageCtrl, notificationCtrl) {
    const anos = parseInt(this.anosInput.value) || 0;
    if (anos < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.anos") + " inválido",
        "warning",
      );
      this.anosInput.value = 0;
      return;
    }

    this.updateAllFields(anos * 365 * 24 * 60 * 60);
  }

  convertFromDias(languageCtrl, notificationCtrl) {
    const dias = parseInt(this.diasInput.value) || 0;
    if (dias < 0) {
      notificationCtrl.show(
        languageCtrl.getTranslation("main.dias") + " inválido",
        "warning",
      );
      this.diasInput.value = 0;
      return;
    }

    this.updateAllFields(dias * 24 * 60 * 60);
  }

  getCurrentConversion() {
    return this.currentConversion;
  }

  clearResults() {
    this.horasInput.value = "0";
    this.minutosInput.value = "0";
    this.segundosInput.value = "0";
    this.diasInput.value = "0";
    this.semanasInput.value = "0";
    this.mesesInput.value = "0";
    this.anosInput.value = "0";
    this.currentConversion = null;
    this.salvarBtn.style.display = "none";
  }
}

export default ConversionController;
