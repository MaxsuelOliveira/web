(() => {
  const App = window.PlantApp;
  const SESSION_DURATION_MS = 7 * App.utils.DAY_IN_MS;

  function getUsers() {
    const users = App.store.loadJson(App.keys.users, []);
    return Array.isArray(users) ? users.map(ensureUserShape) : [];
  }

  function saveUsers(users) {
    App.store.saveJson(App.keys.users, users.map(ensureUserShape));
  }

  function ensureUserShape(user) {
    return {
      ...user,
      settings: {
        notificationsEnabled: false,
        theme: "light",
        ...(user.settings || {}),
      },
      gamification: user.gamification || createGamificationSeed(),
    };
  }

  function getSession() {
    const session = App.store.loadJson(App.keys.session, null);
    if (!session || typeof session !== "object") {
      return null;
    }

    const loggedAt = new Date(session.loggedAt || 0).getTime();
    const expiresAt = session.expiresAt
      ? new Date(session.expiresAt).getTime()
      : loggedAt + SESSION_DURATION_MS;

    if (!session.userId || !loggedAt || Number.isNaN(expiresAt)) {
      clearSession();
      return null;
    }

    if (Date.now() >= expiresAt) {
      clearSession();
      return null;
    }

    return {
      ...session,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  function setSession(userId) {
    const loggedAt = new Date();
    App.store.saveJson(App.keys.session, {
      userId,
      loggedAt: loggedAt.toISOString(),
      expiresAt: new Date(
        loggedAt.getTime() + SESSION_DURATION_MS,
      ).toISOString(),
    });
  }

  function clearSession() {
    localStorage.removeItem(App.keys.session);
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session?.userId) {
      return null;
    }

    return getUsers().find((user) => user.id === session.userId) || null;
  }

  function updateCurrentUser(updater) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const users = getUsers();
    const updatedUser = updater({ ...currentUser });
    const nextUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user,
    );
    saveUsers(nextUsers);
    return updatedUser;
  }

  function createGamificationSeed() {
    return {
      xp: 25,
      level: 1,
      coins: 15,
      streak: 1,
      careActions: 0,
      achievements: ["🌿 Conta criada"],
      lastActivityDate: App.utils.today(),
    };
  }

  function register({ name, email, password }) {
    const safeName = App.utils.normalizeText(name);
    const safeEmail = App.utils.normalizeText(email).toLowerCase();
    const safePassword = String(password || "").trim();

    if (!safeName || !safeEmail || !safePassword) {
      throw new Error("Preencha todos os campos da conta.");
    }

    const users = getUsers();
    if (users.some((user) => user.email === safeEmail)) {
      throw new Error("Ja existe uma conta cadastrada com este e-mail.");
    }

    const user = {
      id: App.utils.createId(),
      name: safeName,
      email: safeEmail,
      password: safePassword,
      createdAt: new Date().toISOString(),
      settings: {
        notificationsEnabled: false,
        theme: "light",
      },
      gamification: createGamificationSeed(),
    };

    users.push(user);
    saveUsers(users);
    setSession(user.id);
    App.store.savePlants(user.id, App.store.createSeededPlants());
    return user;
  }

  function login({ email, password }) {
    const safeEmail = App.utils.normalizeText(email).toLowerCase();
    const safePassword = String(password || "").trim();

    const user = getUsers().find(
      (entry) => entry.email === safeEmail && entry.password === safePassword,
    );

    if (!user) {
      throw new Error("Conta não encontrada. Verifique e-mail e senha.");
    }

    setSession(user.id);
    return user;
  }

  function logout() {
    clearSession();
    window.location.href = "index.html";
  }

  function requireAuth() {
    if (!getCurrentUser()) {
      window.location.href = "index.html";
      return false;
    }

    return true;
  }

  function redirectAuthenticated() {
    if (getCurrentUser()) {
      window.location.href = "app.html";
      return true;
    }

    return false;
  }

  App.auth = {
    clearSession,
    getCurrentUser,
    getSession,
    getUsers,
    login,
    logout,
    redirectAuthenticated,
    register,
    requireAuth,
    saveUsers,
    updateCurrentUser,
  };
})();
