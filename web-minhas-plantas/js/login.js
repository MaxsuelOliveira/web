(() => {
  const App = window.PlantApp;
  const state = { activeTab: "login" };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (App.auth.redirectAuthenticated()) {
      return;
    }

    bindEvents();
    renderTabState();
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
  }

  function handleClick(event) {
    const tab = event.target.closest("[data-auth-tab]");
    if (!tab) {
      return;
    }

    state.activeTab = tab.dataset.authTab;
    setFeedback("");
    renderTabState();
  }

  function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    event.preventDefault();

    try {
      if (form.id === "login-form") {
        const data = new FormData(form);
        App.auth.login({
          email: data.get("email"),
          password: data.get("password"),
        });
        window.location.href = "app.html";
        return;
      }

      if (form.id === "signup-form") {
        const data = new FormData(form);
        const password = String(data.get("password") || "");
        const passwordConfirm = String(data.get("passwordConfirm") || "");

        if (password !== passwordConfirm) {
          throw new Error("As senhas precisam ser iguais para criar a conta.");
        }

        App.auth.register({
          name: data.get("name"),
          email: data.get("email"),
          password,
        });
        window.location.href = "app.html";
      }
    } catch (error) {
      setFeedback(
        error.message || "Não foi possível concluir a autenticação.",
        true,
      );
    }
  }

  function renderTabState() {
    const loginForm = document.querySelector("#login-form");
    const signupForm = document.querySelector("#signup-form");
    const tabs = Array.from(document.querySelectorAll(".auth-tab"));

    tabs.forEach((tab) => {
      tab.classList.toggle(
        "is-active",
        tab.dataset.authTab === state.activeTab,
      );
    });

    loginForm?.classList.toggle("is-hidden", state.activeTab !== "login");
    signupForm?.classList.toggle("is-hidden", state.activeTab !== "signup");
  }

  function setFeedback(message, isError = false) {
    const feedback = document.querySelector("#auth-feedback");
    if (!feedback) {
      return;
    }

    feedback.textContent = message;
    feedback.classList.toggle("is-error", Boolean(message) && isError);
    feedback.classList.toggle("is-visible", Boolean(message));
  }
})();
