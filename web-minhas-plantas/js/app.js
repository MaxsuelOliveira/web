(() => {
  const App = window.PlantApp;

  const state = {
    currentUser: null,
    plants: [],
    currentView: "home",
    editingPlantId: "",
    plantDialogId: "",
    dialogMode: "actions",
    photoDraft: "",
    search: "",
    filter: "all",
    sunlightFilter: "all",
    toast: null,
    toastTimer: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!App.auth.requireAuth()) {
      return;
    }

    syncCurrentUser();
    state.plants = App.store.loadPlants(state.currentUser.id);
    if (syncPlantLifecycle().changed) {
      persistPlants();
    }
    App.gamification.trackLoginReward();
    syncCurrentUser();

    bindEvents();
    renderApp();
    App.monitor.start(
      () => state.plants,
      ({ plants, newDeaths }) => {
        state.plants = plants;
        persistPlants();

        if (newDeaths.length) {
          const firstDeath = newDeaths[0];
          showToast({
            title: `${firstDeath.name} morreu`,
            message: `Causa principal: ${firstDeath.reason}.`,
          });
        }

        renderApp();
      },
    );
    App.notifications.start(getNotificationContext);
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
  }

  function renderApp() {
    const root = document.querySelector("#root");
    const enrichedPlants = state.plants.map(enrichPlant);
    const filteredPlants = applyFilters(enrichedPlants);
    const stats = buildStats(enrichedPlants);
    const tasks = buildTasks(enrichedPlants);
    const gamification = App.gamification.getSummary(state.currentUser);
    const activeTask = tasks[0] || null;
    const editingPlant =
      state.plants.find((plant) => plant.id === state.editingPlantId) || null;
    const selectedPlant =
      filteredPlants.find((plant) => plant.id === state.plantDialogId) ||
      enrichedPlants.find((plant) => plant.id === state.plantDialogId) ||
      null;
    const notificationStatus = buildNotificationStatus();
    const isDarkMode = state.currentUser.settings.theme === "dark";

    root.innerHTML = `
      <div class="app-shell ${selectedPlant ? "dialog-open" : ""}">
        ${App.components.layout.renderSidebar({
          currentView: state.currentView,
          gamification,
          stats,
          user: state.currentUser,
        })}

        <main class="app-main">
          ${App.components.layout.renderTopbar({
            activeTask,
            currentView: state.currentView,
            editingPlantId: state.editingPlantId,
            stats,
            user: state.currentUser,
          })}
          ${App.components.layout.renderToast(state.toast)}
          <div class="app-view-frame">
            ${renderView({
              editingPlant,
              filteredPlants,
              gamification,
              isDarkMode,
              notificationStatus,
              rawPlants: state.plants,
              selectedPlant,
              state,
              stats,
              tasks,
              user: state.currentUser,
            })}
          </div>
          ${App.components.layout.renderMobileNav(state.currentView)}
        </main>
      </div>
      ${App.components.home.renderPlantDialog(selectedPlant, state)}
    `;

    if (state.currentView === "cadastro") {
      updatePhotoPreview();
    }

    syncDialogViewport(Boolean(selectedPlant));
  }

  function renderView(context) {
    if (state.currentView === "lembretes") {
      return App.components.reminders.render(context);
    }

    if (state.currentView === "cadastro") {
      return App.components.form.render(context);
    }

    if (state.currentView === "configuracoes") {
      return App.components.settings.render(context);
    }

    return App.components.home.render(context);
  }

  function handleClick(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const { action, view, filter, sunlight, id } = actionTarget.dataset;

    if (action === "go-view") {
      goToView(view);
      return;
    }

    if (action === "new-plant") {
      state.currentView = "cadastro";
      state.editingPlantId = "";
      state.plantDialogId = "";
      state.dialogMode = "actions";
      state.photoDraft = "";
      renderApp();
      return;
    }

    if (action === "open-plant-dialog") {
      state.plantDialogId = id;
      state.dialogMode = "actions";
      renderApp();
      return;
    }

    if (action === "close-plant-dialog") {
      state.plantDialogId = "";
      state.dialogMode = "actions";
      renderApp();
      return;
    }

    if (action === "request-delete-dialog") {
      state.plantDialogId = id;
      state.dialogMode = "delete-confirm";
      renderApp();
      return;
    }

    if (action === "cancel-delete-dialog") {
      state.dialogMode = "actions";
      renderApp();
      return;
    }

    if (action === "confirm-delete-dialog") {
      deletePlant(id);
      return;
    }

    if (action === "reset-form") {
      state.editingPlantId = "";
      state.photoDraft = "";
      renderApp();
      return;
    }

    if (action === "remove-photo") {
      state.photoDraft = "";
      const photoInput = document.querySelector("#photo-input");
      if (photoInput) {
        photoInput.value = "";
      }
      updatePhotoPreview();
      return;
    }

    if (action === "filter-status") {
      state.filter = filter;
      renderApp();
      return;
    }

    if (action === "filter-sunlight") {
      state.sunlightFilter = sunlight;
      renderApp();
      return;
    }

    if (action === "scroll-filters") {
      scrollFilterStrip(
        actionTarget.dataset.target,
        Number(actionTarget.dataset.direction || 1),
      );
      return;
    }

    if (action === "seed-demo") {
      state.plants = App.store.createSeededPlants();
      syncPlantLifecycle();
      persistPlants();
      state.currentView = "home";
      state.editingPlantId = "";
      state.photoDraft = "";
      renderApp();
      return;
    }

    if (action === "clear-storage") {
      if (
        !window.confirm(
          "Deseja remover todas as plantas salvas nesta conta local?",
        )
      ) {
        return;
      }

      state.plants = [];
      persistPlants();
      renderApp();
      return;
    }

    if (action === "export-data") {
      exportPlants();
      return;
    }

    if (action === "toggle-notifications") {
      toggleNotifications();
      return;
    }

    if (action === "toggle-dark-mode") {
      toggleDarkMode();
      return;
    }

    if (action === "logout") {
      App.monitor.stop();
      App.notifications.stop();
      App.auth.logout();
      return;
    }

    if (!id) {
      return;
    }

    if (action === "edit") {
      const plant = state.plants.find((entry) => entry.id === id);
      if (!plant) {
        return;
      }

      state.currentView = "cadastro";
      state.editingPlantId = id;
      state.plantDialogId = "";
      state.dialogMode = "actions";
      state.photoDraft = plant.photoDataUrl || "";
      renderApp();
      return;
    }

    if (action === "delete") {
      deletePlant(id);
      return;
    }

    if (action === "water") {
      handleCareAction(id, "water");
      return;
    }

    if (action === "sunbath") {
      handleCareAction(id, "sunbath");
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest("#plant-form");
    if (!form) {
      return;
    }

    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      id: formData.get("plant-id") || App.utils.createId(),
      name: App.utils.normalizeText(formData.get("name")),
      species: App.utils.normalizeText(formData.get("species")),
      environment: App.utils.normalizeText(formData.get("environment")),
      sunlight: App.utils.normalizeText(formData.get("sunlight")),
      wateringFrequency: Number(formData.get("wateringFrequency")),
      sunlightFrequency: Number(formData.get("sunlightFrequency")),
      acquiredDate: formData.get("acquiredDate"),
      lastWateredAt: formData.get("lastWateredAt"),
      lastSunbathAt: formData.get("lastSunbathAt"),
      lifeExpectancyMonths: Number(formData.get("lifeExpectancyMonths")),
      photoDataUrl: state.photoDraft || "",
      notes: App.utils.normalizeText(formData.get("notes")),
      deadAt: "",
      deathReason: "",
    };

    const existingIndex = state.plants.findIndex(
      (plant) => plant.id === payload.id,
    );
    const isNewPlant = existingIndex < 0;

    if (existingIndex >= 0) {
      state.plants[existingIndex] = payload;
    } else {
      state.plants.unshift(payload);
    }

    syncPlantLifecycle();
    persistPlants();
    awardAfterSave(payload, isNewPlant);
    state.currentView = "home";
    state.editingPlantId = "";
    state.photoDraft = "";
    showToast({
      title: editingPlantLabel(isNewPlant),
      message: isNewPlant
        ? "Nova planta salva com sucesso."
        : "Alterações salvas com sucesso.",
    });
    renderApp();
  }

  function handleInput(event) {
    if (event.target.id === "search-input") {
      state.search = event.target.value.trim();
      renderApp();
      return;
    }

    if (event.target.id === "name" && state.currentView === "cadastro") {
      updatePhotoPreview();
    }
  }

  function handleChange(event) {
    if (event.target.id !== "photo-input") {
      return;
    }

    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      state.photoDraft = String(reader.result || "");
      updatePhotoPreview();
    };
    reader.readAsDataURL(file);
  }

  function goToView(view) {
    state.currentView = view;
    state.plantDialogId = "";
    state.dialogMode = "actions";
    if (view !== "cadastro") {
      state.editingPlantId = "";
      state.photoDraft = "";
    }
    renderApp();
  }

  function handleCareAction(id, action) {
    const plant = enrichPlant(state.plants.find((entry) => entry.id === id));
    if (!plant) {
      return;
    }

    if (plant.isDead) {
      showToast({
        title: "Planta sem cuidados disponíveis",
        message:
          "Atualize o cadastro para revisar as datas ou remova o registro.",
      });
      renderApp();
      return;
    }

    if (action === "water") {
      patchPlant(id, { lastWateredAt: App.utils.today() });
      awardCareAction("waterPlant", plant.wateringDueInDays <= 0);
      state.plantDialogId = "";
      state.dialogMode = "actions";
      showToast({
        title: "Rega registrada",
        message: `${plant.name} foi atualizada.`,
      });
      renderApp();
      return;
    }

    patchPlant(id, { lastSunbathAt: App.utils.today() });
    awardCareAction("sunPlant", plant.sunlightDueInDays <= 0);
    state.plantDialogId = "";
    state.dialogMode = "actions";
    showToast({
      title: "Sol registrado",
      message: `${plant.name} foi atualizada.`,
    });
    renderApp();
  }

  function awardAfterSave(payload, isNewPlant) {
    const context = getRewardContext();
    if (isNewPlant) {
      App.gamification.award("createPlant", context);
      syncCurrentUser();
    }

    if (payload.photoDataUrl) {
      App.gamification.award("addPhoto", getRewardContext());
      syncCurrentUser();
    }
  }

  function awardCareAction(action, resolvedDue) {
    App.gamification.award(action, getRewardContext());
    syncCurrentUser();

    if (resolvedDue) {
      App.gamification.award("resolveDue", getRewardContext());
      syncCurrentUser();
    }
  }

  function toggleNotifications() {
    if (state.currentUser.settings.notificationsEnabled) {
      state.currentUser = App.auth.updateCurrentUser((draft) => {
        draft.settings.notificationsEnabled = false;
        return draft;
      });
      showToast({
        title: "Notificações",
        message: "Os alertas locais foram desativados.",
      });
      renderApp();
      return;
    }

    App.notifications
      .requestPermission()
      .then((permission) => {
        if (permission !== "granted") {
          showToast({
            title: "Notificações",
            message: "A permissão não foi concedida.",
          });
          renderApp();
          return;
        }

        state.currentUser = App.auth.updateCurrentUser((draft) => {
          draft.settings.notificationsEnabled = true;
          return draft;
        });
        showToast({
          title: "Notificações ativas",
          message: "Os lembretes locais foram habilitados para esta conta.",
        });
        renderApp();
        App.notifications.evaluate(getNotificationContext());
      })
      .catch((error) => {
        showToast({ title: "Erro nas notificações", message: error.message });
        renderApp();
      });
  }

  function toggleDarkMode() {
    state.currentUser = App.auth.updateCurrentUser((draft) => {
      draft.settings.theme = draft.settings.theme === "dark" ? "light" : "dark";
      return draft;
    });
    applyTheme(state.currentUser.settings.theme);
    showToast({
      title: "Tema atualizado",
      message:
        state.currentUser.settings.theme === "dark"
          ? "Modo escuro ativado."
          : "Modo claro ativado.",
    });
    renderApp();
  }

  function patchPlant(id, updates) {
    state.plants = state.plants.map((plant) =>
      plant.id === id ? { ...plant, ...updates } : plant,
    );
    syncPlantLifecycle();
    persistPlants();
  }

  function deletePlant(id) {
    state.plants = state.plants.filter((plant) => plant.id !== id);
    persistPlants();
    if (state.editingPlantId === id) {
      state.editingPlantId = "";
      state.photoDraft = "";
    }
    state.plantDialogId = "";
    state.dialogMode = "actions";
    showToast({
      title: "Planta removida",
      message: "O registro foi excluído da sua conta local.",
    });
    renderApp();
  }

  function persistPlants() {
    App.store.savePlants(state.currentUser.id, state.plants);
  }

  function updatePhotoPreview() {
    const preview = document.querySelector("#photo-preview");
    if (!preview) {
      return;
    }

    const nameInput = document.querySelector("#name");
    const currentName = nameInput?.value || "Planta";
    preview.innerHTML = App.components.form.renderPhotoPreviewMarkup(
      state.photoDraft,
      currentName,
    );
  }

  function enrichPlant(plant) {
    if (!plant) {
      return null;
    }

    const lifecycle = App.monitor.getLifecycleSnapshot(plant);
    const needsAttention =
      lifecycle.isDead ||
      lifecycle.wateringDueInDays <= 0 ||
      lifecycle.sunlightDueInDays <= 0 ||
      lifecycle.vitality <= 70;

    return {
      ...plant,
      ...lifecycle,
      emoji: App.utils.getPlantEmoji(plant),
      needsAttention,
      statusClass: lifecycle.isDead
        ? "dead"
        : needsAttention
          ? "attention"
          : "healthy",
      statusLabel: lifecycle.isDead
        ? "Morta"
        : needsAttention
          ? "Atenção"
          : "Saudável",
      sunlightMessage: lifecycle.isDead
        ? "Sem ações de sol disponíveis"
        : buildReminderMessage(lifecycle.sunlightDueInDays, "sol"),
      lastSunbathLabel: App.utils.formatDate(plant.lastSunbathAt),
      lastWateredLabel: App.utils.formatDate(plant.lastWateredAt),
      wateringMessage: lifecycle.isDead
        ? "Sem ações de rega disponíveis"
        : buildReminderMessage(lifecycle.wateringDueInDays, "rega"),
    };
  }

  function buildStats(plants) {
    const total = plants.length;
    const wateringDue = plants.filter(
      (plant) => plant.wateringDueInDays <= 0,
    ).length;
    const sunDue = plants.filter(
      (plant) => plant.sunlightDueInDays <= 0,
    ).length;
    const needAttention = plants.filter((plant) => plant.needsAttention).length;
    const healthy = plants.filter((plant) => !plant.needsAttention).length;
    const dead = plants.filter((plant) => plant.isDead).length;
    const averageRemainingDays = total
      ? Math.round(
          plants.reduce(
            (sum, plant) => sum + Math.max(0, plant.remainingLifeDays),
            0,
          ) / total,
        )
      : 0;

    return {
      total,
      wateringDue,
      sunDue,
      needAttention,
      healthy,
      dead,
      lifeWindow: total
        ? `${Math.max(1, Math.round(averageRemainingDays / 30))}m`
        : "0m",
    };
  }

  function buildTasks(plants) {
    return plants
      .flatMap((plant) => {
        if (plant.isDead) {
          return [
            {
              typeLabel: "🥀 Estado",
              title: plant.name,
              description: `${plant.emoji} ${plant.healthMessage}`,
              timingValue: -999,
              timingLabel: "Morta",
              isOverdue: true,
              toneClass: "dead",
            },
          ];
        }

        return [
          {
            typeLabel: "💧 Rega",
            title: plant.name,
            description: `${plant.emoji} Regar ${plant.name.toLowerCase()} (${plant.sunlight.toLowerCase()}).`,
            timingValue: plant.wateringDueInDays,
            timingLabel: buildDueLabel(plant.wateringDueInDays),
            isOverdue: plant.wateringDueInDays <= 0,
            toneClass: plant.wateringDueInDays <= 0 ? "overdue" : "ok",
          },
          {
            typeLabel: "☀️ Sol",
            title: plant.name,
            description: `${plant.emoji} Levar ${plant.name.toLowerCase()} para ${plant.sunlight.toLowerCase()}.`,
            timingValue: plant.sunlightDueInDays,
            timingLabel: buildDueLabel(plant.sunlightDueInDays),
            isOverdue: plant.sunlightDueInDays <= 0,
            toneClass: plant.sunlightDueInDays <= 0 ? "overdue" : "ok",
          },
        ];
      })
      .sort((left, right) => left.timingValue - right.timingValue);
  }

  function applyFilters(plants) {
    const searchTerm = state.search.toLowerCase();

    return plants.filter((plant) => {
      const matchesStatus =
        state.filter === "all" ||
        (state.filter === "attention" && plant.needsAttention) ||
        (state.filter === "healthy" && !plant.needsAttention);
      const matchesSunlight =
        state.sunlightFilter === "all" ||
        plant.sunlight === state.sunlightFilter;
      const matchesSearch =
        !searchTerm ||
        `${plant.name} ${plant.species} ${plant.environment}`
          .toLowerCase()
          .includes(searchTerm);
      return matchesStatus && matchesSunlight && matchesSearch;
    });
  }

  function buildReminderMessage(days, label) {
    if (days < 0) {
      return `${Math.abs(days)} dia(s) de atraso para ${label}`;
    }

    if (days === 0) {
      return `Fazer ${label} hoje`;
    }

    return `${label} em ${days} dia(s)`;
  }

  function buildDueLabel(days) {
    if (days < 0) {
      return `${Math.abs(days)} dia(s) atrasado`;
    }

    if (days === 0) {
      return "Hoje";
    }

    return `Em ${days} dia(s)`;
  }

  function editingPlantLabel(isNewPlant) {
    return isNewPlant ? "Planta salva" : "Planta atualizada";
  }

  function scrollFilterStrip(targetId, direction) {
    const target = document.querySelector(`#${targetId}`);
    if (!target) {
      return;
    }

    target.scrollBy({ left: direction * 180, behavior: "smooth" });
  }

  function exportPlants() {
    const payload = JSON.stringify(
      {
        user: {
          id: state.currentUser.id,
          name: state.currentUser.name,
          email: state.currentUser.email,
        },
        plants: state.plants,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${state.currentUser.name.toLowerCase().replaceAll(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function getRewardContext() {
    return {
      plantCount: state.plants.length,
      photoCount: state.plants.filter((plant) => plant.photoDataUrl).length,
    };
  }

  function getNotificationContext() {
    return {
      user: state.currentUser,
      plants: state.plants.map(enrichPlant),
    };
  }

  function buildNotificationStatus() {
    if (!("Notification" in window)) {
      return "Seu navegador não oferece suporte a notificações locais.";
    }

    if (
      state.currentUser.settings.notificationsEnabled &&
      Notification.permission === "granted"
    ) {
      return "Ativadas. Ao fechar um alerta, ele não volta para a mesma ocorrência.";
    }

    return "Desativadas. Você pode ativar alertas locais para rega e sol.";
  }

  function syncCurrentUser() {
    state.currentUser = App.auth.getCurrentUser();
    applyTheme(state.currentUser?.settings?.theme || "light");
  }

  function applyTheme(theme) {
    document.body.classList.toggle("theme-dark", theme === "dark");
  }

  function showToast(toast) {
    state.toast = toast;
    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }
    state.toastTimer = window.setTimeout(() => {
      state.toast = null;
      renderApp();
    }, 3000);
  }

  function syncPlantLifecycle() {
    const result = App.monitor.syncPlants(state.plants);
    state.plants = result.plants;
    return result;
  }

  function syncDialogViewport(isDialogOpen) {
    document.body.classList.toggle("dialog-active", isDialogOpen);

    if (!isDialogOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const dialogCard = document.querySelector(".plant-dialog-card");
      if (!dialogCard) {
        return;
      }

      dialogCard.setAttribute("tabindex", "-1");
      dialogCard.focus({ preventScroll: true });
    });
  }
})();
