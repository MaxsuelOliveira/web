(() => {
  const App = window.PlantApp;

  const XP_RULES = {
    createPlant: { xp: 40, coins: 12, label: "Nova planta cadastrada" },
    addPhoto: { xp: 20, coins: 6, label: "Foto adicionada" },
    waterPlant: { xp: 10, coins: 4, label: "Rega concluída" },
    sunPlant: { xp: 10, coins: 4, label: "Banho de sol concluído" },
    resolveDue: { xp: 15, coins: 5, label: "Cuidado pendente resolvido" },
    loginDaily: { xp: 5, coins: 2, label: "Acesso diário" },
  };

  function levelFromXp(xp) {
    return Math.max(1, Math.floor(xp / 100) + 1);
  }

  function updateStreak(meta) {
    const today = App.utils.today();
    const lastDate = meta.lastActivityDate;

    if (!lastDate) {
      meta.streak = 1;
      meta.lastActivityDate = today;
      return;
    }

    const difference = App.utils.diffDays(lastDate, today);
    if (difference <= 0) {
      return;
    }

    meta.streak = difference === 1 ? meta.streak + 1 : 1;
    meta.lastActivityDate = today;
  }

  function pushAchievement(meta, label) {
    if (!meta.achievements.includes(label)) {
      meta.achievements.push(label);
    }
  }

  function syncAchievements(meta, context) {
    if (context.plantCount >= 1) {
      pushAchievement(meta, "🌱 Primeira planta");
    }

    if (context.plantCount >= 5) {
      pushAchievement(meta, "🪴 Colecionador verde");
    }

    if (context.photoCount >= 1) {
      pushAchievement(meta, "📸 Jardim fotogênico");
    }

    if (meta.careActions >= 5) {
      pushAchievement(meta, "💧 Cuidador dedicado");
    }

    if (meta.streak >= 3) {
      pushAchievement(meta, "🔥 Sequência verde");
    }
  }

  function award(action, context = {}) {
    const reward = XP_RULES[action];
    if (!reward) {
      return null;
    }

    const user = App.auth.updateCurrentUser((draft) => {
      const meta = draft.gamification || {
        xp: 0,
        level: 1,
        coins: 0,
        streak: 0,
        careActions: 0,
        achievements: [],
        lastActivityDate: null,
      };

      updateStreak(meta);
      meta.xp += reward.xp;
      meta.coins += reward.coins;
      if (action === "waterPlant" || action === "sunPlant") {
        meta.careActions += 1;
      }
      meta.level = levelFromXp(meta.xp);
      syncAchievements(meta, {
        plantCount: context.plantCount || 0,
        photoCount: context.photoCount || 0,
      });
      draft.gamification = meta;
      return draft;
    });

    if (!user) {
      return null;
    }

    const summary = getSummary(user);
    return {
      ...reward,
      summary,
      message: `${reward.label}: +${reward.xp} XP e +${reward.coins} moedas verdes.`,
    };
  }

  function trackLoginReward() {
    const currentUser = App.auth.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    if (currentUser.gamification?.lastLoginRewardDate === App.utils.today()) {
      return null;
    }

    return App.auth.updateCurrentUser((draft) => {
      const meta = draft.gamification;
      updateStreak(meta);
      meta.xp += XP_RULES.loginDaily.xp;
      meta.coins += XP_RULES.loginDaily.coins;
      meta.level = levelFromXp(meta.xp);
      meta.lastLoginRewardDate = App.utils.today();
      syncAchievements(meta, {
        plantCount: App.store.loadPlants(draft.id).length,
        photoCount: App.store
          .loadPlants(draft.id)
          .filter((plant) => plant.photoDataUrl).length,
      });
      draft.gamification = meta;
      return draft;
    });
  }

  function getSummary(user) {
    const meta = user?.gamification || {};
    const xp = meta.xp || 0;
    const level = meta.level || levelFromXp(xp);
    const xpFloor = (level - 1) * 100;
    const xpCeil = level * 100;
    const progress = Math.min(
      100,
      Math.round(((xp - xpFloor) / (xpCeil - xpFloor)) * 100),
    );

    return {
      xp,
      level,
      coins: meta.coins || 0,
      streak: meta.streak || 0,
      careActions: meta.careActions || 0,
      achievements: meta.achievements || [],
      progress,
      nextLevelXp: xpCeil,
    };
  }

  App.gamification = {
    award,
    getSummary,
    levelFromXp,
    trackLoginReward,
  };
})();
