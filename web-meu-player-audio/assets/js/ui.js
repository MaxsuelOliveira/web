import { formatTime } from "./utils.js";

function getTrackMood(track) {
  const genre = `${track?.genre ?? ""} ${track?.title ?? ""}`.toLowerCase();

  if (genre.includes("rock") || genre.includes("alt")) {
    return {
      palette: ["#7c91ff", "#5f6eff", "#11131d"],
      emojis: ["🎸", "⚡", "🎧", "🥁"],
    };
  }

  if (
    genre.includes("synth") ||
    genre.includes("electro") ||
    genre.includes("dance")
  ) {
    return {
      palette: ["#7ee7ff", "#7c91ff", "#131726"],
      emojis: ["🎹", "✨", "🪩", "🎛️"],
    };
  }

  if (genre.includes("pop")) {
    return {
      palette: ["#ffd38a", "#ff8ac7", "#16121f"],
      emojis: ["🎤", "💿", "🎶", "🌟"],
    };
  }

  return {
    palette: ["#86a0ff", "#79d2ff", "#11151d"],
    emojis: ["🎵", "🎼", "🎧", "✨"],
  };
}

function getSplashMood(slide) {
  const map = {
    intro: {
      palette: ["#86a0ff", "#7ed6ff", "#11151d"],
      emojis: ["🎵", "✨", "🎧", "🌌"],
    },
    project: {
      palette: ["#ffcf7c", "#ff8bc2", "#17131f"],
      emojis: ["🎛️", "💿", "🫧", "🎚️"],
    },
    start: {
      palette: ["#9fffae", "#86a0ff", "#10171a"],
      emojis: ["🚀", "🎶", "💫", "🔊"],
    },
  };

  return map[slide.art] ?? map.intro;
}

