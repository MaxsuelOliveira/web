(() => {
  const App = window.PlantApp;
  let intervalId = null;

  const MAX_VITALITY = 100;
  const WATER_PENALTY_PER_DAY = 14;
  const SUN_PENALTY_PER_DAY = 10;
  const AGE_GRACE_RATIO = 0.85;
  const AGE_DAILY_PENALTY = 0.35;

  function getLifecycleSnapshot(plant) {
    if (!plant) {
      return null;
    }

    const wateringDueInDays = App.utils.daysUntilDue(
      plant.lastWateredAt,
      plant.wateringFrequency,
    );
    const sunlightDueInDays = App.utils.daysUntilDue(
      plant.lastSunbathAt,
      plant.sunlightFrequency,
    );
    const waterOverdueDays = Math.max(0, -wateringDueInDays);
    const sunOverdueDays = Math.max(0, -sunlightDueInDays);
    const expectedLifeDays = Math.max(
      30,
      Number(plant.lifeExpectancyMonths || 24) * 30,
    );
    const ageInDays = Math.max(
      0,
      App.utils.diffDays(plant.acquiredDate, App.utils.today()),
    );
    const remainingLifeDays = Math.max(0, expectedLifeDays - ageInDays);
    const agingThreshold = Math.round(expectedLifeDays * AGE_GRACE_RATIO);
    const agingPenalty =
      ageInDays > agingThreshold
        ? Math.min(
            22,
            Math.round((ageInDays - agingThreshold) * AGE_DAILY_PENALTY),
          )
        : 0;

    const vitality = Math.max(
      0,
      MAX_VITALITY -
        waterOverdueDays * WATER_PENALTY_PER_DAY -
        sunOverdueDays * SUN_PENALTY_PER_DAY -
        agingPenalty,
    );

    const deadAt = String(plant.deadAt || "");
    const revivedAfterDeath =
      !!deadAt &&
      (String(plant.lastWateredAt || "") > deadAt ||
        String(plant.lastSunbathAt || "") > deadAt);
    const isDead = deadAt && !revivedAfterDeath ? true : vitality === 0;
    const deathReason = isDead
      ? App.utils.normalizeText(plant.deathReason) ||
        buildDeathReason(waterOverdueDays, sunOverdueDays, agingPenalty)
      : "";

    return {
      ageInDays,
      agingPenalty,
      deathReason,
      expectedLifeDays,
      healthMessage: buildHealthMessage({
        agingPenalty,
        deathReason,
        isDead,
        sunOverdueDays,
        vitality,
        waterOverdueDays,
      }),
      healthToneClass: buildHealthTone(vitality, isDead),
      isDead,
      remainingLifeDays,
      revivedAfterDeath,
      sunlightDueInDays,
      sunOverdueDays,
      vitality,
      wateringDueInDays,
      waterOverdueDays,
    };
  }

  function syncPlants(plants) {
    let changed = false;
    const newDeaths = [];

    const syncedPlants = plants.map((plant) => {
      const snapshot = getLifecycleSnapshot(plant);
      if (!snapshot) {
        return plant;
      }

      const nextPlant = { ...plant };

      if (snapshot.isDead) {
        if (!plant.deadAt || snapshot.revivedAfterDeath) {
          nextPlant.deadAt = App.utils.today();
          nextPlant.deathReason = snapshot.deathReason;
          changed = true;
          newDeaths.push({
            id: nextPlant.id,
            name: nextPlant.name,
            reason: snapshot.deathReason,
          });
        }
      } else if (plant.deadAt || plant.deathReason) {
        nextPlant.deadAt = "";
        nextPlant.deathReason = "";
        changed = true;
      }

      return nextPlant;
    });

    return {
      changed,
      newDeaths,
      plants: syncedPlants,
    };
  }

  function start(getPlants, onUpdate) {
    stop();
    intervalId = window.setInterval(() => {
      const result = syncPlants(getPlants());
      if (result.changed) {
        onUpdate(result);
      }
    }, 60000);
  }

  function stop() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function buildDeathReason(waterOverdueDays, sunOverdueDays, agingPenalty) {
    if (waterOverdueDays > 0 && sunOverdueDays > 0) {
      return "falta de água e sol";
    }

    if (waterOverdueDays > 0) {
      return "falta de água";
    }

    if (sunOverdueDays > 0) {
      return "falta de sol";
    }

    if (agingPenalty > 0) {
      return "fim do ciclo de vida";
    }

    return "rotina de cuidados comprometida";
  }

  function buildHealthTone(vitality, isDead) {
    if (isDead) {
      return "is-dead";
    }

    if (vitality <= 35) {
      return "is-critical";
    }

    if (vitality <= 70) {
      return "is-warning";
    }

    return "is-good";
  }

  function buildHealthMessage(context) {
    const {
      agingPenalty,
      deathReason,
      isDead,
      sunOverdueDays,
      vitality,
      waterOverdueDays,
    } = context;

    if (isDead) {
      return `Sem sinais vitais por ${deathReason}.`;
    }

    if (waterOverdueDays > 0 && sunOverdueDays > 0) {
      return `Vitalidade caindo: ${waterOverdueDays} dia(s) sem água e ${sunOverdueDays} dia(s) sem sol.`;
    }

    if (waterOverdueDays > 0) {
      return `Vitalidade caindo por ${waterOverdueDays} dia(s) de atraso na rega.`;
    }

    if (sunOverdueDays > 0) {
      return `Vitalidade caindo por ${sunOverdueDays} dia(s) de atraso no sol.`;
    }

    if (agingPenalty > 0) {
      return "Ciclo avançado: acompanhe de perto a vitalidade.";
    }

    if (vitality >= 85) {
      return "Rotina em dia e vitalidade alta.";
    }

    return "Rotina estável, mas vale acompanhar os próximos cuidados.";
  }

  App.monitor = {
    getLifecycleSnapshot,
    start,
    stop,
    syncPlants,
  };
})();
