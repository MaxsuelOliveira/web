// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================

const API_BASE_URL = "http://localhost:3001";

const API_ENDPOINTS = {
  registerUser: `${API_BASE_URL}/api/users/register`,
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Aplicar tema ANTES do DOM renderizar
const themeFromStorage = localStorage.getItem("theme") || "light";
if (themeFromStorage === "dark") {
  document.documentElement.classList.add("dark-theme");
  document.body.classList.add("dark-theme");
}

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar tema
  inicializarTema();

  // Event listeners do formulário
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

// ============================================================================
// GERENCIAMENTO DE TEMA
// ============================================================================

function inicializarTema() {
  const tema = localStorage.getItem("theme") || "light";
  aplicarTema(tema);
  atualizarBotaoTema();

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", alternarTema);
  }
}

function aplicarTema(tema) {
  if (tema === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
  localStorage.setItem("theme", tema);
}

function alternarTema() {
  const temaAtual = localStorage.getItem("theme") || "light";
  const novoTema = temaAtual === "light" ? "dark" : "light";
  aplicarTema(novoTema);
  atualizarBotaoTema();
}

function atualizarBotaoTema() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const tema = localStorage.getItem("theme") || "light";
    themeToggle.textContent = tema === "dark" ? "☀️" : "🌙";
  }
}

// ============================================================================
// REGISTRO DE USUÁRIO
// ============================================================================

async function handleRegister(event) {
  event.preventDefault();

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const registerBtn = event.target.querySelector("button[type='submit']");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  // Validação básica
  if (!name || name.length < 3) {
    mostrarNotificacao("Nome deve ter no mínimo 3 caracteres", "warning");
    return;
  }

  // Desabilitar botão e mostrar spinner
  registerBtn.disabled = true;
  loadingSpinner.classList.remove("hidden");

  try {
    const response = await fetch(API_ENDPOINTS.registerUser, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        email: email || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao criar usuário");
    }

    const usuario = await response.json();

    // Salvar dados do usuário
    localStorage.setItem("userId", usuario.id);
    localStorage.setItem("userName", usuario.name);
    
    // Resetar progresso do splash screen
    localStorage.removeItem("splashSlide");

    mostrarNotificacao("Usuário criado com sucesso! ✓", "success");

    // Redirecionar para app.html após 1 segundo
    setTimeout(() => {
      window.location.href = "app.html";
    }, 1000);
  } catch (erro) {
    mostrarNotificacao("Erro ao criar usuário: " + erro.message, "error");
    registerBtn.disabled = false;
    loadingSpinner.classList.add("hidden");
  }
}

function voltarParaSplash() {
  window.location.href = "index.html";
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function mostrarNotificacao(mensagem, tipo = "info") {
  const notificationEl = document.getElementById("notification");
  notificationEl.textContent = mensagem;
  notificationEl.className = `notification notification-${tipo} show`;

  setTimeout(() => {
    notificationEl.classList.remove("show");
  }, 4000);
}
