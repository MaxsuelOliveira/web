import {
  buildLocalTrack,
  buildYouTubeTrack,
  createRuntimeId,
  createYouTubeCover,
  parseYouTubeEntries,
  sanitizePlaylistName,
} from "./utils.js";

export async function fetchOnlineTracks() {
  const response = await fetch("./assets/data/songs.json");

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar a playlist online.");
  }

  const data = await response.json();

  return data.map((track, index) => ({
    id: track.id ?? `online-${index}`,
    title: track.title ?? `Faixa ${index + 1}`,
    artist: track.artist ?? "Artista desconhecido",
    album: track.album ?? "Playlist online",
    genre: track.genre ?? "Online",
    translation:
      track.translation ??
      "Traducao ou resumo nao configurado para esta faixa.",
    lyricsPreview:
      track.lyricsPreview ?? "Trecho ou resumo autorizado nao configurado.",
    source: "youtube",
    youtubeId: track.youtubeId,
    cover:
      track.cover ?? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`,
  }));
}

export function createLocalTracks(fileList) {
  return Array.from(fileList).map((file, index) =>
    buildLocalTrack(file, index),
  );
}

async function fetchYouTubeMeta(videoId) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Nao foi possivel consultar oembed.");
    }

    const payload = await response.json();

    return {
      title: payload.title,
      artist: payload.author_name,
      cover: payload.thumbnail_url || createYouTubeCover(videoId),
    };
  } catch {
    return {
      title: `Video ${videoId}`,
      artist: "YouTube importado",
      cover: createYouTubeCover(videoId),
    };
  }
}

export async function createYouTubePlaylist(name, rawInput) {
  const videoIds = parseYouTubeEntries(rawInput);

  if (!videoIds.length) {
    throw new Error("Adicione pelo menos um link valido do YouTube.");
  }

  const playlistName = sanitizePlaylistName(name);
  const metaList = await Promise.all(
    videoIds.map((videoId) => fetchYouTubeMeta(videoId)),
  );

  return {
    id: createRuntimeId("playlist"),
    name: playlistName,
    tracks: videoIds.map((videoId, index) =>
      buildYouTubeTrack(
        {
          youtubeId: videoId,
          title: metaList[index].title,
          artist: metaList[index].artist,
          cover: metaList[index].cover,
          genre: "Playlist local",
          album: playlistName,
        },
        index,
        playlistName,
      ),
    ),
  };
}

function normalizeImportedPlaylist(playlist, playlistIndex) {
  const playlistName = sanitizePlaylistName(
    playlist.name ?? playlist.title,
    `Playlist importada ${playlistIndex + 1}`,
  );

  const tracks = (playlist.tracks ?? [])
    .map((track, index) => buildYouTubeTrack(track, index, playlistName))
    .filter(Boolean);

  return {
    id: playlist.id ?? createRuntimeId(`playlist-import-${playlistIndex}`),
    name: playlistName,
    tracks,
  };
}

export function parseImportedPlaylists(rawText) {
  const payload = JSON.parse(rawText);
  const candidatePlaylists = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.playlists)
      ? payload.playlists
      : [payload];

  const playlists = candidatePlaylists
    .map((playlist, index) => normalizeImportedPlaylist(playlist, index))
    .filter((playlist) => playlist.tracks.length > 0);

  if (!playlists.length) {
    throw new Error(
      "O JSON nao possui playlists validas com videos do YouTube.",
    );
  }

  return playlists;
}
