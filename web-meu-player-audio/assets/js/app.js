import { AudioPlayer } from "./audio-player.js";
import {
  createYouTubePlaylist,
  fetchOnlineTracks,
  parseImportedPlaylists,
} from "./catalog.js";
import {
  deletePersistedAudioFile,
  loadPersistedAudioFiles,
  persistAudioFiles,
  replacePersistedAudioFiles,
} from "./local-library-db.js";
import {
  closeModal,
  focusLibrarySearch,
  getUI,
  pushToast,
  renderLibraryScreen,
  renderLibraryState,
  renderLocalSourceActions,
  renderLocalSources,
  renderModal,
  renderPlaylist,
  renderPlaylistBuilderStatus,
  renderRepeatState,
  renderSplashScreen,
  renderTrack,
  setInstallButtonVisible,
  setPlaybackState,
  setVolumeIcon,
  updateProgress,
} from "./ui.js";
import {
  buildPersistedLocalTrack,
  buildPersistedRecordFromTrack,
  clamp,
  createDetachedAudio,
  createStorageKey,
  createYouTubeWatchUrl,
  downloadJsonFile,
  duplicatePlaylist,
  getTrackKey,
  moveArrayItem,
  parseLibraryBackup,
  revokeTrackUrls,
  serializeLibraryBackup,
  serializePlaylistForExport,
} from "./utils.js";
import { YouTubePlayer } from "./youtube-player.js";

const repeatModes = ["all", "one", "off"];
const SPLASH_VERSION = "3";
const libraryFilters = [
  { id: "all", label: "Tudo" },
  { id: "favorites", label: "Favoritas" },
  { id: "online", label: "Online" },
  { id: "local", label: "Locais" },
  { id: "playlists", label: "Playlists" },
];
const librarySortOptions = [
  { id: "favorites", label: "Favoritas primeiro" },
  { id: "title-asc", label: "Titulo A-Z" },
  { id: "title-desc", label: "Titulo Z-A" },
  { id: "artist-asc", label: "Artista A-Z" },
  { id: "recent-local", label: "Locais recentes" },
];
const splashSlides = [
  {
    art: "intro",
    eyebrow: "Boas-vindas",
    title: "Seu player agora tem abertura premium.",
    copy: "Três passos rápidos para apresentar a experiência antes da primeira reprodução, com o mesmo universo visual do hero principal.",
  },
  {
    art: "project",
    eyebrow: "O projeto",
    title: "HTML, CSS e JS puros. Só que bem resolvidos.",
    copy: "O player mistura catálogo online, biblioteca local, PWA instalável e playlists próprias sem framework.",
  },
  {
    art: "start",
    eyebrow: "Pronto",
    title: "Tudo certo. Vamos lá.",
    copy: "Entre no player, importe suas faixas, crie playlists do YouTube e organize sua curadoria com o visual do player.",
  },
];

const storageKeys = {
  volume: createStorageKey("volume"),
  muted: createStorageKey("muted"),
  repeatMode: createStorageKey("repeat-mode"),
  activeLibrary: createStorageKey("active-library"),
  currentTrackId: createStorageKey("current-track-id"),
  splashSeenVersion: createStorageKey("splash-seen-version"),
  userPlaylists: createStorageKey("user-playlists"),
  activeLocalSource: createStorageKey("active-local-source"),
  favoriteTrackKeys: createStorageKey("favorite-track-keys"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatBackupFileName() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `meu-player-audio-backup-${stamp}.json`;
}

function getAudioFilesFromList(fileList) {
  return Array.from(fileList ?? []).filter((file) => {
    if (String(file.type ?? "").startsWith("audio/")) {
      return true;
    }

    return /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name ?? "");
  });
}

