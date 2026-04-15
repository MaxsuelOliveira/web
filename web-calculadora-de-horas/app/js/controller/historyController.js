import ApiService from "../service/api.js";

export class HistoryController {
  constructor() {
    this.historySection = document.getElementById("historySection");
    this.historyList = document.getElementById("historyList");
    this.conversions = [];
  }

  async loadConversions(userId) {
    try {
      this.conversions = await ApiService.getUserConversions(userId);

      if (this.conversions.length === 0) {
        this.historySection.style.display = "none";
        return;
      }

      this.historySection.style.display = "block";
      this.render();
    } catch (erro) {
      console.error("Erro ao carregar histórico:", erro);
    }
  }

  render() {
    this.historyList.innerHTML = "";

    this.conversions.forEach((conversao) => {
      const card = this.createHistoryCard(conversao);
      this.historyList.appendChild(card);
    });
  }

  createHistoryCard(conversao) {
    const card = document.createElement("div");
    card.className = "history-card";

    const data = new Date(conversao.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    card.innerHTML = `
      <div class="history-card-header">
        <strong>${conversao.days} dias</strong>
        <small>${data}</small>
      </div>
      <div class="history-card-content">
        <div class="history-item">
          <span class="label">Horas:</span>
          <span class="value">${conversao.horas.toLocaleString("pt-BR")}</span>
        </div>
        <div class="history-item">
          <span class="label">Minutos:</span>
          <span class="value">${conversao.minutos.toLocaleString("pt-BR")}</span>
        </div>
        <div class="history-item">
          <span class="label">Segundos:</span>
          <span class="value">${conversao.segundos.toLocaleString("pt-BR")}</span>
        </div>
        <div class="history-item">
          <span class="label">Semanas:</span>
          <span class="value">${conversao.semanas}</span>
        </div>
        <div class="history-item">
          <span class="label">Meses:</span>
          <span class="value">${conversao.meses}</span>
        </div>
        <div class="history-item">
          <span class="label">Anos:</span>
          <span class="value">${conversao.anos}</span>
        </div>
      </div>
      <div class="history-card-actions">
        <button type="button" class="btn btn-small btn-danger" onclick="window.deleteConversion('${conversao.id}'); return false;">
          🗑️ Deletar
        </button>
      </div>
    `;

    return card;
  }

  getConversions() {
    return this.conversions;
  }
}

export default HistoryController;