function renderArtworkVisual(mood) {
  return `
    <div class="cover-overlay"></div>
    <div class="cover-mask"></div>
    <div class="cover-stage">
      ${mood.emojis
        .map(
          (emoji, index) => `
            <span class="cover-emoji cover-emoji--${index + 1}">${emoji}</span>
          `,
        )
        .join("")}
      <div class="cover-soundwave" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
}

function setArtworkPalette(element, palette) {
  element.style.setProperty("--cover-accent", palette[0]);
  element.style.setProperty("--cover-secondary", palette[1]);
  element.style.setProperty("--cover-shadow", palette[2]);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeForStyle(value) {
  return escapeHtml(value).replaceAll("'", "%27");
}

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(value, query) {
  const text = String(value ?? "");
  const normalizedQuery = String(query ?? "").trim();

  if (!normalizedQuery) {
    return escapeHtml(text);
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  return escapeHtml(text).replace(
    matcher,
    '<mark class="library-highlight">$1</mark>',
  );
}

export function getUI() {
  const playButton = document.getElementById("play");
  const pauseButton = document.getElementById("pause");
  const nextButton = document.getElementById("forward");
  const previousButton = document.getElementById("backward");
  const repeatButton = document.getElementById("repeat-toggle");
  const progress = document.getElementById("player-slide");
  const currentTime = document.getElementById("time-player");
  const duration = document.getElementById("time-end");
  const muteButton = document.getElementById("mute-toggle");
  const onlineButton = document.getElementById("show-online");
  const localButton = document.getElementById("show-local");
  const openCreatePlaylistButton = document.getElementById(
    "open-create-playlist",
  );
  const openImportPlaylistButton = document.getElementById(
    "open-import-playlist",
  );
  const openLibraryScreenButton = document.getElementById(
    "open-library-screen",
  );
  const installAppButton = document.getElementById("install-app-button");

  const mobilePlayButton = document.getElementById("mobile-play");
  const mobilePauseButton = document.getElementById("mobile-pause");
  const mobileNextButton = document.getElementById("mobile-forward");
  const mobilePreviousButton = document.getElementById("mobile-backward");
  const mobileRepeatButton = document.getElementById("mobile-repeat-toggle");
  const mobileProgress = document.getElementById("mobile-player-slide");
  const mobileCurrentTime = document.getElementById("mobile-time-player");
  const mobileDuration = document.getElementById("mobile-time-end");
  const mobileMuteButton = document.getElementById("mobile-mute-toggle");
  const mobileOnlineButton = document.getElementById("mobile-show-online");
  const mobileLocalButton = document.getElementById("mobile-show-local");
  const mobileOpenCreatePlaylistButton = document.getElementById(
    "mobile-open-create-playlist",
  );
  const mobileOpenImportPlaylistButton = document.getElementById(
    "mobile-open-import-playlist",
  );
  const mobileOpenLibraryScreenButton = document.getElementById(
    "mobile-open-library-screen",
  );
  const mobileInstallAppButton = document.getElementById(
    "mobile-install-app-button",
  );

  return {
    splashscreen: document.getElementById("splashscreen"),
    splashArt: document.getElementById("splash-art"),
    splashEyebrow: document.getElementById("splash-eyebrow"),
    splashTitle: document.getElementById("splash-title"),
    splashCopy: document.getElementById("splash-copy"),
    splashDots: document.getElementById("splash-dots"),
    splashPrevButton: document.getElementById("splash-prev"),
    splashNextButton: document.getElementById("splash-next"),
    title: document.querySelector(".title"),
    artist: document.querySelector(".artist"),
    translation: document.getElementById("track-translation"),
    cover: document.querySelector(".cover-animation"),
    importPanel: document.querySelector(".import-panel"),
    playButton,
    pauseButton,
    nextButton,
    previousButton,
    repeatButton,
    repeatLabel: document.getElementById("repeat-state"),
    progress,
    currentTime,
    duration,
    muteButton,
    volumeSlider: document.getElementById("volume-slider"),
    onlineButton,
    localButton,
    localFileInput: document.getElementById("local-file-input"),
    localFolderInput: document.getElementById("local-folder-input"),
    playlistImportInput: document.getElementById("playlist-import-input"),
    libraryBackupInput: document.getElementById("library-backup-input"),
    openCreatePlaylistButton,
    openImportPlaylistButton,
    openLibraryScreenButton,
    installAppButton,
    mobileTrackContext: document.getElementById("mobile-track-context"),
    mobileTrackTitle: document.getElementById("mobile-track-title"),
    mobileTrackArtist: document.getElementById("mobile-track-artist"),
    playbackButtons: [playButton, mobilePlayButton].filter(Boolean),
    pauseButtons: [pauseButton, mobilePauseButton].filter(Boolean),
    nextButtons: [nextButton, mobileNextButton].filter(Boolean),
    previousButtons: [previousButton, mobilePreviousButton].filter(Boolean),
    repeatButtons: [repeatButton, mobileRepeatButton].filter(Boolean),
    progressInputs: [progress, mobileProgress].filter(Boolean),
    currentTimeLabels: [currentTime, mobileCurrentTime].filter(Boolean),
    durationLabels: [duration, mobileDuration].filter(Boolean),
    muteButtons: [muteButton, mobileMuteButton].filter(Boolean),
    onlineButtons: [onlineButton, mobileOnlineButton].filter(Boolean),
    localButtons: [localButton, mobileLocalButton].filter(Boolean),
    openCreatePlaylistButtons: [
      openCreatePlaylistButton,
      mobileOpenCreatePlaylistButton,
    ].filter(Boolean),
    openImportPlaylistButtons: [
      openImportPlaylistButton,
      mobileOpenImportPlaylistButton,
    ].filter(Boolean),
    openLibraryScreenButtons: [
      openLibraryScreenButton,
      mobileOpenLibraryScreenButton,
    ].filter(Boolean),
    installAppButtons: [installAppButton, mobileInstallAppButton].filter(
      Boolean,
    ),
    localSourceActions: document.getElementById("local-source-actions"),
    localSourcesEmpty: document.getElementById("local-sources-empty"),
    playlistBuilderStatus: document.getElementById("playlist-builder-status"),
    localSources: document.getElementById("local-sources"),
    localSourceCount: document.getElementById("local-source-count"),
    playlistTitle: document.getElementById("playlist-title"),
    playlistCount: document.getElementById("playlist-count"),
    playlist: document.getElementById("playlist"),
    emptyLocalMessage: document.getElementById("empty-local-message"),
    modalLayer: document.getElementById("modal-layer"),
    modalEyebrow: document.getElementById("modal-eyebrow"),
    modalTitle: document.getElementById("modal-title"),
    modalDescription: document.getElementById("modal-description"),
    modalContent: document.getElementById("modal-content"),
    modalPrimary: document.getElementById("modal-primary"),
    modalSecondary: document.getElementById("modal-secondary"),
    modalClose: document.getElementById("modal-close"),
    toastStack: document.getElementById("toast-stack"),
    libraryScreen: document.getElementById("library-screen"),
    libraryClose: document.getElementById("library-close"),
    libraryExportButton: document.getElementById("library-export-button"),
    libraryImportButton: document.getElementById("library-import-button"),
    librarySearchInput: document.getElementById("library-search-input"),
    librarySortSelect: document.getElementById("library-sort-select"),
    libraryFilters: document.getElementById("library-filters"),
    libraryGenreChips: document.getElementById("library-genre-chips"),
    libraryStats: document.getElementById("library-stats"),
    libraryResults: document.getElementById("library-results"),
    libraryResultsCount: document.getElementById("library-results-count"),
  };
}

export function renderSplashScreen(ui, slide, index, totalSlides) {
  if (!ui.splashArt) {
    return;
  }

  const mood = getSplashMood(slide);

  ui.splashArt.innerHTML = renderArtworkVisual(mood);
  setArtworkPalette(ui.splashArt, mood.palette);
  ui.splashEyebrow.textContent = slide.eyebrow;
  ui.splashTitle.textContent = slide.title;
  ui.splashCopy.textContent = slide.copy;
  ui.splashPrevButton.classList.toggle("is-hidden", index === 0);
  ui.splashNextButton.textContent =
    index === totalSlides - 1 ? "Vamos lá" : "Próximo";
  ui.splashDots.innerHTML = Array.from(
    { length: totalSlides },
    (_, dotIndex) => {
      const activeClass = dotIndex === index ? " is-active" : "";
      return `<span class="splashscreen__dot${activeClass}"></span>`;
    },
  ).join("");
}

export function renderTrack(ui, track, activeLibrary, options = {}) {
  const { isFavorite = false } = options;

  if (!track) {
    const mood = getTrackMood(null);

    ui.cover.innerHTML = renderArtworkVisual(mood);
    setArtworkPalette(ui.cover, mood.palette);
    ui.title.textContent = "Nenhuma faixa selecionada";
    ui.artist.textContent = "Escolha uma playlist ou importe arquivos locais";
    ui.translation.textContent =
      "Adicione uma playlist online ou importe seus arquivos para preencher este painel.";
    ui.mobileTrackContext &&
      (ui.mobileTrackContext.textContent =
        activeLibrary === "local" ? "Biblioteca local" : "Playlist online");
    ui.mobileTrackTitle &&
      (ui.mobileTrackTitle.textContent = "Nenhuma faixa selecionada");
    ui.mobileTrackArtist &&
      (ui.mobileTrackArtist.textContent = "Escolha uma faixa para tocar");
    return;
  }

  const mood = getTrackMood(track);

  ui.cover.innerHTML = renderArtworkVisual(mood);
  setArtworkPalette(ui.cover, mood.palette);
  ui.title.textContent = track.title;
  ui.artist.textContent = track.artist;
  ui.translation.textContent = `${track.translation} ${track.lyricsPreview}`;
  ui.mobileTrackContext &&
    (ui.mobileTrackContext.textContent =
      track.source === "youtube" ? "YouTube" : "Biblioteca local");
  ui.mobileTrackTitle && (ui.mobileTrackTitle.textContent = track.title);
  ui.mobileTrackArtist && (ui.mobileTrackArtist.textContent = track.artist);
  void activeLibrary;
  void isFavorite;
}

export function renderPlaylist(ui, tracks, currentIndex, options = {}) {
  const { favoriteTrackKeys = [], reorderable = false } = options;

  ui.playlist.innerHTML = tracks
    .map((track, index) => {
      const trackKey = track.trackKey ?? track.id;
      const isFavorite = favoriteTrackKeys.includes(trackKey);
      const dragHandle = reorderable
        ? `
            <span class="playlist-action playlist-action--drag" aria-hidden="true">
              <i class="fa-solid fa-grip-vertical"></i>
            </span>
          `
        : "";
      const editAction =
        track.source === "local" && track.storageId
          ? `
            <button class="playlist-action" type="button" data-track-action="edit-metadata" data-index="${index}" aria-label="Editar metadados">
              <i class="fa-solid fa-pen"></i>
            </button>
          `
          : "";

      return `
    <li>
      <article
        class="playlist-item ${index === currentIndex ? "is-active" : ""} ${reorderable ? "is-draggable" : ""}"
        data-index="${index}"
        ${reorderable ? `draggable="true" data-drag-index="${index}"` : ""}
      >
        <button class="playlist-item__main" type="button" data-track-select="true" data-index="${index}">
          <span class="playlist-cover" style="background-image: url('${escapeForStyle(track.cover)}')"></span>
          <span class="playlist-song">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.artist)}</span>
            <span>${escapeHtml(track.genre)}</span>
          </span>
        </button>
        <div class="playlist-side">
          <span class="playlist-meta">
            <span class="playlist-time">${track.source === "youtube" ? "YouTube" : "Local"}</span>
            <span class="playlist-eq" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </span>
          <div class="playlist-actions">
            <button class="playlist-action ${isFavorite ? "is-active" : ""}" type="button" data-track-action="toggle-favorite" data-index="${index}" aria-label="Favoritar faixa">
              <i class="fa-${isFavorite ? "solid" : "regular"} fa-star"></i>
            </button>
            ${editAction}
            ${dragHandle}
          </div>
        </div>
      </article>
    </li>
  `;
    })
    .join("");
}

export function renderLocalSources(
  ui,
  collections,
  activeSourceId,
  options = {},
) {
  if (!ui.localSources) {
    return;
  }

  const { hasContent = false, hasCustomCollections = false } = options;

  ui.localSources.innerHTML = collections
    .map((collection) => {
      const activeClass = collection.id === activeSourceId ? " is-active" : "";
      return `
        <button class="local-source-chip${activeClass}" type="button" data-source-id="${collection.id}">
          <span>${escapeHtml(collection.label)}</span>
          <strong>${collection.count}</strong>
        </button>
      `;
    })
    .join("");

  if (ui.localSourceCount) {
    ui.localSourceCount.textContent = `${collections.length} ${collections.length === 1 ? "coleção" : "coleções"}`;
  }

  ui.localSourcesEmpty?.classList.toggle(
    "is-hidden",
    hasContent || hasCustomCollections,
  );
}

export function renderLocalSourceActions(ui, actionButtons) {
  if (!ui.localSourceActions) {
    return;
  }

  ui.localSourceActions.innerHTML = actionButtons
    .map(
      (action) => `
        <button class="local-source-action" type="button" data-source-action="${action.action}">
          ${escapeHtml(action.label)}
        </button>
      `,
    )
    .join("");
}

export function renderPlaylistBuilderStatus(ui, message, tone = "neutral") {
  if (!ui.playlistBuilderStatus) {
    return;
  }

  ui.playlistBuilderStatus.textContent = message;
  ui.playlistBuilderStatus.dataset.tone = tone;
  ui.playlistBuilderStatus.classList.toggle("is-hidden", !message);
}

export function renderModal(ui, modal) {
  ui.modalLayer.classList.remove("is-hidden");
  ui.modalLayer.setAttribute("aria-hidden", "false");
  ui.modalEyebrow.textContent = modal.eyebrow ?? "Ação";
  ui.modalTitle.textContent = modal.title;
  ui.modalDescription.textContent = modal.description ?? "";
  ui.modalContent.innerHTML = modal.content;
  ui.modalPrimary.textContent = modal.primaryLabel ?? "Confirmar";
  ui.modalPrimary.dataset.modalAction = modal.primaryAction ?? "modal-confirm";
  ui.modalSecondary.textContent = modal.secondaryLabel ?? "Cancelar";
  ui.modalSecondary.dataset.modalAction =
    modal.secondaryAction ?? "modal-cancel";
  ui.modalSecondary.classList.toggle("is-hidden", !modal.secondaryLabel);
}

export function closeModal(ui) {
  ui.modalLayer.classList.add("is-hidden");
  ui.modalLayer.setAttribute("aria-hidden", "true");
  ui.modalContent.innerHTML = "";
  ui.modalPrimary.removeAttribute("data-modal-action");
  ui.modalSecondary.removeAttribute("data-modal-action");
}

export function pushToast(ui, toast) {
  if (!ui.toastStack) {
    return;
  }

  const element = document.createElement("article");
  element.className = "toast";
  element.dataset.tone = toast.tone ?? "neutral";
  element.innerHTML = `
    <strong>${escapeHtml(toast.title)}</strong>
    <p>${escapeHtml(toast.message)}</p>
  `;
  ui.toastStack.prepend(element);

  window.setTimeout(() => {
    element.remove();
  }, toast.duration ?? 3200);
}

export function renderLibraryScreen(ui, viewModel) {
  if (!ui.libraryScreen) {
    return;
  }

  const {
    visible = false,
    query = "",
    filters = [],
    activeFilter = "all",
    sortOptions = [],
    activeSort = "favorites",
    genres = [],
    activeGenre = "all",
    stats = [],
    results = [],
  } = viewModel;

  ui.libraryScreen.classList.toggle("is-hidden", !visible);
  ui.libraryScreen.setAttribute("aria-hidden", String(!visible));

  if (ui.librarySearchInput && ui.librarySearchInput.value !== query) {
    ui.librarySearchInput.value = query;
  }

  if (ui.libraryFilters) {
    ui.libraryFilters.innerHTML = filters
      .map(
        (filter) => `
          <button class="library-filter ${filter.id === activeFilter ? "is-active" : ""}" type="button" data-library-filter="${filter.id}">
            ${escapeHtml(filter.label)}
          </button>
        `,
      )
      .join("");
  }

  if (ui.librarySortSelect && ui.librarySortSelect.value !== activeSort) {
    if (sortOptions.length) {
      ui.librarySortSelect.innerHTML = sortOptions
        .map(
          (option) => `
            <option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>
          `,
        )
        .join("");
    }

    ui.librarySortSelect.value = activeSort;
  }

  if (ui.libraryGenreChips) {
    ui.libraryGenreChips.innerHTML = genres
      .map(
        (genre) => `
          <button class="library-genre-chip ${genre.id === activeGenre ? "is-active" : ""}" type="button" data-library-genre="${escapeHtml(genre.id)}">
            <span>${escapeHtml(genre.label)}</span>
            <strong>${escapeHtml(genre.count)}</strong>
          </button>
        `,
      )
      .join("");
  }

  if (ui.libraryStats) {
    ui.libraryStats.innerHTML = stats
      .map(
        (stat) => `
          <article class="library-stat-card">
            <span>${escapeHtml(stat.label)}</span>
            <strong>${escapeHtml(stat.value)}</strong>
            <p>${escapeHtml(stat.description)}</p>
          </article>
        `,
      )
      .join("");
  }

  if (ui.libraryResultsCount) {
    ui.libraryResultsCount.textContent = `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`;
  }

  if (ui.libraryResults) {
    ui.libraryResults.innerHTML = results.length
      ? results
          .map(
            (entry, index) => `
              <article class="library-card ${entry.isFavorite ? "is-favorite" : ""} ${entry.quickEditing ? "is-editing" : ""}">
                <div class="library-card__cover" style="background-image: url('${escapeForStyle(entry.track.cover)}')"></div>
                <div class="library-card__body">
                  <div class="library-card__eyebrow-row">
                    <span class="library-card__source">${escapeHtml(entry.track.source === "youtube" ? "YouTube" : "Local")}</span>
                    <span class="library-card__collection">${escapeHtml(entry.collectionLabel)}</span>
                  </div>
                  <h3>${highlightMatch(entry.track.title, query)}</h3>
                  <p>${highlightMatch(entry.track.artist, query)}</p>
                  <div class="library-card__tags">
                    <span>${highlightMatch(entry.track.genre, query)}</span>
                    <span>${escapeHtml(entry.track.album)}</span>
                    ${entry.isFavorite ? '<span class="library-card__favorite-pill">Favorita</span>' : ""}
                  </div>
                  ${
                    entry.quickEditing
                      ? `
                    <div class="library-quick-edit" data-storage-id="${escapeHtml(entry.track.storageId ?? "")}">
                      <label>
                        <span>Titulo</span>
                        <input type="text" data-quick-edit-field="title" value="${escapeHtml(entry.track.title)}" />
                      </label>
                      <label>
                        <span>Artista</span>
                        <input type="text" data-quick-edit-field="artist" value="${escapeHtml(entry.track.artist)}" />
                      </label>
                      <label>
                        <span>Album</span>
                        <input type="text" data-quick-edit-field="album" value="${escapeHtml(entry.track.album)}" />
                      </label>
                      <label>
                        <span>Genero</span>
                        <input type="text" data-quick-edit-field="genre" value="${escapeHtml(entry.track.genre)}" />
                      </label>
                      <div class="library-quick-edit__actions">
                        <button class="local-source-action" type="button" data-library-action="save-quick-edit" data-result-index="${index}">Salvar</button>
                        <button class="playlist-action" type="button" data-library-action="cancel-quick-edit" data-result-index="${index}" aria-label="Cancelar edição rápida">
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
                <div class="library-card__actions">
                  <button class="local-source-action" type="button" data-library-action="play" data-result-index="${index}">
                    Tocar
                  </button>
                  <button class="playlist-action ${entry.isFavorite ? "is-active" : ""}" type="button" data-library-action="toggle-favorite" data-result-index="${index}" aria-label="Favoritar faixa">
                    <i class="fa-${entry.isFavorite ? "solid" : "regular"} fa-star"></i>
                  </button>
                  ${
                    entry.editable
                      ? `
                    <button class="playlist-action" type="button" data-library-action="quick-edit" data-result-index="${index}" aria-label="Edição rápida">
                      <i class="fa-solid fa-sliders"></i>
                    </button>
                    <button class="playlist-action" type="button" data-library-action="edit-metadata" data-result-index="${index}" aria-label="Editar metadados">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="playlist-action playlist-action--danger" type="button" data-library-action="delete-track" data-result-index="${index}" aria-label="Excluir faixa local">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  `
                      : ""
                  }
                </div>
              </article>
            `,
          )
          .join("")
      : `
          <div class="library-results__empty">
            <strong>Nenhuma faixa encontrada</strong>
            <p>Refine a busca, troque o filtro ou marque algumas favoritas para montar uma nova seleção.</p>
          </div>
        `;
  }
}