export async function createPlayerApp() {
  const ui = getUI();
  const audioPlayer = new AudioPlayer(createDetachedAudio());
  const youtubePlayer = new YouTubePlayer("youtube-player");

  const state = {
    onlineTracks: [],
    uploadedTracks: [],
    userPlaylists: [],
    activeLibrary: "online",
    activeLocalSource: "uploads",
    currentIndex: 0,
    repeatMode: "all",
    isPlaying: false,
    trackPrepared: false,
    volume: 85,
    isMuted: false,
    splashSeen: false,
    splashIndex: 0,
    modal: null,
    deferredInstallPrompt: null,
    favoriteTrackKeys: [],
    libraryScreenOpen: false,
    libraryFilter: "all",
    librarySort: "favorites",
    libraryGenre: "all",
    libraryQuery: "",
    libraryResults: [],
    draggedTrackIndex: null,
    quickEditStorageId: null,
    pendingLibraryBackup: null,
  };

  hydrateStateFromStorage();
  bindPlayerEvents();
  bindUiEvents();
  bindPwaEvents();
  renderSplashState();
  setVolume();
  renderPlaylistBuilderStatus(ui, "");

  state.uploadedTracks = await loadUploadedTracks();
  state.onlineTracks = await fetchOnlineTracks();
  normalizeLocalState();
  restoreCurrentIndex();
  await renderCurrentLibrary({ autoplay: false });

  function bindPlayerEvents() {
    audioPlayer.onProgress = ({ currentTime, duration }) => {
      if (getCurrentTrack()?.source === "local") {
        updateProgress(ui, currentTime, duration);
      }
    };

    youtubePlayer.onProgress = ({ currentTime, duration }) => {
      if (getCurrentTrack()?.source === "youtube") {
        updateProgress(ui, currentTime, duration);
      }
    };

    audioPlayer.onEnded = () => handleTrackEnded();
    youtubePlayer.onEnded = () => handleTrackEnded();

    audioPlayer.onPlaybackChange = (isPlaying) => {
      if (getCurrentTrack()?.source !== "local") {
        return;
      }

      state.isPlaying = isPlaying;
      setPlaybackState(ui, isPlaying);
    };

    youtubePlayer.onPlaybackChange = (isPlaying) => {
      if (getCurrentTrack()?.source !== "youtube") {
        return;
      }

      state.isPlaying = isPlaying;
      setPlaybackState(ui, isPlaying);
    };
  }

  function bindUiEvents() {
    const bindClick = (elements, handler) => {
      elements.forEach((element) => {
        element?.addEventListener("click", handler);
      });
    };

    bindClick(ui.playbackButtons, () => {
      playCurrentTrack();
    });

    bindClick(ui.pauseButtons, () => {
      pauseCurrentTrack();
    });

    bindClick(ui.nextButtons, () => {
      changeTrack(1, true);
    });

    bindClick(ui.previousButtons, () => {
      changeTrack(-1, true);
    });

    bindClick(ui.repeatButtons, () => {
      const nextIndex =
        (repeatModes.indexOf(state.repeatMode) + 1) % repeatModes.length;
      state.repeatMode = repeatModes[nextIndex];
      renderRepeatState(ui, state.repeatMode);
      persistState();
    });

    ui.progressInputs.forEach((input) => {
      input.addEventListener("input", (event) => {
        const activePlayer = getActivePlayer();

        if (!activePlayer) {
          return;
        }

        const duration = activePlayer.getDuration();
        const targetTime = (Number(event.target.value) / 100) * duration;
        activePlayer.seekTo(targetTime);
        updateProgress(ui, targetTime, duration);
      });
    });

    ui.volumeSlider.addEventListener("input", () => {
      state.volume = Number(ui.volumeSlider.value);
      state.isMuted = state.volume === 0;
      setVolume();
    });

    bindClick(ui.muteButtons, () => {
      state.isMuted = !state.isMuted;
      setVolume();
    });

    ui.onlineButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        await switchLibrary("online");
      });
    });

    ui.localButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        await switchLibrary("local");
      });
    });

    ui.splashPrevButton?.addEventListener("click", () => {
      state.splashIndex = clamp(
        state.splashIndex - 1,
        0,
        splashSlides.length - 1,
      );
      renderSplashState();
    });

    ui.splashNextButton?.addEventListener("click", () => {
      if (state.splashIndex >= splashSlides.length - 1) {
        state.splashSeen = true;
        persistState();
        syncSplashscreen();
        return;
      }

      state.splashIndex += 1;
      renderSplashState();
    });

    ui.localFileInput?.addEventListener("change", async (event) => {
      await importLocalFiles(event.target.files);
      event.target.value = "";
    });

    ui.localFolderInput?.addEventListener("change", async (event) => {
      await importLocalFiles(event.target.files, { sourceLabel: "pasta" });
      event.target.value = "";
    });

    ui.playlistImportInput?.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files ?? []);

      if (file) {
        await importStoredPlaylists(file);
      }

      event.target.value = "";
    });

    ui.libraryBackupInput?.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files ?? []);

      if (file) {
        await previewLibraryBackup(file);
      }

      event.target.value = "";
    });

    bindClick(ui.openCreatePlaylistButtons, () => {
      openCreatePlaylistModal();
    });

    bindClick(ui.openImportPlaylistButtons, () => {
      openImportPlaylistModal();
    });

    bindClick(ui.openLibraryScreenButtons, () => {
      openLibraryScreen();
    });

    ui.installAppButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        await installPwa();
      });
    });

    ui.libraryClose?.addEventListener("click", () => {
      closeLibraryScreen();
    });

    ui.libraryScreen?.addEventListener("click", (event) => {
      if (event.target.closest("[data-library-close='true']")) {
        closeLibraryScreen();
      }
    });

    ui.librarySearchInput?.addEventListener("input", (event) => {
      state.libraryQuery = event.target.value;
      renderLibraryScreenState();
    });

    ui.libraryFilters?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-library-filter]");

      if (!trigger) {
        return;
      }

      state.libraryFilter = trigger.dataset.libraryFilter;
      state.libraryGenre = "all";
      renderLibraryScreenState();
    });

    ui.librarySortSelect?.addEventListener("change", (event) => {
      state.librarySort = event.target.value;
      renderLibraryScreenState();
    });

    ui.libraryGenreChips?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-library-genre]");

      if (!trigger) {
        return;
      }

      state.libraryGenre = trigger.dataset.libraryGenre;
      renderLibraryScreenState();
    });

    ui.libraryResults?.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-library-action]");

      if (!trigger) {
        return;
      }

      const entry = state.libraryResults[Number(trigger.dataset.resultIndex)];

      if (!entry) {
        return;
      }

      if (trigger.dataset.libraryAction === "play") {
        await playLibraryEntry(entry);
        return;
      }

      if (trigger.dataset.libraryAction === "toggle-favorite") {
        toggleTrackFavorite(entry.track);
        return;
      }

      if (trigger.dataset.libraryAction === "quick-edit") {
        state.quickEditStorageId =
          state.quickEditStorageId === entry.track.storageId
            ? null
            : entry.track.storageId;
        renderLibraryScreenState();
        return;
      }

      if (trigger.dataset.libraryAction === "cancel-quick-edit") {
        state.quickEditStorageId = null;
        renderLibraryScreenState();
        return;
      }

      if (trigger.dataset.libraryAction === "save-quick-edit") {
        await saveQuickEditFromEntry(entry);
        return;
      }

      if (trigger.dataset.libraryAction === "edit-metadata") {
        openEditTrackModal(entry.track);
        return;
      }

      if (trigger.dataset.libraryAction === "delete-track") {
        openDeleteTrackModal(entry.track);
      }
    });

    ui.libraryExportButton?.addEventListener("click", async () => {
      await exportLibraryBackup();
    });

    ui.libraryImportButton?.addEventListener("click", () => {
      ui.libraryBackupInput?.click();
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      ui.importPanel?.addEventListener(eventName, (event) => {
        event.preventDefault();
        ui.importPanel.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      ui.importPanel?.addEventListener(eventName, (event) => {
        event.preventDefault();
        ui.importPanel.classList.remove("is-dragover");
      });
    });

    ui.importPanel?.addEventListener("drop", async (event) => {
      await importLocalFiles(event.dataTransfer?.files);
    });

    ui.playlist.addEventListener("click", async (event) => {
      const actionTrigger = event.target.closest("[data-track-action]");

      if (actionTrigger) {
        const track = getTracks()[Number(actionTrigger.dataset.index)] ?? null;

        if (!track) {
          return;
        }

        if (actionTrigger.dataset.trackAction === "toggle-favorite") {
          toggleTrackFavorite(track);
          return;
        }

        if (actionTrigger.dataset.trackAction === "edit-metadata") {
          openEditTrackModal(track);
        }

        return;
      }

      const trigger = event.target.closest("[data-track-select='true']");

      if (!trigger) {
        return;
      }

      state.currentIndex = Number(trigger.dataset.index);
      persistState();
      await loadCurrentTrack({ autoplay: true });
    });

    ui.playlist.addEventListener("dragstart", (event) => {
      const trigger = event.target.closest("[data-drag-index]");

      if (!trigger || !canReorderActiveSource()) {
        return;
      }

      state.draggedTrackIndex = Number(trigger.dataset.dragIndex);
      trigger.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", trigger.dataset.dragIndex);
    });

    ui.playlist.addEventListener("dragover", (event) => {
      const trigger = event.target.closest("[data-drag-index]");

      if (!trigger || state.draggedTrackIndex === null) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      ui.playlist
        .querySelectorAll(".playlist-item.is-drop-target")
        .forEach((item) => item.classList.remove("is-drop-target"));
      trigger.classList.add("is-drop-target");
    });

    ui.playlist.addEventListener("drop", async (event) => {
      const trigger = event.target.closest("[data-drag-index]");

      if (!trigger || state.draggedTrackIndex === null) {
        return;
      }

      event.preventDefault();
      await reorderActiveCollection(
        state.draggedTrackIndex,
        Number(trigger.dataset.dragIndex),
      );
      cleanupDragState();
    });

    ui.playlist.addEventListener("dragend", () => {
      cleanupDragState();
    });

    ui.localSources?.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-source-id]");

      if (!trigger) {
        return;
      }

      state.activeLocalSource = trigger.dataset.sourceId;
      state.activeLibrary = "local";
      state.currentIndex = 0;
      state.trackPrepared = false;
      persistState();
      await renderCurrentLibrary({ autoplay: false });
    });

    ui.localSourceActions?.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-source-action]");

      if (!trigger) {
        return;
      }

      await handleSourceAction(trigger.dataset.sourceAction);
    });

    ui.modalClose?.addEventListener("click", () => {
      hideModal();
    });

    ui.modalLayer?.addEventListener("click", async (event) => {
      const closeTrigger = event.target.closest("[data-modal-close]");
      const actionTrigger = event.target.closest("[data-modal-action]");

      if (closeTrigger) {
        hideModal();
        return;
      }

      if (!actionTrigger) {
        return;
      }

      await handleModalAction(actionTrigger.dataset.modalAction);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.modal) {
        hideModal();
        return;
      }

      if (event.key === "Escape" && state.libraryScreenOpen) {
        closeLibraryScreen();
      }
    });
  }

  function bindPwaEvents() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      setInstallButtonVisible(ui, true);
      pushToast(ui, {
        title: "App instalável",
        message: "O player já pode ser instalado no seu dispositivo.",
      });
    });

    window.addEventListener("appinstalled", () => {
      state.deferredInstallPrompt = null;
      setInstallButtonVisible(ui, false);
      pushToast(ui, {
        title: "Instalado",
        message: "O player foi instalado com sucesso.",
        tone: "success",
      });
    });
  }

  async function installPwa() {
    if (!state.deferredInstallPrompt) {
      pushToast(ui, {
        title: "Instalação indisponível",
        message:
          "O navegador ainda não liberou o prompt de instalação nesta sessão.",
      });
      return;
    }

    await state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    setInstallButtonVisible(ui, false);
  }

  async function loadUploadedTracks() {
    try {
      const persistedRecords = await loadPersistedAudioFiles();
      return persistedRecords.map((record, index) =>
        buildPersistedLocalTrack(record, index),
      );
    } catch {
      pushToast(ui, {
        title: "Biblioteca local",
        message:
          "Não foi possível ler o IndexedDB. O player seguirá sem a biblioteca persistida.",
        tone: "error",
      });
      return [];
    }
  }

  function getLocalCollections() {
    return [
      {
        id: "uploads",
        label: "Arquivos locais",
        count: state.uploadedTracks.length,
      },
      {
        id: "favorites",
        label: "Favoritas",
        count: getFavoriteEntries().length,
      },
      ...state.userPlaylists.map((playlist) => ({
        id: `playlist:${playlist.id}`,
        label: playlist.name,
        count: playlist.tracks.length,
      })),
    ];
  }

  function getPlaylistBySourceId(sourceId = state.activeLocalSource) {
    if (!sourceId || sourceId === "uploads" || sourceId === "favorites") {
      return null;
    }

    const playlistId = sourceId.replace("playlist:", "");
    return (
      state.userPlaylists.find((playlist) => playlist.id === playlistId) ?? null
    );
  }

  function buildLibraryEntries() {
    const uploadEntries = state.uploadedTracks.map((track, index) => ({
      track: { ...track, trackKey: getTrackKey(track) },
      index,
      library: "local",
      sourceId: "uploads",
      collectionLabel: "Arquivos locais",
      editable: true,
    }));

    const playlistEntries = state.userPlaylists.flatMap((playlist) =>
      playlist.tracks.map((track, index) => ({
        track: { ...track, trackKey: getTrackKey(track) },
        index,
        library: "local",
        sourceId: `playlist:${playlist.id}`,
        collectionLabel: playlist.name,
        editable: false,
      })),
    );

    const onlineEntries = state.onlineTracks.map((track, index) => ({
      track: { ...track, trackKey: getTrackKey(track) },
      index,
      library: "online",
      sourceId: "online",
      collectionLabel: "Playlist online",
      editable: false,
    }));

    return [...uploadEntries, ...playlistEntries, ...onlineEntries];
  }

  function getFavoriteEntries() {
    const dedupedEntries = new Map();

    buildLibraryEntries().forEach((entry) => {
      if (!isTrackFavorite(entry.track)) {
        return;
      }

      if (!dedupedEntries.has(entry.track.trackKey)) {
        dedupedEntries.set(entry.track.trackKey, entry);
      }
    });

    return Array.from(dedupedEntries.values());
  }

  function getActiveLocalTracks() {
    if (state.activeLocalSource === "favorites") {
      return getFavoriteEntries().map((entry) => entry.track);
    }

    if (state.activeLocalSource === "uploads") {
      return state.uploadedTracks;
    }

    return getPlaylistBySourceId()?.tracks ?? [];
  }

  function getTracks() {
    return state.activeLibrary === "online"
      ? state.onlineTracks
      : getActiveLocalTracks();
  }

  function getCurrentTrack() {
    const track = getTracks()[state.currentIndex] ?? null;

    if (!track) {
      return null;
    }

    return {
      ...track,
      trackKey: getTrackKey(track),
    };
  }

  function getActivePlayer() {
    const currentTrack = getCurrentTrack();

    if (!currentTrack) {
      return null;
    }

    return currentTrack.source === "youtube" ? youtubePlayer : audioPlayer;
  }

  function getLocalHeading() {
    if (state.activeLocalSource === "favorites") {
      return "Favoritas";
    }

    if (state.activeLocalSource === "uploads") {
      return "Arquivos locais";
    }

    return getPlaylistBySourceId()?.name ?? "Playlist local";
  }

  function hasAnyLocalContent() {
    return (
      state.uploadedTracks.length > 0 ||
      state.userPlaylists.some((playlist) => playlist.tracks.length > 0) ||
      state.favoriteTrackKeys.length > 0
    );
  }

  function isTrackFavorite(track) {
    return state.favoriteTrackKeys.includes(getTrackKey(track));
  }

  function normalizeLocalState() {
    if (
      state.activeLocalSource.startsWith("playlist:") &&
      !getPlaylistBySourceId(state.activeLocalSource)
    ) {
      const firstPlaylist = state.userPlaylists.find(
        (playlist) => playlist.tracks.length > 0,
      );
      state.activeLocalSource = firstPlaylist
        ? `playlist:${firstPlaylist.id}`
        : "uploads";
    }

    if (
      state.activeLocalSource === "favorites" &&
      getFavoriteEntries().length === 0
    ) {
      const firstPlaylist = state.userPlaylists.find(
        (playlist) => playlist.tracks.length > 0,
      );
      state.activeLocalSource = firstPlaylist
        ? `playlist:${firstPlaylist.id}`
        : "uploads";
    }

    if (state.activeLibrary === "local" && !hasAnyLocalContent()) {
      state.activeLibrary = "online";
    }
  }

  function getLocalActionButtons() {
    if (state.activeLocalSource === "favorites") {
      return [];
    }

    const playlist = getPlaylistBySourceId();

    if (!playlist) {
      return state.uploadedTracks.length
        ? [{ action: "clear-uploads", label: "Limpar uploads" }]
        : [];
    }

    return [
      { action: "edit-playlist", label: "Editar" },
      { action: "duplicate-playlist", label: "Duplicar" },
      { action: "export-playlist", label: "Exportar" },
      { action: "delete-playlist", label: "Remover" },
    ];
  }

  function canReorderActiveSource() {
    return (
      state.activeLibrary === "local" &&
      (state.activeLocalSource === "uploads" ||
        state.activeLocalSource.startsWith("playlist:"))
    );
  }

  function cleanupDragState() {
    state.draggedTrackIndex = null;
    ui.playlist
      .querySelectorAll(
        ".playlist-item.is-dragging, .playlist-item.is-drop-target",
      )
      .forEach((item) => {
        item.classList.remove("is-dragging", "is-drop-target");
      });
  }

  function refreshRenderedState() {
    const tracks = getTracks().map((track) => ({
      ...track,
      trackKey: getTrackKey(track),
    }));
    const currentTrack = tracks[state.currentIndex] ?? null;

    renderLocalSources(ui, getLocalCollections(), state.activeLocalSource, {
      hasContent: hasAnyLocalContent(),
      hasCustomCollections: state.userPlaylists.length > 0,
    });
    renderLocalSourceActions(ui, getLocalActionButtons());
    renderLibraryState(ui, state.activeLibrary, tracks.length, {
      hasAnyLocalContent: hasAnyLocalContent(),
      playlistHeading:
        state.activeLibrary === "online"
          ? "Playlist online"
          : getLocalHeading(),
    });
    renderRepeatState(ui, state.repeatMode);
    setVolumeIcon(ui, state.isMuted, state.volume);

    if (!tracks.length) {
      renderTrack(ui, null, state.activeLibrary);
      renderPlaylist(ui, [], -1, {
        favoriteTrackKeys: state.favoriteTrackKeys,
        reorderable: canReorderActiveSource(),
      });
      updateProgress(ui, 0, 0);
      setPlaybackState(ui, false);
      renderLibraryScreenState();
      return;
    }

    renderTrack(ui, currentTrack, state.activeLibrary, {
      isFavorite: isTrackFavorite(currentTrack),
    });
    renderPlaylist(ui, tracks, state.currentIndex, {
      favoriteTrackKeys: state.favoriteTrackKeys,
      reorderable: canReorderActiveSource(),
    });
    renderLibraryScreenState();
  }

  async function switchLibrary(targetLibrary) {
    if (state.activeLibrary === targetLibrary) {
      return;
    }

    pauseAllPlayers();
    state.activeLibrary = targetLibrary;
    state.currentIndex = 0;
    state.isPlaying = false;
    state.trackPrepared = false;
    normalizeLocalState();
    persistState();
    await renderCurrentLibrary({ autoplay: false });
  }

  async function renderCurrentLibrary({ autoplay }) {
    refreshRenderedState();

    if (!getTracks().length) {
      return;
    }

    await loadCurrentTrack({ autoplay });
  }

  async function loadCurrentTrack({ autoplay }) {
    const tracks = getTracks();

    if (!tracks.length) {
      return;
    }

    state.currentIndex = clamp(state.currentIndex, 0, tracks.length - 1);
    const track = getCurrentTrack();
    persistState();

    pauseAllPlayers();
    renderTrack(ui, track, state.activeLibrary, {
      isFavorite: isTrackFavorite(track),
    });
    renderPlaylist(
      ui,
      tracks.map((item) => ({ ...item, trackKey: getTrackKey(item) })),
      state.currentIndex,
      {
        favoriteTrackKeys: state.favoriteTrackKeys,
        reorderable: canReorderActiveSource(),
      },
    );
    updateProgress(ui, 0, 0);

    if (track.source === "youtube" && !autoplay) {
      state.trackPrepared = false;
      state.isPlaying = false;
      setPlaybackState(ui, false);
      setVolume();
      renderLibraryScreenState();
      return;
    }

    if (track.source === "youtube") {
      await youtubePlayer.load(track, autoplay);
    } else {
      await audioPlayer.load(track, autoplay);
    }

    state.trackPrepared = true;
    state.isPlaying = autoplay;
    setPlaybackState(ui, state.isPlaying);
    setVolume();
    renderLibraryScreenState();
  }

  async function playCurrentTrack() {
    const track = getCurrentTrack();

    if (!track) {
      return;
    }

    if (!state.trackPrepared) {
      await loadCurrentTrack({ autoplay: true });
      return;
    }

    const activePlayer = getActivePlayer();

    if (!activePlayer) {
      return;
    }

    await activePlayer.play();
    state.isPlaying = true;
    setPlaybackState(ui, true);
  }

  function pauseCurrentTrack() {
    const activePlayer = getActivePlayer();

    if (!activePlayer) {
      return;
    }

    activePlayer.pause();
    state.isPlaying = false;
    setPlaybackState(ui, false);
  }

  function pauseAllPlayers() {
    audioPlayer.pause();
    youtubePlayer.pause();
  }

  async function changeTrack(direction, autoplay) {
    const tracks = getTracks();

    if (!tracks.length) {
      return;
    }

    const candidateIndex = state.currentIndex + direction;

    if (candidateIndex < 0) {
      state.currentIndex = tracks.length - 1;
    } else if (candidateIndex >= tracks.length) {
      state.currentIndex = 0;
    } else {
      state.currentIndex = candidateIndex;
    }

    persistState();
    await loadCurrentTrack({ autoplay });
  }

  async function handleTrackEnded() {
    if (state.repeatMode === "one") {
      await loadCurrentTrack({ autoplay: true });
      return;
    }

    const isLastTrack = state.currentIndex === getTracks().length - 1;

    if (state.repeatMode === "off" && isLastTrack) {
      state.isPlaying = false;
      setPlaybackState(ui, false);
      updateProgress(ui, 0, getActivePlayer()?.getDuration() ?? 0);
      return;
    }

    await changeTrack(1, true);
  }

  function setVolume() {
    const volume = state.isMuted ? 0 : state.volume;

    ui.volumeSlider.value = String(state.volume);
    audioPlayer.setVolume(volume / 100);
    youtubePlayer.setVolume(volume);
    setVolumeIcon(ui, state.isMuted, state.volume);
    persistState();
  }

  async function persistUploadedTrackCollection() {
    await replacePersistedAudioFiles(
      state.uploadedTracks.map((track, index) =>
        buildPersistedRecordFromTrack(
          {
            ...track,
            sortOrder: index,
          },
          index,
        ),
      ),
    );
  }

  async function importLocalFiles(fileList, options = {}) {
    const audioFiles = getAudioFilesFromList(fileList);

    if (!audioFiles.length) {
      renderPlaylistBuilderStatus(
        ui,
        "Nenhum arquivo de áudio válido foi encontrado na seleção.",
        "error",
      );
      pushToast(ui, {
        title: "Importação local",
        message:
          "Selecione músicas ou uma pasta que contenha arquivos de áudio compatíveis.",
        tone: "error",
      });
      return;
    }

    try {
      const storedRecords = await persistAudioFiles(audioFiles);
      const importedTracks = storedRecords.map((record, index) =>
        buildPersistedLocalTrack(record, state.uploadedTracks.length + index),
      );

      state.uploadedTracks = [...state.uploadedTracks, ...importedTracks];
      state.activeLibrary = "local";
      state.activeLocalSource = "uploads";
      state.currentIndex = 0;
      state.trackPrepared = false;
      persistState();
      await renderCurrentLibrary({ autoplay: false });
      renderPlaylistBuilderStatus(
        ui,
        `${importedTracks.length} ${
          importedTracks.length === 1
            ? "faixa adicionada"
            : "faixas adicionadas"
        }.`,
        "success",
      );
      pushToast(ui, {
        title: "Biblioteca atualizada",
        message: `${importedTracks.length} ${
          importedTracks.length === 1 ? "música entrou" : "músicas entraram"
        } via ${options.sourceLabel ?? "seleção"}.`,
        tone: "success",
      });
    } catch {
      renderPlaylistBuilderStatus(
        ui,
        "Não foi possível persistir os arquivos locais no IndexedDB.",
        "error",
      );
      pushToast(ui, {
        title: "Falha ao importar",
        message:
          "O IndexedDB não respondeu. Tente novamente em outro navegador ou aba limpa.",
        tone: "error",
      });
    }
  }

  function openCreatePlaylistModal() {
    state.modal = { type: "create-playlist" };
    renderModal(ui, {
      eyebrow: "Nova playlist",
      title: "Criar playlist a partir de links do YouTube",
      description:
        "Cole um ou mais links. O player consulta o oEmbed para preencher título, artista e capa automaticamente.",
      content: `
        <div class="modal-form">
          <label class="modal-form__field">
            <span>Nome da playlist</span>
            <input id="modal-playlist-name" type="text" maxlength="50" placeholder="Ex.: Hits de madrugada" />
          </label>
          <label class="modal-form__field">
            <span>Links do YouTube</span>
            <textarea id="modal-playlist-links" rows="6" placeholder="Cole um link por linha"></textarea>
          </label>
          <p class="modal-hint">Links repetidos serão ignorados automaticamente.</p>
        </div>
      `,
      primaryLabel: "Criar playlist",
      primaryAction: "confirm-create-playlist",
      secondaryLabel: "Cancelar",
    });
  }

  function openEditPlaylistModal(playlist) {
    state.modal = { type: "edit-playlist", playlistId: playlist.id };
    renderModal(ui, {
      eyebrow: "Editar playlist",
      title: `Editar ${playlist.name}`,
      description:
        "Você pode renomear a playlist e substituir a lista de vídeos do YouTube.",
      content: `
        <div class="modal-form">
          <label class="modal-form__field">
            <span>Nome da playlist</span>
            <input id="modal-playlist-name" type="text" maxlength="50" value="${escapeHtml(playlist.name)}" />
          </label>
          <label class="modal-form__field">
            <span>Links do YouTube</span>
            <textarea id="modal-playlist-links" rows="6">${playlist.tracks
              .map((track) => createYouTubeWatchUrl(track.youtubeId))
              .join("\n")}</textarea>
          </label>
        </div>
      `,
      primaryLabel: "Salvar alterações",
      primaryAction: "confirm-edit-playlist",
      secondaryLabel: "Cancelar",
    });
  }

  function openDuplicatePlaylistModal(playlist) {
    state.modal = { type: "duplicate-playlist", playlistId: playlist.id };
    renderModal(ui, {
      eyebrow: "Duplicar playlist",
      title: `Duplicar ${playlist.name}`,
      description:
        "Crie uma variação local mantendo a curadoria original intacta.",
      content: `
        <div class="modal-form">
          <label class="modal-form__field">
            <span>Novo nome</span>
            <input id="modal-duplicate-name" type="text" maxlength="50" value="${escapeHtml(`${playlist.name} Copy`)}" />
          </label>
        </div>
      `,
      primaryLabel: "Duplicar",
      primaryAction: "confirm-duplicate-playlist",
      secondaryLabel: "Cancelar",
    });
  }

  function openDeletePlaylistModal(playlist) {
    state.modal = { type: "delete-playlist", playlistId: playlist.id };
    renderModal(ui, {
      eyebrow: "Remover playlist",
      title: `Excluir ${playlist.name}?`,
      description:
        "Esta ação remove apenas a playlist salva no navegador. Os vídeos originais do YouTube não são afetados.",
      content: `
        <div class="modal-danger">
          A playlist será removida da sua coleção local e deixará de aparecer no player.
        </div>
      `,
      primaryLabel: "Remover playlist",
      primaryAction: "confirm-delete-playlist",
      secondaryLabel: "Cancelar",
    });
  }

  function openExportPlaylistModal(playlist) {
    state.modal = { type: "export-playlist", playlistId: playlist.id };
    renderModal(ui, {
      eyebrow: "Exportar playlist",
      title: `Exportar ${playlist.name}`,
      description:
        "Baixe um JSON compatível com a importação local do próprio player.",
      content: `
        <div class="modal-export">
          <div class="modal-inline-actions">
            <button class="local-source-action" type="button" data-modal-action="download-playlist-json">Baixar JSON</button>
          </div>
          <label class="modal-form__field">
            <span>Prévia do arquivo</span>
            <textarea rows="10" readonly>${JSON.stringify(
              serializePlaylistForExport(playlist),
              null,
              2,
            )}</textarea>
          </label>
        </div>
      `,
      primaryLabel: "Fechar",
      primaryAction: "modal-cancel",
    });
  }

  function openImportPlaylistModal() {
    state.modal = { type: "import-playlist" };
    renderModal(ui, {
      eyebrow: "Importar coleção",
      title: "Importar playlists em JSON",
      description:
        "Use o modelo exportado pelo próprio player ou o exemplo disponível na pasta docs.",
      content: `
        <div class="modal-stack">
          <p class="modal-hint">Ao escolher um arquivo JSON válido, o player adiciona as playlists importadas à sua biblioteca local.</p>
          <div class="modal-inline-actions">
            <button class="local-source-action" type="button" data-modal-action="trigger-import-playlist">Selecionar arquivo JSON</button>
          </div>
        </div>
      `,
      primaryLabel: "Fechar",
      primaryAction: "modal-cancel",
    });
  }

  function openEditTrackModal(track) {
    if (!track?.storageId) {
      return;
    }

    state.modal = { type: "edit-track", storageId: track.storageId };
    renderModal(ui, {
      eyebrow: "Metadados locais",
      title: `Editar ${track.title}`,
      description:
        "Ajuste título, artista, álbum, gênero e textos exibidos no hero sem perder o arquivo persistido.",
      content: `
        <div class="modal-form">
          <label class="modal-form__field">
            <span>Título</span>
            <input id="modal-track-title" type="text" maxlength="80" value="${escapeHtml(track.title)}" />
          </label>
          <label class="modal-form__field">
            <span>Artista</span>
            <input id="modal-track-artist" type="text" maxlength="80" value="${escapeHtml(track.artist)}" />
          </label>
          <label class="modal-form__field">
            <span>Álbum</span>
            <input id="modal-track-album" type="text" maxlength="80" value="${escapeHtml(track.album)}" />
          </label>
          <label class="modal-form__field">
            <span>Gênero</span>
            <input id="modal-track-genre" type="text" maxlength="50" value="${escapeHtml(track.genre)}" />
          </label>
          <label class="modal-form__field">
            <span>Resumo</span>
            <textarea id="modal-track-translation" rows="3">${escapeHtml(track.translation)}</textarea>
          </label>
          <label class="modal-form__field">
            <span>Trecho ou contexto</span>
            <textarea id="modal-track-lyrics" rows="3">${escapeHtml(track.lyricsPreview)}</textarea>
          </label>
          <label class="modal-form__field">
            <span>Capa</span>
            <input id="modal-track-cover" type="url" value="${escapeHtml(track.cover)}" />
          </label>
        </div>
      `,
      primaryLabel: "Salvar metadados",
      primaryAction: "confirm-edit-track",
      secondaryLabel: "Cancelar",
    });
  }

  function openDeleteTrackModal(track) {
    if (!track?.storageId) {
      return;
    }

    state.modal = { type: "delete-track", storageId: track.storageId };
    renderModal(ui, {
      eyebrow: "Remover faixa local",
      title: `Excluir ${track.title}?`,
      description:
        "O arquivo e os metadados persistidos serão removidos apenas deste navegador.",
      content: `
        <div class="modal-danger">
          A faixa deixará de aparecer nas coleções locais e também sairá da lista de favoritas se estiver marcada.
        </div>
      `,
      primaryLabel: "Excluir faixa",
      primaryAction: "confirm-delete-track",
      secondaryLabel: "Cancelar",
    });
  }

  function openClearUploadsModal() {
    state.modal = { type: "clear-uploads" };
    renderModal(ui, {
      eyebrow: "Arquivos locais",
      title: "Limpar uploads persistidos?",
      description:
        "Os arquivos salvos em IndexedDB serão removidos do dispositivo neste navegador.",
      content: `
        <div class="modal-danger">
          Esta ação apaga os uploads locais persistidos. Suas playlists do YouTube continuam intactas.
        </div>
      `,
      primaryLabel: "Limpar uploads",
      primaryAction: "confirm-clear-uploads",
      secondaryLabel: "Cancelar",
    });
  }

  function openLibraryScreen() {
    state.libraryScreenOpen = true;
    renderLibraryScreenState();
    window.requestAnimationFrame(() => {
      focusLibrarySearch(ui);
    });
  }

  function closeLibraryScreen() {
    state.libraryScreenOpen = false;
    renderLibraryScreenState();
  }

  function renderLibraryScreenState() {
    const allEntries = buildLibraryEntries();
    const query = normalizeSearchText(state.libraryQuery);
    const uniqueTrackCount = new Set(
      allEntries.map((entry) => entry.track.trackKey),
    ).size;

    const preGenreEntries = allEntries.filter((entry) => {
      if (
        state.libraryFilter === "favorites" &&
        !isTrackFavorite(entry.track)
      ) {
        return false;
      }

      if (state.libraryFilter === "online" && entry.library !== "online") {
        return false;
      }

      if (state.libraryFilter === "local" && entry.track.source !== "local") {
        return false;
      }

      if (
        state.libraryFilter === "playlists" &&
        !entry.sourceId.startsWith("playlist:")
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const corpus = normalizeSearchText(
        [
          entry.track.title,
          entry.track.artist,
          entry.track.album,
          entry.track.genre,
          entry.track.translation,
          entry.collectionLabel,
        ].join(" "),
      );

      return corpus.includes(query);
    });
    const genreOptions = buildGenreOptions(preGenreEntries);

    if (
      state.libraryGenre !== "all" &&
      !genreOptions.some((genre) => genre.id === state.libraryGenre)
    ) {
      state.libraryGenre = "all";
    }

    const filteredEntries = preGenreEntries
      .filter((entry) => {
        if (state.libraryGenre === "all") {
          return true;
        }

        return normalizeSearchText(entry.track.genre) === state.libraryGenre;
      })
      .map((entry) => ({
        ...entry,
        isFavorite: isTrackFavorite(entry.track),
        quickEditing:
          Boolean(entry.track.storageId) &&
          entry.track.storageId === state.quickEditStorageId,
      }));

    sortLibraryEntries(filteredEntries);

    state.libraryResults = filteredEntries;

    renderLibraryScreen(ui, {
      visible: state.libraryScreenOpen,
      query: state.libraryQuery,
      filters: libraryFilters,
      activeFilter: state.libraryFilter,
      sortOptions: librarySortOptions,
      activeSort: state.librarySort,
      genres: genreOptions,
      activeGenre: state.libraryGenre,
      stats: [
        {
          label: "Faixas únicas",
          value: String(uniqueTrackCount),
          description: "Contagem consolidada entre online, locais e playlists.",
        },
        {
          label: "Favoritas",
          value: String(state.favoriteTrackKeys.length),
          description:
            "Atalhos para as faixas que você quer reencontrar rápido.",
        },
        {
          label: "Uploads locais",
          value: String(state.uploadedTracks.length),
          description:
            "Arquivos persistidos em IndexedDB com ordem e metadados.",
        },
        {
          label: "Playlists salvas",
          value: String(state.userPlaylists.length),
          description:
            "Coleções importadas ou montadas a partir de links do YouTube.",
        },
      ],
      results: filteredEntries,
    });
  }

  function buildGenreOptions(entries) {
    const genres = entries.reduce((map, entry) => {
      const id = normalizeSearchText(entry.track.genre || "Local");
      const previous = map.get(id);

      map.set(id, {
        id,
        label: entry.track.genre || "Local",
        count: String((previous?.countNumber ?? 0) + 1),
        countNumber: (previous?.countNumber ?? 0) + 1,
      });

      return map;
    }, new Map());

    return [
      {
        id: "all",
        label: "Todos os gêneros",
        count: String(entries.length),
      },
      ...Array.from(genres.values())
        .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))
        .map(({ countNumber, ...genre }) => genre),
    ];
  }

  function sortLibraryEntries(entries) {
    entries.sort((left, right) => {
      if (state.librarySort === "title-asc") {
        return left.track.title.localeCompare(right.track.title, "pt-BR");
      }

      if (state.librarySort === "title-desc") {
        return right.track.title.localeCompare(left.track.title, "pt-BR");
      }

      if (state.librarySort === "artist-asc") {
        return left.track.artist.localeCompare(right.track.artist, "pt-BR");
      }

      if (state.librarySort === "recent-local") {
        const localDelta =
          Number(right.track.source === "local") -
          Number(left.track.source === "local");

        if (localDelta !== 0) {
          return localDelta;
        }

        return (
          Number(right.track.createdAt ?? 0) - Number(left.track.createdAt ?? 0)
        );
      }

      const favoriteDelta = Number(right.isFavorite) - Number(left.isFavorite);

      if (favoriteDelta !== 0) {
        return favoriteDelta;
      }

      return left.track.title.localeCompare(right.track.title, "pt-BR");
    });
  }

  async function handleSourceAction(action) {
    const playlist = getPlaylistBySourceId();

    if (action === "clear-uploads") {
      openClearUploadsModal();
      return;
    }

    if (!playlist) {
      return;
    }

    if (action === "edit-playlist") {
      openEditPlaylistModal(playlist);
      return;
    }

    if (action === "duplicate-playlist") {
      openDuplicatePlaylistModal(playlist);
      return;
    }

    if (action === "export-playlist") {
      openExportPlaylistModal(playlist);
      return;
    }

    if (action === "delete-playlist") {
      openDeletePlaylistModal(playlist);
    }
  }

  async function handleModalAction(action) {
    if (action === "modal-cancel") {
      hideModal();
      return;
    }

    if (action === "trigger-import-playlist") {
      ui.playlistImportInput?.click();
      return;
    }

    if (action === "download-playlist-json") {
      const playlist = getPlaylistBySourceId(
        `playlist:${state.modal?.playlistId}`,
      );

      if (!playlist) {
        return;
      }

      downloadJsonFile(
        `${playlist.name.toLowerCase().replace(/\s+/g, "-")}.json`,
        serializePlaylistForExport(playlist),
      );
      pushToast(ui, {
        title: "Exportação pronta",
        message: "O JSON da playlist foi baixado para o seu dispositivo.",
        tone: "success",
      });
      return;
    }

    if (action === "confirm-create-playlist") {
      await createOrUpdatePlaylist({ mode: "create" });
      return;
    }

    if (action === "confirm-edit-playlist") {
      await createOrUpdatePlaylist({
        mode: "edit",
        playlistId: state.modal?.playlistId,
      });
      return;
    }

    if (action === "confirm-duplicate-playlist") {
      await duplicateStoredPlaylist();
      return;
    }

    if (action === "confirm-delete-playlist") {
      await removeStoredPlaylist();
      return;
    }

    if (action === "confirm-clear-uploads") {
      await clearUploadedTracks();
      return;
    }

    if (action === "confirm-restore-library-backup") {
      await confirmRestoreLibraryBackup();
      return;
    }

    if (action === "confirm-delete-track") {
      await deleteLocalTrackByModal();
      return;
    }

    if (action === "confirm-edit-track") {
      await saveTrackMetadata();
    }
  }

  async function createOrUpdatePlaylist({ mode, playlistId }) {
    const name =
      ui.modalContent.querySelector("#modal-playlist-name")?.value ?? "";
    const links =
      ui.modalContent.querySelector("#modal-playlist-links")?.value ?? "";

    renderPlaylistBuilderStatus(ui, "Processando playlist...", "neutral");

    try {
      const playlist = await createYouTubePlaylist(name, links);

      if (mode === "edit" && playlistId) {
        const currentPlaylist = getPlaylistBySourceId(`playlist:${playlistId}`);
        const updatedPlaylist = {
          ...playlist,
          id: playlistId,
          name: playlist.name,
          tracks: playlist.tracks,
        };

        state.userPlaylists = state.userPlaylists.map((item) =>
          item.id === playlistId ? updatedPlaylist : item,
        );
        state.activeLocalSource = `playlist:${playlistId}`;
        pushToast(ui, {
          title: "Playlist atualizada",
          message: `${currentPlaylist?.name ?? "Playlist"} foi atualizada com sucesso.`,
          tone: "success",
        });
      } else {
        state.userPlaylists = [playlist, ...state.userPlaylists];
        state.activeLocalSource = `playlist:${playlist.id}`;
        pushToast(ui, {
          title: "Playlist criada",
          message: `${playlist.name} entrou na sua coleção local.`,
          tone: "success",
        });
      }

      state.activeLibrary = "local";
      state.currentIndex = 0;
      state.trackPrepared = false;
      persistState();
      hideModal();
      await renderCurrentLibrary({ autoplay: false });
      renderPlaylistBuilderStatus(
        ui,
        `${playlist.name} pronta para tocar no player.`,
        "success",
      );
    } catch (error) {
      renderPlaylistBuilderStatus(
        ui,
        error instanceof Error
          ? error.message
          : "Não foi possível montar a playlist.",
        "error",
      );
      pushToast(ui, {
        title: "Falha na playlist",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível montar a playlist.",
        tone: "error",
      });
    }
  }

  async function duplicateStoredPlaylist() {
    const playlist = getPlaylistBySourceId(
      `playlist:${state.modal?.playlistId}`,
    );
    const nextName =
      ui.modalContent.querySelector("#modal-duplicate-name")?.value ?? "";

    if (!playlist) {
      return;
    }

    const copy = duplicatePlaylist(playlist, nextName);
    state.userPlaylists = [copy, ...state.userPlaylists];
    state.activeLibrary = "local";
    state.activeLocalSource = `playlist:${copy.id}`;
    state.currentIndex = 0;
    state.trackPrepared = false;
    persistState();
    hideModal();
    await renderCurrentLibrary({ autoplay: false });
    pushToast(ui, {
      title: "Playlist duplicada",
      message: `${copy.name} foi criada a partir da original.`,
      tone: "success",
    });
  }

  async function saveTrackMetadata() {
    const storageId = state.modal?.storageId;
    const currentTrack = state.uploadedTracks.find(
      (track) => track.storageId === storageId,
    );

    if (!storageId || !currentTrack) {
      return;
    }

    const updatedTrack = {
      ...currentTrack,
      title:
        ui.modalContent.querySelector("#modal-track-title")?.value.trim() ||
        currentTrack.title,
      artist:
        ui.modalContent.querySelector("#modal-track-artist")?.value.trim() ||
        currentTrack.artist,
      album:
        ui.modalContent.querySelector("#modal-track-album")?.value.trim() ||
        currentTrack.album,
      genre:
        ui.modalContent.querySelector("#modal-track-genre")?.value.trim() ||
        currentTrack.genre,
      translation:
        ui.modalContent
          .querySelector("#modal-track-translation")
          ?.value.trim() || currentTrack.translation,
      lyricsPreview:
        ui.modalContent.querySelector("#modal-track-lyrics")?.value.trim() ||
        currentTrack.lyricsPreview,
      cover:
        ui.modalContent.querySelector("#modal-track-cover")?.value.trim() ||
        currentTrack.cover,
    };

    state.uploadedTracks = state.uploadedTracks.map((track) =>
      track.storageId === storageId ? updatedTrack : track,
    );

    await persistUploadedTrackCollection();
    persistState();
    hideModal();
    refreshRenderedState();
    pushToast(ui, {
      title: "Metadados atualizados",
      message: `${updatedTrack.title} foi atualizada na sua biblioteca local.`,
      tone: "success",
    });
  }

  async function removeStoredPlaylist() {
    const playlistId = state.modal?.playlistId;
    const removedPlaylist = getPlaylistBySourceId(`playlist:${playlistId}`);

    if (!playlistId || !removedPlaylist) {
      return;
    }

    state.userPlaylists = state.userPlaylists.filter(
      (playlist) => playlist.id !== playlistId,
    );
    state.activeLocalSource = "uploads";
    state.activeLibrary = hasAnyLocalContent() ? "local" : "online";
    state.currentIndex = 0;
    state.trackPrepared = false;
    persistState();
    hideModal();
    await renderCurrentLibrary({ autoplay: false });
    pushToast(ui, {
      title: "Playlist removida",
      message: `${removedPlaylist.name} saiu da sua coleção local.`,
      tone: "success",
    });
  }

  async function clearUploadedTracks() {
    try {
      revokeTrackUrls(state.uploadedTracks);
      await replacePersistedAudioFiles([]);
      state.uploadedTracks = [];
      normalizeLocalState();
      state.activeLibrary = hasAnyLocalContent() ? "local" : "online";
      state.currentIndex = 0;
      state.trackPrepared = false;
      persistState();
      hideModal();
      await renderCurrentLibrary({ autoplay: false });
      pushToast(ui, {
        title: "Uploads removidos",
        message: "Os arquivos locais persistidos foram limpos do dispositivo.",
        tone: "success",
      });
    } catch {
      pushToast(ui, {
        title: "Falha ao limpar",
        message: "Não foi possível remover os uploads do IndexedDB.",
        tone: "error",
      });
    }
  }

  async function reorderActiveCollection(fromIndex, toIndex) {
    if (!canReorderActiveSource() || fromIndex === toIndex) {
      return;
    }

    const currentTrackKey = getTrackKey(getCurrentTrack());

    if (state.activeLocalSource === "uploads") {
      state.uploadedTracks = moveArrayItem(
        state.uploadedTracks,
        fromIndex,
        toIndex,
      ).map((track, index) => ({
        ...track,
        sortOrder: index,
      }));
      await persistUploadedTrackCollection();
    } else {
      const playlist = getPlaylistBySourceId();

      if (!playlist) {
        return;
      }

      const updatedPlaylist = {
        ...playlist,
        tracks: moveArrayItem(playlist.tracks, fromIndex, toIndex),
      };

      state.userPlaylists = state.userPlaylists.map((item) =>
        item.id === updatedPlaylist.id ? updatedPlaylist : item,
      );
    }

    const nextTracks = getTracks();
    const nextIndex = nextTracks.findIndex(
      (track) => getTrackKey(track) === currentTrackKey,
    );
    state.currentIndex =
      nextIndex >= 0 ? nextIndex : clamp(toIndex, 0, nextTracks.length - 1);
    persistState();
    refreshRenderedState();
    pushToast(ui, {
      title: "Ordem atualizada",
      message: "A coleção ativa foi reordenada com drag and drop.",
      tone: "success",
    });
  }

  function toggleTrackFavorite(track) {
    const trackKey = getTrackKey(track);

    if (state.favoriteTrackKeys.includes(trackKey)) {
      state.favoriteTrackKeys = state.favoriteTrackKeys.filter(
        (key) => key !== trackKey,
      );
    } else {
      state.favoriteTrackKeys = [trackKey, ...state.favoriteTrackKeys];
    }

    normalizeLocalState();
    state.currentIndex = clamp(
      state.currentIndex,
      0,
      Math.max(getTracks().length - 1, 0),
    );
    persistState();
    refreshRenderedState();
  }

  async function exportLibraryBackup() {
    const payload = await serializeLibraryBackup({
      uploadedTracks: state.uploadedTracks,
      userPlaylists: state.userPlaylists,
      favoriteTrackKeys: state.favoriteTrackKeys,
      settings: {
        activeLibrary: state.activeLibrary,
        activeLocalSource: state.activeLocalSource,
      },
    });

    downloadJsonFile(formatBackupFileName(), payload);
    pushToast(ui, {
      title: "Backup gerado",
      message:
        "A biblioteca completa foi exportada com arquivos locais e metadados.",
      tone: "success",
    });
  }

  async function previewLibraryBackup(file) {
    try {
      const rawText = await file.text();
      const backup = parseLibraryBackup(rawText);

      state.pendingLibraryBackup = {
        fileName: file.name,
        backup,
      };

      const previewTitles = backup.uploadedRecords
        .slice(0, 4)
        .map((record) => `<li>${escapeHtml(record.title)}</li>`)
        .join("");

      state.modal = { type: "restore-library-backup" };
      renderModal(ui, {
        eyebrow: "Restauração assistida",
        title: "Prévia do backup selecionado",
        description:
          "Confira os volumes antes de sobrescrever a biblioteca local atual.",
        content: `
          <div class="modal-stack">
            <div class="library-restore-preview">
              <article class="library-restore-preview__card">
                <span>Arquivo</span>
                <strong>${escapeHtml(file.name)}</strong>
              </article>
              <article class="library-restore-preview__card">
                <span>Uploads locais</span>
                <strong>${backup.uploadedRecords.length}</strong>
              </article>
              <article class="library-restore-preview__card">
                <span>Playlists</span>
                <strong>${backup.userPlaylists.length}</strong>
              </article>
              <article class="library-restore-preview__card">
                <span>Favoritas</span>
                <strong>${backup.favoriteTrackKeys.length}</strong>
              </article>
            </div>
            <div class="modal-form__field">
              <span>Primeiras faixas locais do backup</span>
              <ul class="library-restore-preview__list">
                ${previewTitles || "<li>Nenhum upload local no arquivo.</li>"}
              </ul>
            </div>
            <div class="modal-danger">
              Ao confirmar, a biblioteca local atual será substituída pelos dados deste arquivo.
            </div>
          </div>
        `,
        primaryLabel: "Restaurar biblioteca",
        primaryAction: "confirm-restore-library-backup",
        secondaryLabel: "Cancelar",
      });
    } catch (error) {
      state.pendingLibraryBackup = null;
      pushToast(ui, {
        title: "Falha no backup",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível preparar a restauração do backup.",
        tone: "error",
      });
    }
  }

  async function confirmRestoreLibraryBackup() {
    try {
      const backup = state.pendingLibraryBackup?.backup;

      if (!backup) {
        return;
      }

      revokeTrackUrls(state.uploadedTracks);
      await replacePersistedAudioFiles(backup.uploadedRecords);
      state.uploadedTracks = backup.uploadedRecords.map((record, index) =>
        buildPersistedLocalTrack(record, index),
      );
      state.userPlaylists = Array.isArray(backup.userPlaylists)
        ? backup.userPlaylists
        : [];
      state.favoriteTrackKeys = Array.isArray(backup.favoriteTrackKeys)
        ? backup.favoriteTrackKeys
        : [];
      state.activeLibrary =
        backup.settings.activeLibrary === "local" ||
        backup.settings.activeLibrary === "online"
          ? backup.settings.activeLibrary
          : "local";
      state.activeLocalSource =
        typeof backup.settings.activeLocalSource === "string"
          ? backup.settings.activeLocalSource
          : "uploads";
      state.currentIndex = 0;
      state.trackPrepared = false;
      state.pendingLibraryBackup = null;
      state.quickEditStorageId = null;
      normalizeLocalState();
      persistState();
      await renderCurrentLibrary({ autoplay: false });
      hideModal();
      pushToast(ui, {
        title: "Backup restaurado",
        message: "A biblioteca foi restaurada a partir do arquivo selecionado.",
        tone: "success",
      });
    } catch (error) {
      pushToast(ui, {
        title: "Falha no backup",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível restaurar o backup da biblioteca.",
        tone: "error",
      });
    }
  }

  async function saveQuickEditFromEntry(entry) {
    if (!entry?.track?.storageId) {
      return;
    }

    const card = ui.libraryResults?.querySelector(
      `[data-storage-id='${entry.track.storageId}']`,
    );

    if (!card) {
      return;
    }

    const updatedTrack = {
      ...entry.track,
      title:
        card.querySelector("[data-quick-edit-field='title']")?.value.trim() ||
        entry.track.title,
      artist:
        card.querySelector("[data-quick-edit-field='artist']")?.value.trim() ||
        entry.track.artist,
      album:
        card.querySelector("[data-quick-edit-field='album']")?.value.trim() ||
        entry.track.album,
      genre:
        card.querySelector("[data-quick-edit-field='genre']")?.value.trim() ||
        entry.track.genre,
    };

    state.uploadedTracks = state.uploadedTracks.map((track) =>
      track.storageId === updatedTrack.storageId ? updatedTrack : track,
    );
    state.quickEditStorageId = null;
    await persistUploadedTrackCollection();
    persistState();
    refreshRenderedState();
    pushToast(ui, {
      title: "Edição rápida salva",
      message: `${updatedTrack.title} foi atualizada na biblioteca premium.`,
      tone: "success",
    });
  }

  async function deleteLocalTrackByModal() {
    const storageId = state.modal?.storageId;
    const track = state.uploadedTracks.find(
      (item) => item.storageId === storageId,
    );

    if (!track) {
      return;
    }

    await deleteLocalTrack(track);
  }

  async function deleteLocalTrack(track) {
    try {
      pauseAllPlayers();
      revokeTrackUrls([track]);
      await deletePersistedAudioFile(track.storageId);
      state.uploadedTracks = state.uploadedTracks
        .filter((item) => item.storageId !== track.storageId)
        .map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
      state.favoriteTrackKeys = state.favoriteTrackKeys.filter(
        (key) => key !== getTrackKey(track),
      );
      state.quickEditStorageId = null;
      normalizeLocalState();
      state.currentIndex = clamp(
        state.currentIndex,
        0,
        Math.max(getTracks().length - 1, 0),
      );
      await persistUploadedTrackCollection();
      persistState();
      hideModal();
      await renderCurrentLibrary({ autoplay: false });
      pushToast(ui, {
        title: "Faixa removida",
        message: `${track.title} saiu da sua biblioteca local.`,
        tone: "success",
      });
    } catch {
      pushToast(ui, {
        title: "Falha ao excluir",
        message: "Não foi possível remover a faixa local do IndexedDB.",
        tone: "error",
      });
    }
  }

  async function playLibraryEntry(entry) {
    state.activeLibrary = entry.library;

    if (entry.library === "local") {
      state.activeLocalSource = entry.sourceId;
    }

    state.currentIndex = entry.index;
    state.trackPrepared = false;
    persistState();
    await renderCurrentLibrary({ autoplay: true });
  }

  async function importStoredPlaylists(file) {
    renderPlaylistBuilderStatus(ui, "Importando playlist...", "neutral");

    try {
      const rawText = await file.text();
      const importedPlaylists = parseImportedPlaylists(rawText);
      state.userPlaylists = [...importedPlaylists, ...state.userPlaylists];
      state.activeLibrary = "local";
      state.activeLocalSource = `playlist:${importedPlaylists[0].id}`;
      state.currentIndex = 0;
      state.trackPrepared = false;
      persistState();
      hideModal();
      await renderCurrentLibrary({ autoplay: false });
      renderPlaylistBuilderStatus(
        ui,
        `${importedPlaylists.length} ${importedPlaylists.length === 1 ? "playlist importada" : "playlists importadas"} com sucesso.`,
        "success",
      );
      pushToast(ui, {
        title: "Importação concluída",
        message: "As playlists entraram na sua coleção local.",
        tone: "success",
      });
    } catch (error) {
      renderPlaylistBuilderStatus(
        ui,
        error instanceof Error
          ? error.message
          : "Não foi possível importar a playlist.",
        "error",
      );
      pushToast(ui, {
        title: "Falha ao importar",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível importar a playlist.",
        tone: "error",
      });
    }
  }

  function hideModal() {
    state.modal = null;
    closeModal(ui);
  }

  function hydrateStateFromStorage() {
    const storedVolume = Number(localStorage.getItem(storageKeys.volume));
    const storedMuted = localStorage.getItem(storageKeys.muted);
    const storedRepeatMode = localStorage.getItem(storageKeys.repeatMode);
    const storedLibrary = localStorage.getItem(storageKeys.activeLibrary);
    const storedSplashVersion = localStorage.getItem(
      storageKeys.splashSeenVersion,
    );
    const storedUserPlaylists = localStorage.getItem(storageKeys.userPlaylists);
    const storedActiveLocalSource = localStorage.getItem(
      storageKeys.activeLocalSource,
    );
    const storedFavoriteTrackKeys = localStorage.getItem(
      storageKeys.favoriteTrackKeys,
    );

    if (
      Number.isFinite(storedVolume) &&
      storedVolume >= 0 &&
      storedVolume <= 100
    ) {
      state.volume = storedVolume;
    }

    if (storedMuted !== null) {
      state.isMuted = storedMuted === "true";
    }

    if (repeatModes.includes(storedRepeatMode)) {
      state.repeatMode = storedRepeatMode;
    }

    if (storedLibrary === "online" || storedLibrary === "local") {
      state.activeLibrary = storedLibrary;
    }

    if (storedSplashVersion === SPLASH_VERSION) {
      state.splashSeen = true;
    }

    if (storedActiveLocalSource) {
      state.activeLocalSource = storedActiveLocalSource;
    }

    if (storedUserPlaylists) {
      try {
        const parsed = JSON.parse(storedUserPlaylists);
        state.userPlaylists = Array.isArray(parsed) ? parsed : [];
      } catch {
        state.userPlaylists = [];
      }
    }

    if (storedFavoriteTrackKeys) {
      try {
        const parsed = JSON.parse(storedFavoriteTrackKeys);
        state.favoriteTrackKeys = Array.isArray(parsed) ? parsed : [];
      } catch {
        state.favoriteTrackKeys = [];
      }
    }
  }

  function persistState() {
    localStorage.setItem(storageKeys.volume, String(state.volume));
    localStorage.setItem(storageKeys.muted, String(state.isMuted));
    localStorage.setItem(storageKeys.repeatMode, state.repeatMode);
    localStorage.setItem(storageKeys.activeLibrary, state.activeLibrary);
    localStorage.setItem(
      storageKeys.activeLocalSource,
      state.activeLocalSource,
    );
    localStorage.setItem(
      storageKeys.userPlaylists,
      JSON.stringify(state.userPlaylists),
    );
    localStorage.setItem(
      storageKeys.favoriteTrackKeys,
      JSON.stringify(state.favoriteTrackKeys),
    );

    if (state.splashSeen) {
      localStorage.setItem(storageKeys.splashSeenVersion, SPLASH_VERSION);
    } else {
      localStorage.removeItem(storageKeys.splashSeenVersion);
    }

    const currentTrack = getCurrentTrack();

    if (currentTrack?.id) {
      localStorage.setItem(storageKeys.currentTrackId, currentTrack.id);
      return;
    }

    localStorage.removeItem(storageKeys.currentTrackId);
  }

  function restoreCurrentIndex() {
    const storedTrackId = localStorage.getItem(storageKeys.currentTrackId);

    if (!storedTrackId) {
      return;
    }

    const matchIndex = getTracks().findIndex(
      (track) => track.id === storedTrackId,
    );

    if (matchIndex >= 0) {
      state.currentIndex = matchIndex;
    }
  }

  function renderSplashState() {
    renderSplashScreen(
      ui,
      splashSlides[state.splashIndex],
      state.splashIndex,
      splashSlides.length,
    );
    syncSplashscreen();
  }

  function syncSplashscreen() {
    ui.splashscreen?.classList.toggle("is-hidden", state.splashSeen);
  }
}
