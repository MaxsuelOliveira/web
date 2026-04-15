(() => {
  const App = window.PlantApp;
  App.components = App.components || {};

  function render(context) {
    const { state, editingPlant } = context;
    const draft = getFormDefaults(editingPlant);

    return `
      <section class="view-grid form-grid">
        <article class="panel-card form-panel" id="plant-form-card">
          <div class="panel-head">
            <div>
              <h2 id="form-title">${editingPlant ? `Editando ${App.utils.escapeHtml(editingPlant.name)}` : "Nova planta"}</h2>
              <p>Preencha apenas o essencial para manter sua rotina em dia.</p>
            </div>
            <button class="soft-button" type="button" data-action="reset-form">Limpar</button>
          </div>

          <form class="plant-form" id="plant-form">
            <input type="hidden" id="plant-id" name="plant-id" value="${draft.id}" />

            <div class="photo-uploader">
              <div class="photo-preview" id="photo-preview">
                ${renderPhotoPreviewMarkup(state.photoDraft || draft.photoDataUrl, draft.name)}
              </div>
              <div class="photo-copy">
                <strong>Foto da planta</strong>
                <p>Envie uma imagem do dispositivo. Ela será convertida e salva localmente.</p>
                <label class="upload-button" for="photo-input">Escolher foto</label>
                <input id="photo-input" name="photo-input" type="file" accept="image/*" />
                <button class="ghost-button" type="button" data-action="remove-photo">Remover foto</button>
              </div>
            </div>

            <div class="field-grid">
              <div class="field field-full">
                <label for="name">Nome da planta</label>
                <input id="name" name="name" type="text" placeholder="Ex.: Samambaia da sala" value="${App.utils.escapeHtml(draft.name)}" required />
              </div>

              <div class="field">
                <label for="species">Espécie</label>
                <input id="species" name="species" type="text" placeholder="Ex.: Nephrolepis exaltata" value="${App.utils.escapeHtml(draft.species)}" required />
              </div>

              <div class="field">
                <label for="environment">Ambiente</label>
                <input id="environment" name="environment" type="text" placeholder="Ex.: Sala, varanda, escritorio" value="${App.utils.escapeHtml(draft.environment)}" required />
              </div>

              <div class="field">
                <label for="sunlight">Exposição ideal</label>
                <select id="sunlight" name="sunlight" required>
                  ${renderSunlightOptions(draft.sunlight)}
                </select>
              </div>

              <div class="field">
                <label for="acquiredDate">Data de aquisição</label>
                <input id="acquiredDate" name="acquiredDate" type="date" value="${draft.acquiredDate}" required />
              </div>

              <div class="field">
                <label for="wateringFrequency">Rega a cada quantos dias</label>
                <input id="wateringFrequency" name="wateringFrequency" type="number" min="1" max="30" value="${draft.wateringFrequency}" required />
              </div>

              <div class="field">
                <label for="sunlightFrequency">Levar ao sol a cada quantos dias</label>
                <input id="sunlightFrequency" name="sunlightFrequency" type="number" min="1" max="30" value="${draft.sunlightFrequency}" required />
              </div>

              <div class="field">
                <label for="lifeExpectancyMonths">Expectativa de vida em meses</label>
                <input id="lifeExpectancyMonths" name="lifeExpectancyMonths" type="number" min="1" max="240" value="${draft.lifeExpectancyMonths}" required />
              </div>

              <div class="field">
                <label for="lastWateredAt">Última rega</label>
                <input id="lastWateredAt" name="lastWateredAt" type="date" value="${draft.lastWateredAt}" required />
              </div>

              <div class="field">
                <label for="lastSunbathAt">Última exposição ao sol</label>
                <input id="lastSunbathAt" name="lastSunbathAt" type="date" value="${draft.lastSunbathAt}" required />
              </div>

              <div class="field field-full">
                <label for="notes">Observações</label>
                <textarea id="notes" name="notes" placeholder="Ex.: evitar encharcar, girar o vaso semanalmente, podar folhas secas.">${App.utils.escapeHtml(draft.notes)}</textarea>
              </div>
            </div>

            <div class="form-actions">
              <button class="primary-button" type="submit">${editingPlant ? "💾 Salvar alterações" : "🪴 Salvar"}</button>
              <button class="ghost-button" type="button" data-action="go-view" data-view="home">Voltar</button>
            </div>
          </form>
        </article>
      </section>
    `;
  }

  function getFormDefaults(editingPlant) {
    return {
      id: editingPlant?.id || "",
      name: editingPlant?.name || "",
      species: editingPlant?.species || "",
      environment: editingPlant?.environment || "",
      sunlight: editingPlant?.sunlight || "Meia-sombra",
      acquiredDate: editingPlant?.acquiredDate || App.utils.today(),
      wateringFrequency: editingPlant?.wateringFrequency || 3,
      sunlightFrequency: editingPlant?.sunlightFrequency || 2,
      lifeExpectancyMonths: editingPlant?.lifeExpectancyMonths || 24,
      lastWateredAt: editingPlant?.lastWateredAt || App.utils.today(),
      lastSunbathAt: editingPlant?.lastSunbathAt || App.utils.today(),
      photoDataUrl: editingPlant?.photoDataUrl || "",
      notes: editingPlant?.notes || "",
    };
  }

  function renderSunlightOptions(selectedValue) {
    return ["Sombra clara", "Meia-sombra", "Sol pleno"]
      .map(
        (value) => `
          <option value="${value}" ${selectedValue === value ? "selected" : ""}>
            ${value}
          </option>
        `,
      )
      .join("");
  }

  function renderPhotoPreviewMarkup(photoDataUrl, name) {
    if (photoDataUrl) {
      return `<img class="form-photo" src="${photoDataUrl}" alt="Foto da planta ${App.utils.escapeHtml(name || "selecionada")}" />`;
    }

    return `
      <div class="form-photo form-photo-empty">
        <span class="emoji-xl">${App.utils.getPlantEmoji({ name, species: name, sunlight: "Meia-sombra" })}</span>
        <small>Sem foto</small>
      </div>
    `;
  }

  App.components.form = {
    render,
    renderPhotoPreviewMarkup,
  };
})();
