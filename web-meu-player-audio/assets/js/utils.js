const TIME_FALLBACK = "0:00";

const YOUTUBE_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return TIME_FALLBACK;
  }

  const safeSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createRuntimeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeText(value, fallback) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export function extractYouTubeVideoId(rawValue) {
  const value = String(rawValue ?? "").trim();

  if (!value) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  try {
    const parsedUrl = new URL(value);
    const directId = parsedUrl.searchParams.get("v");

    if (directId && /^[a-zA-Z0-9_-]{11}$/.test(directId)) {
      return directId;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseYouTubeEntries(rawInput) {
  const values = String(rawInput ?? "")
    .split(/\r?\n|,|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const uniqueIds = new Set();

  values.forEach((value) => {
    const videoId = extractYouTubeVideoId(value);

    if (videoId) {
      uniqueIds.add(videoId);
    }
  });

  return Array.from(uniqueIds);
}

export function createYouTubeCover(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function sanitizePlaylistName(name, fallback = "Playlist local") {
  return normalizeText(name, fallback).slice(0, 50);
}

export function buildYouTubeTrack(track, index, album = "Playlist local") {
  const youtubeId = extractYouTubeVideoId(
    track.youtubeId ?? track.url ?? track.link,
  );

  if (!youtubeId) {
    return null;
  }

  return {
    id: normalizeText(track.id, createRuntimeId(`yt-local-${index}`)),
    title: normalizeText(track.title, `Video ${index + 1}`),
    artist: normalizeText(track.artist, "YouTube importado"),
    album: normalizeText(track.album, album),
    genre: normalizeText(track.genre, "YouTube"),
    translation: normalizeText(
      track.translation,
      "Faixa importada a partir do YouTube. Edite os dados no JSON se quiser adicionar um contexto próprio.",
    ),
    lyricsPreview: normalizeText(
      track.lyricsPreview,
      "Sem letra automática. O player mantém apenas o contexto configurado por você.",
    ),
    source: "youtube",
    youtubeId,
    cover: normalizeText(track.cover, createYouTubeCover(youtubeId)),
  };
}

export function buildLocalTrack(file, index) {
  const objectUrl = URL.createObjectURL(file);
  const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");

  return {
    id: createRuntimeId(`local-${index}`),
    title: cleanName || `Faixa local ${index + 1}`,
    artist: "Arquivo local",
    album: "Biblioteca local",
    genre: "Local",
    translation:
      "Faixa local importada. Adicione seus proprios metadados ou traducoes autorizadas se quiser exibir mais contexto aqui.",
    lyricsPreview:
      "Sem letra licenciada para exibicao automatica. O player mostra apenas informacoes configuradas por voce.",
    source: "local",
    src: objectUrl,
    cover:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80",
  };
}

export function buildPersistedLocalTrack(record, index = 0) {
  const objectUrl = URL.createObjectURL(record.blob);
  const cleanName = String(record.fileName ?? "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ");

  return {
    id: normalizeText(record.id, createRuntimeId(`local-db-${index}`)),
    title: normalizeText(record.title, cleanName || `Faixa local ${index + 1}`),
    artist: normalizeText(record.artist, "Arquivo local"),
    album: normalizeText(record.album, "Biblioteca local"),
    genre: normalizeText(record.genre, "Local"),
    translation: normalizeText(
      record.translation,
      "Faixa local pronta para tocar e editar no player.",
    ),
    lyricsPreview: normalizeText(
      record.lyricsPreview,
      "Sem letra automática. O player mostra apenas os dados configurados por você.",
    ),
    source: "local",
    src: objectUrl,
    storageId: record.id,
    persisted: true,
    blob: record.blob,
    fileName: record.fileName,
    mimeType: record.mimeType,
    size: record.size,
    lastModified: record.lastModified,
    createdAt: record.createdAt,
    sortOrder: Number.isFinite(record.sortOrder)
      ? record.sortOrder
      : (record.createdAt ?? index),
    cover: normalizeText(
      record.cover,
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80",
    ),
  };
}

export function getTrackKey(track) {
  if (!track) {
    return "track:unknown";
  }

  if (track.source === "youtube" && track.youtubeId) {
    return `youtube:${track.youtubeId}`;
  }

  if (track.source === "local" && (track.storageId || track.id)) {
    return `local:${track.storageId ?? track.id}`;
  }

  return `${track.source ?? "track"}:${track.id ?? createRuntimeId("track")}`;
}

export function moveArrayItem(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (typeof movedItem === "undefined") {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export function buildPersistedRecordFromTrack(track, index = 0) {
  return {
    id: normalizeText(
      track.storageId ?? track.id,
      createRuntimeId(`local-db-${index}`),
    ),
    fileName: normalizeText(
      track.fileName,
      `${normalizeText(track.title, `faixa-${index + 1}`)}.bin`,
    ),
    mimeType: normalizeText(track.mimeType, track.blob?.type ?? "audio/mpeg"),
    size: Number(track.size ?? track.blob?.size ?? 0),
    lastModified: Number(track.lastModified ?? Date.now()),
    createdAt: Number(track.createdAt ?? Date.now() + index),
    sortOrder: Number(track.sortOrder ?? index),
    title: normalizeText(track.title, `Faixa local ${index + 1}`),
    artist: normalizeText(track.artist, "Arquivo local"),
    album: normalizeText(track.album, "Biblioteca local"),
    genre: normalizeText(track.genre, "Local"),
    translation: normalizeText(
      track.translation,
      "Faixa local pronta para tocar no player.",
    ),
    lyricsPreview: normalizeText(
      track.lyricsPreview,
      "Sem letra automática. O player mostra os dados configurados por você.",
    ),
    cover: normalizeText(
      track.cover,
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80",
    ),
    blob: track.blob,
  };
}

export function revokeTrackUrls(tracks) {
  tracks.forEach((track) => {
    if (track.source === "local" && track.src) {
      URL.revokeObjectURL(track.src);
    }
  });
}

export function createDetachedAudio() {
  const audio = new Audio();
  audio.preload = "metadata";
  return audio;
}

export function createStorageKey(key) {
  return `meu-player-audio:${key}`;
}

export function duplicatePlaylist(playlist, name) {
  return {
    ...playlist,
    id: createRuntimeId("playlist-copy"),
    name: sanitizePlaylistName(name, `${playlist.name} Copy`),
    tracks: playlist.tracks.map((track, index) => ({
      ...track,
      id: createRuntimeId(`track-copy-${index}`),
    })),
  };
}

export function serializePlaylistForExport(playlist) {
  return {
    playlists: [
      {
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks.map((track) => ({
          id: track.id,
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          cover: track.cover,
          translation: track.translation,
          lyricsPreview: track.lyricsPreview,
        })),
      },
    ],
  };
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result ?? ""));
    });

    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Não foi possível ler o blob."));
    });

    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl, mimeType = "application/octet-stream") {
  const [header, payload] = String(dataUrl ?? "").split(",");

  if (!header || !payload) {
    throw new Error("Backup inválido: data URL ausente.");
  }

  const detectedMimeType = header.match(/data:(.*?);base64/)?.[1] ?? mimeType;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: detectedMimeType });
}

