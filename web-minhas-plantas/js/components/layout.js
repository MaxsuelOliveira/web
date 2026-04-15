(() => {
  const App = window.PlantApp;
  App.components = App.components || {};

  function renderSidebar(context) {
    const { user, gamification, stats, currentView } = context;

    return `
      <aside class="sidebar-card">
        <div class="brand-block">
          <div class="brand-mark">🌿</div>
          <div>
            <strong>Gestor de Plantas</strong>
            <p>Jardim local, simples e bem cuidado.</p>
          </div>
        </div>

        <section class="profile-card">
          <div class="profile-avatar">${App.utils.buildInitials(user.name)}</div>
          <div class="profile-copy">
            <strong>${App.utils.escapeHtml(user.name)}</strong>
            <p>${App.utils.escapeHtml(user.email)}</p>
          </div>
          <span class="profile-pill">Nível ${gamification.level}</span>
        </section>

        <button class="primary-button sidebar-cta" type="button" data-action="new-plant">
          🪴 Nova planta
        </button>

        <nav class="menu-list" aria-label="Menu principal">
          ${renderNavButton(currentView, "home", "🏡", "Home", "Minhas plantas")}
          ${renderNavButton(currentView, "lembretes", "🔔", "Lembretes", "Agenda de cuidados")}
          ${renderNavButton(currentView, "cadastro", "🪴", "Cadastro", "Nova planta e foto")}
          ${renderNavButton(currentView, "configuracoes", "⚙️", "Ajustes", "Tema, alertas e dados")}
        </nav>

        <section class="sidebar-footnote">
          <span>${stats.needAttention} cuidado(s) pedindo atenção</span>
          <strong>${gamification.coins} moedas verdes</strong>
        </section>
      </aside>
    `;
  }

  function renderNavButton(currentView, view, icon, label, description) {
    return `
      <button
        class="menu-button ${currentView === view ? "is-active" : ""}"
        type="button"
        data-action="go-view"
        data-view="${view}"
      >
        <div class="menu-icon">${icon}</div>
        <div>
          <strong>${label}</strong>
          <span>${description}</span>
        </div>
      </button>
    `;
  }

  function renderTopbar(context) {
    const { currentView, activeTask, stats, user } = context;

    const headerMap = {
      home: {
        eyebrow: "🏡 Home",
        title: `Olá, ${App.utils.escapeHtml(user.name)}.`,
        description: "Cuidando das suas plantas, uma a uma.",
      },
      lembretes: {
        eyebrow: "🔔 Lembretes",
        title: "Agenda do jardim",
        description: "Veja só o que precisa de ação agora e em seguida.",
      },
      cadastro: {
        eyebrow: "🪴 Cadastro",
        title: context.editingPlantId
          ? "Atualize sua planta"
          : "Cadastre uma nova planta",
        description: "Preencha o essencial e salve tudo localmente.",
      },
      configuracoes: {
        eyebrow: "⚙️ Configurações",
        title: "Preferências e dados locais",
        description: "Tema, alertas e ações de manutenção da conta local.",
      },
    };

    const content = headerMap[currentView];
    const topbarBadges = [];

    if (currentView === "home") {
      topbarBadges.push(`🪴 ${stats.total} planta(s)`);
      topbarBadges.push(`🚨 ${stats.needAttention} em atenção`);
    }

    if (activeTask) {
      topbarBadges.push(
        `${activeTask.typeLabel} ${App.utils.escapeHtml(activeTask.title)}`,
      );
    }

    return `
      <header class="topbar-card">
        <div class="topbar-copy">
          <span class="section-eyebrow">${content.eyebrow}</span>
          <h1>${content.title}</h1>
          <p>${content.description}</p>
        </div>

        <div class="topbar-aside compact-badges">
          ${topbarBadges
            .map(
              (badge) => `
                <span class="topbar-badge">${badge}</span>
              `,
            )
            .join("")}
        </div>
      </header>
    `;
  }

  function renderToast(toast) {
    if (!toast) {
      return "";
    }

    return `
      <div class="toast-banner">
        <strong>✨ ${App.utils.escapeHtml(toast.title)}</strong>
        <span>${App.utils.escapeHtml(toast.message)}</span>
      </div>
    `;
  }

  function renderMobileNav(currentView) {
    return `
      <nav class="mobile-nav" aria-label="Menu inferior">
        ${renderMobileButton(currentView, "home", "🏡", "Home")}
        ${renderMobileButton(currentView, "lembretes", "🔔", "Alertas")}
        ${renderMobileButton(currentView, "cadastro", "🪴", "Nova")}
        ${renderMobileButton(currentView, "configuracoes", "⚙️", "Config")}
      </nav>
    `;
  }

  function renderMobileButton(currentView, view, icon, label) {
    return `
      <button
        class="mobile-nav-button ${currentView === view ? "is-active" : ""}"
        type="button"
        data-action="go-view"
        data-view="${view}"
      >
        <span>${icon}</span>
        <small>${label}</small>
      </button>
    `;
  }

  App.components.layout = {
    renderMobileNav,
    renderSidebar,
    renderToast,
    renderTopbar,
  };
})();
