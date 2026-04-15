export class InteractionService {
  static setupUserInfo(userName, userId) {
    const userNameEl = document.getElementById("userName");
    const userIdEl = document.getElementById("userId");

    if (userNameEl) userNameEl.textContent = userName || "Desconhecido";
    if (userIdEl) {
      if (userId) {
        userIdEl.textContent = `ID: ${userId.slice(0, 8)}...`;
      } else {
        userIdEl.textContent = "Sem usuário";
      }
    }
  }

  static setupResultCardInteractions(conversionCtrl) {
    const resultCards = document.querySelectorAll(".result-card");

    resultCards.forEach((card) => {
      const input = card.querySelector(".result-input");

      if (input) {
        card.addEventListener("mouseenter", () => {
          input.focus();
          card.classList.add("active");
        });

        card.addEventListener("mouseleave", () => {
          input.blur();
          card.classList.remove("active");
        });

        input.addEventListener("focus", () => {
          card.classList.add("active");
        });

        input.addEventListener("blur", () => {
          card.classList.remove("active");
        });

        input.addEventListener("input", () => {
          const changeEvent = new Event("change", { bubbles: true });
          input.dispatchEvent(changeEvent);
        });
      }
    });
  }

  static setupSaveButton(salvarBtn, onSave) {
    if (salvarBtn) {
      salvarBtn.addEventListener("click", onSave);
    }
  }

  static setupExportButton(exportBtn, onExport) {
    if (exportBtn) {
      exportBtn.addEventListener("click", onExport);
    }
  }
}

export default InteractionService;
