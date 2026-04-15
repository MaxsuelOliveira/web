(() => {
  const App = window.PlantApp;
  App.components = App.components || {};

  function render(context) {
    const { filteredPlants, stats, state } = context;

    return `
      <section class="view-grid home-grid">
        <article class="panel-card stats-strip compact-stats">
          ${renderStatCard("🪴", "Plantas", stats.total)}
          ${renderStatCard("🚨", "Atenção", stats.needAttention)}
          ${renderStatCard("💧", "Rega hoje", stats.wateringDue)}
        </article>

        <article class="panel-card">
          <div class="panel-head">
            <div>
              <h2>Minha coleção</h2>
              <p>Somente as suas plantas, com foco no que importa.</p>
            </div>
            <button class="soft-button" type="button" data-action="new-plant">🪴 Adicionar</button>
          </div>

          <div class="toolbar">
            <label class="search-box" aria-label="Buscar plantas">
              <span class="sr-only">Buscar plantas</span>
              <input id="search-input" type="search" placeholder="Buscar por nome, espécie ou ambiente" value="${App.utils.escapeHtml(state.search)}" />
            </label>

            <div class="filter-strip" aria-label="Filtrar por status">
              <button class="filter-nav" type="button" data-action="scroll-filters" data-target="status-filters" data-direction="-1">‹</button>
              <div class="filter-row filter-scroll" id="status-filters" role="group" aria-label="Filtrar status">
                ${renderStatusFilters(state.filter)}
              </div>
              <button class="filter-nav" type="button" data-action="scroll-filters" data-target="status-filters" data-direction="1">›</button>
            </div>
          </div>

          <div class="filter-strip" aria-label="Filtrar por exposição solar">
            <button class="filter-nav" type="button" data-action="scroll-filters" data-target="sunlight-filters" data-direction="-1">‹</button>
            <div class="chip-row filter-scroll" id="sunlight-filters" role="group" aria-label="Filtrar por exposição solar">
              ${renderSunlightFilters(state.sunlightFilter)}
            </div>
            <button class="filter-nav" type="button" data-action="scroll-filters" data-target="sunlight-filters" data-direction="1">›</button>
          </div>

          <div class="plant-grid">
            ${renderPlantGrid(filteredPlants)}
          </div>
        </article>
      </section>
    `;
  }

  function renderStatCard(icon, label, value) {
    return `
      <div class="mini-stat">
        <span>${icon} ${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  function renderStatusFilters(activeFilter) {
    const filters = [
      { key: "all", label: "Todas" },
      { key: "attention", label: "Precisando de cuidado" },
      { key: "healthy", label: "Saudáveis" },
    ];

    return filters
      .map(
        (item) => `
          <button
            class="filter-button ${activeFilter === item.key ? "is-active" : ""}"
            type="button"
            data-action="filter-status"
            data-filter="${item.key}"
          >
            ${item.label}
          </button>
        `,
      )
      .join("");
  }

  function renderSunlightFilters(activeFilter) {
    const filters = [
      { key: "all", label: "Todas as exposições" },
      { key: "Sombra clara", label: "Sombra clara" },
      { key: "Meia-sombra", label: "Meia-sombra" },
      { key: "Sol pleno", label: "Sol pleno" },
    ];

    return filters
      .map(
        (item) => `
          <button
            class="chip-button ${activeFilter === item.key ? "is-active" : ""}"
            type="button"
            data-action="filter-sunlight"
            data-sunlight="${item.key}"
          >
            ${item.label}
          </button>
        `,
      )
      .join("");
  }

  function renderPlantGrid(plants) {
    if (!plants.length) {
      return `
        <article class="empty-state">
          <strong>Nenhuma planta encontrada</strong>
          <p>Ajuste os filtros ou cadastre uma nova planta para preencher sua coleção.</p>
          <button class="primary-button" type="button" data-action="new-plant">🪴 Cadastrar planta</button>
        </article>
      `;
    }

    return plants.map(renderPlantCard).join("");
  }

  function renderPlantCard(plant) {
    return `
      <article class="plant-card ${plant.statusClass} clickable-card" data-action="open-plant-dialog" data-id="${plant.id}" role="button" tabindex="0" aria-label="Abrir ações de ${App.utils.escapeHtml(plant.name)}">
        <div class="plant-media">
          ${renderPlantMedia(plant)}
          <div class="plant-emoji-badge emoji-xl">${plant.emoji}</div>
        </div>

        <div class="plant-card-body">
          <div class="plant-badge-row">
            <span class="status-chip ${plant.statusClass}">${plant.statusLabel}</span>
            <span class="tag-chip">${App.utils.escapeHtml(plant.sunlight)}</span>
          </div>

          <div class="plant-copy">
            <h3>${App.utils.escapeHtml(plant.name)}</h3>
            <p>${App.utils.escapeHtml(plant.species)} • ${App.utils.escapeHtml(plant.environment)}</p>
          </div>

          <div class="plant-reminders compact">
            <div class="reminder-row">
              <strong><span class="emoji-lg">💧</span> Rega</strong>
              <span>${plant.wateringMessage}</span>
            </div>
            <div class="reminder-row">
              <strong><span class="emoji-lg">☀️</span> Sol</strong>
              <span>${plant.sunlightMessage}</span>
            </div>
          </div>

          <div class="health-block ${plant.healthToneClass}">
            <div class="health-copy">
              <strong>${plant.isDead ? "Vida encerrada" : `Vitalidade ${plant.vitality}%`}</strong>
              <span>${App.utils.escapeHtml(plant.healthMessage)}</span>
            </div>
            <div class="health-meter ${plant.healthToneClass}" aria-label="Vitalidade ${plant.vitality}%">
              <span style="width: ${plant.vitality}%"></span>
            </div>
          </div>

          <div class="card-actions card-hint-row">
            <span class="card-hint">Toque para ver ações e editar</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderPlantDialog(plant, state) {
    if (!plant) {
      return "";
    }

    const isDeleteConfirm = state.dialogMode === "delete-confirm";

    return `
      <dialog class="plant-dialog" open aria-labelledby="plant-dialog-title">
        <div class="plant-dialog-backdrop" data-action="close-plant-dialog"></div>
        <article class="plant-dialog-card" tabindex="-1">
          <button class="dialog-close" type="button" data-action="close-plant-dialog" aria-label="Fechar diálogo">×</button>

          <div class="plant-dialog-header">
            <div class="plant-dialog-emoji emoji-xl">${plant.emoji}</div>
            <div>
              <span class="dialog-eyebrow">Ações da planta</span>
              <h3 id="plant-dialog-title">${App.utils.escapeHtml(plant.name)}</h3>
              <p>${App.utils.escapeHtml(plant.species)} • ${App.utils.escapeHtml(plant.environment)}</p>
            </div>
          </div>

          <div class="dialog-status-row">
            <span class="status-chip ${plant.statusClass}">${plant.statusLabel}</span>
            <span class="tag-chip">${App.utils.escapeHtml(plant.sunlight)}</span>
          </div>

          <div class="dialog-health-card ${plant.healthToneClass}">
            <div class="health-copy">
              <strong>${plant.isDead ? "Planta morta" : `Vitalidade ${plant.vitality}%`}</strong>
              <p>${App.utils.escapeHtml(plant.healthMessage)}</p>
            </div>
            <div class="health-meter ${plant.healthToneClass}" aria-label="Vitalidade ${plant.vitality}%">
              <span style="width: ${plant.vitality}%"></span>
            </div>
          </div>

          ${
            isDeleteConfirm
              ? `
                <div class="dialog-confirm-block danger-surface">
                  <strong>Confirmar exclusão</strong>
                  <p>Essa planta será removida da sua conta local e a ação não poderá ser desfeita.</p>
                  <div class="confirm-grid">
                    <button class="ghost-button" type="button" data-action="cancel-delete-dialog">Cancelar</button>
                    <button class="danger-button" type="button" data-action="confirm-delete-dialog" data-id="${plant.id}">🗑️ Excluir planta</button>
                  </div>
                </div>
              `
              : plant.isDead
                ? `
                <div class="dialog-dead-note">
                  <strong>Sem ações de cuidado disponíveis</strong>
                  <p>Atualize as datas no cadastro se quiser tentar recuperar a planta, ou remova o registro.</p>
                </div>
                <div class="dialog-action-grid">
                  <button class="soft-button" type="button" data-action="edit" data-id="${plant.id}">✏️ Editar cadastro</button>
                  <button class="soft-button" type="button" data-action="new-plant">🪴 Adicionar nova</button>
                  <button class="danger-button dialog-danger-span" type="button" data-action="request-delete-dialog" data-id="${plant.id}">🗑️ Excluir com confirmação</button>
                </div>
              `
                : `
                <div class="dialog-action-grid">
                  <button class="quick-action" type="button" data-action="water" data-id="${plant.id}"><span class="emoji-lg">💧</span><span>Regar agora</span></button>
                  <button class="quick-action" type="button" data-action="sunbath" data-id="${plant.id}"><span class="emoji-lg">☀️</span><span>Levar ao sol</span></button>
                  <button class="soft-button" type="button" data-action="edit" data-id="${plant.id}">✏️ Editar cadastro</button>
                  <button class="soft-button" type="button" data-action="new-plant">🪴 Adicionar nova</button>
                  <button class="danger-button dialog-danger-span" type="button" data-action="request-delete-dialog" data-id="${plant.id}">🗑️ Excluir com confirmação</button>
                </div>
              `
          }
        </article>
      </dialog>
    `;
  }

  function renderPlantMedia(plant) {
    if (plant.photoDataUrl) {
      return `<img class="plant-photo" src="${plant.photoDataUrl}" alt="Foto da planta ${App.utils.escapeHtml(plant.name)}" />`;
    }

    return `
      <div class="plant-photo plant-photo-fallback">
        <span class="emoji-xl">${plant.emoji}</span>
      </div>
    `;
  }

  App.components.home = {
    render,
    renderPlantDialog,
  };
})();
