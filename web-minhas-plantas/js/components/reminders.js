(() => {
  const App = window.PlantApp;
  App.components = App.components || {};

  function render(context) {
    const overdue = context.tasks.filter((task) => task.isOverdue);
    const upcoming = context.tasks.filter((task) => !task.isOverdue);

    return `
      <section class="view-grid reminders-grid">
        <article class="panel-card reminder-summary-card">
          <div class="panel-head">
            <div>
              <h2>Agenda verde</h2>
              <p>Resolva primeiro o que está atrasado e siga para o próximo cuidado.</p>
            </div>
          </div>

          <div class="stats-strip compact-stats">
            ${renderSummaryCard("🚨", "Atrasados", overdue.length)}
            ${renderSummaryCard("📅", "Próximos", upcoming.length)}
            ${renderSummaryCard("💧", "Rega hoje", context.stats.wateringDue)}
            ${renderSummaryCard("☀️", "Sol hoje", context.stats.sunDue)}
          </div>
        </article>

        <article class="panel-card">
          <div class="panel-head">
            <div>
              <h2>Atenção imediata</h2>
              <p>Itens vencidos ou que precisam ser resolvidos hoje.</p>
            </div>
          </div>
          <div class="task-list expanded">
            ${renderTaskList(overdue, "Nenhum alerta urgente no momento.")}
          </div>
        </article>

        <article class="panel-card">
          <div class="panel-head">
            <div>
              <h2>Fila dos próximos cuidados</h2>
              <p>Tarefas que estão chegando para você se planejar.</p>
            </div>
          </div>
          <div class="task-list expanded">
            ${renderTaskList(upcoming, "Nenhum proximo cuidado encontrado.")}
          </div>
        </article>
      </section>
    `;
  }

  function renderSummaryCard(icon, label, value) {
    return `
      <div class="mini-stat">
        <span>${icon} ${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  function renderTaskList(tasks, emptyMessage) {
    if (!tasks.length) {
      return `
        <article class="empty-state compact-empty">
          <strong>Sem itens</strong>
          <p>${emptyMessage}</p>
        </article>
      `;
    }

    return tasks
      .map(
        (task) => `
          <article class="task-item ${task.toneClass || (task.isOverdue ? "overdue" : "ok")}">
            <div class="task-head-row">
              <small>${task.typeLabel}</small>
              <span class="task-pill ${task.toneClass || (task.isOverdue ? "overdue" : "ok")}">${task.timingLabel}</span>
            </div>
            <strong>${App.utils.escapeHtml(task.title)}</strong>
            <p>${App.utils.escapeHtml(task.description)}</p>
          </article>
        `,
      )
      .join("");
  }

  App.components.reminders = {
    render,
  };
})();
