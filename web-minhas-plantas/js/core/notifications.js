(() => {
  const App = window.PlantApp;
  let intervalId = null;

  async function requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("Este navegador não suporta notificações locais.");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    return Notification.requestPermission();
  }

  function buildDueTasks(plants) {
    return plants.flatMap((plant) => {
      const entries = [];

      if (plant.isDead) {
        entries.push({
          key: `${plant.id}:dead:${plant.deadAt || App.utils.today()}`,
          title: `🥀 ${plant.name} não resistiu`,
          body: plant.healthMessage,
        });
        return entries;
      }

      const waterDueDate = App.utils.addDays(
        plant.lastWateredAt,
        Number(plant.wateringFrequency),
      );
      const sunDueDate = App.utils.addDays(
        plant.lastSunbathAt,
        Number(plant.sunlightFrequency),
      );

      if (plant.wateringDueInDays <= 0) {
        entries.push({
          key: `${plant.id}:water:${waterDueDate}`,
          title: `${plant.emoji} Hora de regar ${plant.name}`,
          body:
            plant.wateringDueInDays < 0
              ? `A rega está ${Math.abs(plant.wateringDueInDays)} dia(s) atrasada.`
              : "A rega vence hoje.",
        });
      }

      if (plant.sunlightDueInDays <= 0) {
        entries.push({
          key: `${plant.id}:sun:${sunDueDate}`,
          title: `☀️ Hora do sol para ${plant.name}`,
          body:
            plant.sunlightDueInDays < 0
              ? `A exposição ao sol está ${Math.abs(plant.sunlightDueInDays)} dia(s) atrasada.`
              : "O banho de sol vence hoje.",
        });
      }

      return entries;
    });
  }

  function evaluate(context) {
    if (!("Notification" in window)) {
      return;
    }

    const { user, plants } = context;
    if (
      !user?.settings?.notificationsEnabled ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const notifiedMap = App.store.loadNotifiedMap(user.id);
    const dueTasks = buildDueTasks(plants);
    let changed = false;

    dueTasks.forEach((task) => {
      if (notifiedMap[task.key]?.status) {
        return;
      }

      const notification = new Notification(task.title, {
        body: task.body,
        tag: task.key,
      });

      notifiedMap[task.key] = {
        status: "shown",
        updatedAt: new Date().toISOString(),
      };

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onclose = () => {
        const currentMap = App.store.loadNotifiedMap(user.id);
        currentMap[task.key] = {
          status: "dismissed",
          updatedAt: new Date().toISOString(),
        };
        App.store.saveNotifiedMap(user.id, currentMap);
      };

      changed = true;
    });

    if (changed) {
      App.store.saveNotifiedMap(user.id, notifiedMap);
    }
  }

  function start(getContext) {
    stop();
    evaluate(getContext());
    intervalId = window.setInterval(() => {
      evaluate(getContext());
    }, 60000);
  }

  function stop() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  App.notifications = {
    evaluate,
    requestPermission,
    start,
    stop,
  };
})();
