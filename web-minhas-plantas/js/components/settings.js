(() => {
  const App = window.PlantApp;
  App.components = App.components || {};

  function render(context) {
    const { user, notificationStatus, isDarkMode } = context;
    const storageSize = new Blob([JSON.stringify(context.rawPlants)]).size;
    const gamification = context.gamification;

    return `
      <section class="view-grid settings-grid">
        <article class="panel-card">
          <div class="panel-head">
            <div>
              <h2>Conta local</h2>
              <p>Acompanhe aqui o seu progresso e estatísticas.</p>
            </div>
          </div>

          <div class="settings-profile">
            <div class="profile-avatar large">${App.utils.buildInitials(user.name)}</div>
            <div>
              <strong>${App.utils.escapeHtml(user.name)}</strong>
              <p>${App.utils.escapeHtml(user.email)}</p>
            </div>
          </div>

          <div class="stats-strip compact-stats nested-settings">
            <div class="mini-stat">
              <span>🏆 Nível</span>
              <strong>${gamification.level}</strong>
            </div>
            <div class="mini-stat">
              <span>🪙 Moedas</span>
              <strong>${gamification.coins}</strong>
            </div>
            <div class="mini-stat">
              <span>🔥 Streak</span>
              <strong>${gamification.streak}</strong>
            </div>
            <div class="mini-stat">
              <span>📦 Uso local</span>
              <strong>${App.utils.formatBytes(storageSize)}</strong>
            </div>
          </div>
        </article>

        <article class="panel-card action-panel">
          <div class="panel-head">
            <div>
              <h2>Preferências</h2>
              <p>Salvas nesta conta local para manter sua experiência consistente.</p>
            </div>
          </div>

          <div class="preferences-list">
            <article class="preference-card">
              <div>
                <strong>🔔 Notificações locais</strong>
                <p>${notificationStatus}</p>
              </div>
              <button class="soft-button" type="button" data-action="toggle-notifications">${user.settings.notificationsEnabled ? "Desativar" : "Ativar"}</button>
            </article>

            <article class="preference-card">
              <div>
                <strong>🌙 Modo escuro</strong>
                <p>${isDarkMode ? "Tema escuro ativo nesta conta." : "Tema claro ativo nesta conta."}</p>
              </div>
              <button class="soft-button" type="button" data-action="toggle-dark-mode">${isDarkMode ? "Usar tema claro" : "Usar tema escuro"}</button>
            </article>
          </div>
        </article>

        <article class="panel-card helper-panel">
          <div class="panel-head">
            <div>
              <h2>Dados locais</h2>
              <p>Ferramentas rápidas para backup, restauração e limpeza.</p>
            </div>
          </div>

          <div class="settings-actions">
            <button class="soft-button" type="button" data-action="export-data">📤 Exportar backup JSON</button>
            <button class="soft-button" type="button" data-action="seed-demo">🌱 Restaurar plantas demo</button>
            <button class="danger-button" type="button" data-action="clear-storage">🧹 Limpar plantas</button>
            <button class="danger-button" type="button" data-action="logout">🚪 Sair da conta</button>
          </div>
        </article>
      </section>
    `;
  }

  App.components.settings = {
    render,
  };
})();