export async function serializeLibraryBackup({
  uploadedTracks,
  userPlaylists,
  favoriteTrackKeys,
  settings,
}) {
  const uploadedItems = await Promise.all(
    uploadedTracks.map(async (track, index) => ({
      id: track.id,
      storageId: track.storageId ?? track.id,
      fileName: track.fileName,
      mimeType: track.mimeType,
      size: track.size,
      lastModified: track.lastModified,
      createdAt: track.createdAt,
      sortOrder: Number(track.sortOrder ?? index),
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      translation: track.translation,
      lyricsPreview: track.lyricsPreview,
      cover: track.cover,
      dataUrl: await blobToDataUrl(track.blob),
    })),
  );

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: settings ?? {},
    favoriteTrackKeys: Array.isArray(favoriteTrackKeys)
      ? favoriteTrackKeys
      : [],
    userPlaylists: Array.isArray(userPlaylists) ? userPlaylists : [],
    uploadedTracks: uploadedItems,
  };
}

export function parseLibraryBackup(rawText) {
  const payload = JSON.parse(rawText);
  const uploadedTracks = Array.isArray(payload.uploadedTracks)
    ? payload.uploadedTracks
    : [];

  return {
    settings:
      payload.settings && typeof payload.settings === "object"
        ? payload.settings
        : {},
    favoriteTrackKeys: Array.isArray(payload.favoriteTrackKeys)
      ? payload.favoriteTrackKeys.filter(Boolean)
      : [],
    userPlaylists: Array.isArray(payload.userPlaylists)
      ? payload.userPlaylists
      : [],
    uploadedRecords: uploadedTracks.map((track, index) => ({
      id: normalizeText(
        track.storageId ?? track.id,
        createRuntimeId(`backup-local-${index}`),
      ),
      fileName: normalizeText(track.fileName, `faixa-${index + 1}.bin`),
      mimeType: normalizeText(track.mimeType, "audio/mpeg"),
      size: Number(track.size ?? 0),
      lastModified: Number(track.lastModified ?? Date.now()),
      createdAt: Number(track.createdAt ?? Date.now() + index),
      sortOrder: Number(track.sortOrder ?? index),
      title: normalizeText(track.title, `Faixa local ${index + 1}`),
      artist: normalizeText(track.artist, "Arquivo local"),
      album: normalizeText(track.album, "Biblioteca local"),
      genre: normalizeText(track.genre, "Local"),
      translation: normalizeText(
        track.translation,
        "Faixa local restaurada a partir de backup.",
      ),
      lyricsPreview: normalizeText(
        track.lyricsPreview,
        "Sem letra automática. O player restaurou seus dados locais.",
      ),
      cover: normalizeText(
        track.cover,
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80",
      ),
      blob: dataUrlToBlob(track.dataUrl, track.mimeType),
    })),
  };
}

export function downloadJsonFile(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function createYouTubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
