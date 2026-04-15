// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================

// Endpoints não usados nesta página (splash screen)
// A lógica de registro é feita no register.js

// ============================================================================
// ESTADO DA APLICAÇÃO
// ============================================================================

let appState = {
  userId: localStorage.getItem("userId"),
  userName: localStorage.getItem("userName"),
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
  const userId = localStorage.getItem("userId");

  if (userId) {
    // Se tem usuário logado, redireciona para app.html
    window.location.href = "app.html";
  }

  // Carregar o slide em que o usuário parou
  const savedSlide = localStorage.getItem("splashSlide") || 1;
  mostrarSlide(parseInt(savedSlide));

  // Definir elementos
  const entrarBtn = document.getElementById("entrarBtn");

  // Inicializar tema
  inicializarTema();

  // Click do botão para entrar sem criar usuário
  if (entrarBtn) {
    entrarBtn.addEventListener("click", irParaApp);
  }
});

// ============================================================================
// SPLASH SCREEN
// ============================================================================

let currentSlide = 1;

function proximoSlide() {
  document.getElementById(`slide${currentSlide}`).classList.add("hidden");
  currentSlide++;
  mostrarSlide(currentSlide);
}

function mostrarSlide(slideNum) {
  // Ocultar slide atual
  document.getElementById(`slide${currentSlide}`).classList.add("hidden");
  
  // Mostrar novo slide
  currentSlide = slideNum;
  document.getElementById(`slide${currentSlide}`).classList.remove("hidden");
  
  // Salvar progresso no localStorage
  localStorage.setItem("splashSlide", currentSlide);
}

function irParaApp() {
  // Resetar progresso do splash screen
  localStorage.removeItem("splashSlide");
  // Vai para app.html sem criar usuário (como convidado)
  window.location.href = "app.html";
}

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