export function focusLibrarySearch(ui) {
  ui.librarySearchInput?.focus();
  ui.librarySearchInput?.select();
}

export function setInstallButtonVisible(ui, visible) {
  ui.installAppButtons?.forEach((button) => {
    button.classList.toggle("is-hidden", !visible);
  });
}

export function setPlaybackState(ui, isPlaying) {
  ui.playbackButtons.forEach((button) => {
    button.classList.toggle("is-hidden", isPlaying);
  });
  ui.pauseButtons.forEach((button) => {
    button.classList.toggle("is-hidden", !isPlaying);
  });
}

export function updateProgress(ui, currentTime, duration) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime =
    Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
  const progressValue = safeDuration
    ? (safeCurrentTime / safeDuration) * 100
    : 0;

  ui.progressInputs.forEach((input) => {
    input.value = progressValue;
  });
  ui.currentTimeLabels.forEach((label) => {
    label.textContent = formatTime(safeCurrentTime);
  });
  ui.durationLabels.forEach((label) => {
    label.textContent = formatTime(safeDuration);
  });
}

export function renderLibraryState(
  ui,
  activeLibrary,
  totalTracks,
  options = {},
) {
  const isOnline = activeLibrary === "online";
  const {
    hasAnyLocalContent = false,
    playlistHeading = isOnline ? "Playlist online" : "Biblioteca local",
  } = options;

  ui.onlineButtons.forEach((button) => {
    button.classList.toggle("is-active", isOnline);
  });
  ui.localButtons.forEach((button) => {
    button.classList.toggle("is-active", !isOnline);
  });
  ui.playlistTitle.textContent = playlistHeading;
  ui.playlistCount.textContent = `${totalTracks} ${totalTracks === 1 ? "faixa" : "faixas"}`;
  if (ui.mobileTrackContext && !ui.mobileTrackTitle?.textContent?.trim()) {
    ui.mobileTrackContext.textContent = playlistHeading;
  }
  ui.emptyLocalMessage.classList.toggle(
    "is-hidden",
    isOnline || hasAnyLocalContent,
  );
}

export function renderRepeatState(ui, repeatMode) {
  const labels = {
    all: "Repetir tudo",
    one: "Repetir faixa",
    off: "Sem repeticao",
  };

  ui.repeatLabel.textContent = labels[repeatMode];
  ui.repeatButtons.forEach((button) => {
    button.setAttribute("aria-label", labels[repeatMode]);
    button.setAttribute("title", labels[repeatMode]);
  });
}

export function setVolumeIcon(ui, isMuted, volume) {
  const iconClass =
    isMuted || volume === 0
      ? "fa-solid fa-volume-xmark"
      : volume < 40
        ? "fa-solid fa-volume-low"
        : "fa-solid fa-volume-high";

  ui.muteButtons.forEach((button) => {
    const icon = button.querySelector("i");

    if (icon) {
      icon.className = iconClass;
    }
  });
}

export function setThemeButtonState(ui, theme) {
  void ui;
  void theme;
}

export function setVariantState(ui, variant) {
  void ui;
  void variant;
}
