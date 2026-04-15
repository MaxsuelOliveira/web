import {
  fetchAudiobookFiles,
  fetchAudiobooks,
  getAudiobookInit,
} from "./api.js";

const audiobookUl = document.getElementById("audiobookUl");
const coverEl = document.getElementById("cover");
const bookTitleEl = document.getElementById("book-title");
const bookAuthorEl = document.getElementById("book-author");
const bookDescriptionEl = document.getElementById("book-description");
const episodesListEl = document.getElementById("episodes-list");
const buttonPlay = document.getElementById("play");
const buttonPause = document.getElementById("pause");
const buttonNext = document.getElementById("next");
const buttonPrevious = document.getElementById("previous");
const buttonRepeat = document.getElementById("repeat");

const audio = document.getElementById("audio");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeControl = document.getElementById("volume");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("results");

let playlist = [];
let currentIndex = 0;
let repeat = false;
let currentEpisodeIndex = 0;

// Popula lista de audiobooks inicial
async function renderAudiobookList() {
  const audiobooks = await getAudiobookInit();
  playlist = audiobooks;
  audiobookUl.innerHTML = "";
  if (!audiobooks.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum audiobook encontrado.";
    audiobookUl.appendChild(li);
    return;
  }
  audiobooks.forEach((book, idx) => {
    const li = document.createElement("li");
    li.className = "audiobook-card";
    li.tabIndex = 0;
    li.addEventListener("click", () => {
      currentIndex = idx;
      loadAudiobook(currentIndex);
      currentEpisodeIndex = 0;
      Array.from(audiobookUl.children).forEach((el) =>
        el.classList.remove("selected"),
      );
      li.classList.add("selected");
    });

    // Wrapper da capa com badge sobreposto
    const coverWrapper = document.createElement("div");
    coverWrapper.className = "audiobook-cover-wrapper";

    const coverImg = document.createElement("img");
    coverImg.className = "audiobook-cover";
    coverImg.src = `https://archive.org/services/img/${book.id}`;
    coverImg.alt = `Capa de ${book.title}`;
    coverImg.loading = "lazy";
    coverImg.onerror = () => {
      coverImg.src = "https://archive.org/images/archive.jpg";
    };
    coverWrapper.appendChild(coverImg);

    // Badge de idioma sobreposto na capa
    if (book.language) {
      const overlayBadge = document.createElement("span");
      overlayBadge.className = "audiobook-badge-overlay";
      overlayBadge.textContent = book.language;
      coverWrapper.appendChild(overlayBadge);
    }

    li.appendChild(coverWrapper);

    // Informações abaixo da capa
    const infoDiv = document.createElement("div");
    infoDiv.className = "audiobook-info";

    const titleDiv = document.createElement("div");
    titleDiv.className = "audiobook-title";
    titleDiv.title = book.title || "Sem título";
    titleDiv.textContent = book.title || "Sem título";
    infoDiv.appendChild(titleDiv);

    const authorDiv = document.createElement("div");
    authorDiv.className = "audiobook-author";
    authorDiv.textContent = book.author || "Autor desconhecido";
    infoDiv.appendChild(authorDiv);

    // Badges (episódios)
    const badgesDiv = document.createElement("div");
    badgesDiv.className = "audiobook-badges";

    fetchAudiobookFiles(book.id)
      .then((files) => {
        if (files && files.length) {
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = `${files.length} ep.`;
          badgesDiv.appendChild(badge);
        }
      })
      .catch(() => {});

    infoDiv.appendChild(badgesDiv);
    li.appendChild(infoDiv);
    audiobookUl.appendChild(li);
  });

  // Botões de carrossel (prev/next)
  const cardWidth = 150 + 16; // card width + gap
  document.getElementById("audiobookPrev").addEventListener("click", () => {
    audiobookUl.scrollBy({ left: -cardWidth * 2, behavior: "smooth" });
  });
  document.getElementById("audiobookNext").addEventListener("click", () => {
    audiobookUl.scrollBy({ left: cardWidth * 2, behavior: "smooth" });
  });
}

renderAudiobookList().then(() => {
  loadAudiobook(currentIndex);
});

// Formatar tempo
function formatTime(seconds) {
  const min = Math.floor(seconds / 60) || 0;
  const sec = Math.floor(seconds % 60) || 0;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Carrega audiobook
async function loadAudiobook(index) {
  if (!playlist[index]) return;
  resultsContainer.innerHTML =
    '<div class="dots-loader"><span></span><span></span><span></span><span></span><span></span></div>';
  try {
    // Buscar detalhes completos do audiobook
    const identifier = playlist[index].id;
    const metaUrl = `https://archive.org/metadata/${identifier}`;
    const metaResp = await fetch(metaUrl);
    const metaData = await metaResp.json();

    // Título, autor, descrição
    const meta = metaData.metadata || {};
    bookTitleEl.textContent = meta.title || "Título desconhecido";
    bookAuthorEl.textContent = meta.creator || "Autor desconhecido";

    // Limita descrição a dois parágrafos
    let desc = meta.description || "";
    let descHtml = desc;
    let fullDesc = desc;
    if (desc) {
      // Quebra em parágrafos
      let paragraphs = desc
        .split(/<br\s*\/?>|\n|\r|<p>|<\/p>/i)
        .filter((p) => p.trim());
      if (paragraphs.length > 2) {
        descHtml = `<p>${paragraphs[0]}</p><p>${paragraphs[1]}</p><span class='desc-ellipsis'>... <button id='showFullDesc' class='badge' style='margin-left:4px;'>Ver mais</button></span>`;
      } else {
        descHtml = paragraphs.map((p) => `<p>${p}</p>`).join("");
      }
    }
    bookDescriptionEl.innerHTML = descHtml;

    // Dialog para descrição completa
    let dialog = document.getElementById("descDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "descDialog";
      dialog.innerHTML = `
        <div class="dialog-inner">
          <div id='descDialogContent'></div>
          <button id='closeDescDialog' class='dialog-close-btn'>Fechar</button>
        </div>
      `;
      document.body.appendChild(dialog);
      // Fechar ao clicar fora da caixa
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
      });
    }
    // Evento para abrir dialog
    setTimeout(() => {
      const btn = document.getElementById("showFullDesc");
      if (btn) {
        btn.onclick = () => {
          document.getElementById("descDialogContent").innerHTML =
            `<h2>${meta.title || ""}</h2><h3>${meta.creator || ""}</h3><div style='margin:1rem 0;'>${fullDesc}</div>`;
          dialog.showModal();
        };
      }
      const closeBtn = document.getElementById("closeDescDialog");
      if (closeBtn) closeBtn.onclick = () => dialog.close();
    }, 0);

    // Capa
    let coverFile = null;
    if (metaData.files && Array.isArray(metaData.files)) {
      coverFile = metaData.files.find((f) => /\.(jpg|jpeg|png)$/i.test(f.name));
    }
    if (coverFile) {
      const coverSrc = `https://archive.org/download/${identifier}/${coverFile.name}`;
      coverEl.src = coverSrc;
      extractThemeFromUrl(coverSrc);
    } else {
      coverEl.src = "https://archive.org/images/icons/audio_item.png";
      extractThemeFromUrl("https://archive.org/images/icons/audio_item.png");
    }

    // Episódios (arquivos mp3)
    episodesListEl.innerHTML = "";
    const episodes = (metaData.files || []).filter((f) =>
      f.name.endsWith(".mp3"),
    );
    if (episodes.length) {
      episodes.forEach((ep, idx) => {
        const li = document.createElement("li");
        li.className = "episode-item";
        li.textContent = ep.title || ep.name;
        li.tabIndex = 0;
        li.addEventListener("click", () => {
          audio.src = `https://archive.org/download/${identifier}/${ep.name}`;
          audio.load();
          audio.play();
          // Seleção visual
          Array.from(episodesListEl.children).forEach((el) =>
            el.classList.remove("selected"),
          );
          li.classList.add("selected");
        });
        episodesListEl.appendChild(li);
      });
      // Seleciona o primeiro episódio por padrão
      const first = episodesListEl.querySelector(".episode-item");
      if (first) first.classList.add("selected");
      audio.src = `https://archive.org/download/${identifier}/${episodes[0].name}`;
      audio.load();
    } else {
      const li = document.createElement("li");
      li.textContent = "Nenhum episódio encontrado.";
      episodesListEl.appendChild(li);
      audio.src = "";
    }

    // Scroll suave com mouse na área de episódios
    episodesListEl.addEventListener(
      "wheel",
      (e) => {
        if (episodesListEl.scrollHeight > episodesListEl.clientHeight) {
          e.preventDefault();
          episodesListEl.scrollTop += e.deltaY;
        }
      },
      { passive: false },
    );

    resultsContainer.innerHTML = "";
    // 🔥 Recupera posição salva
    const savedTime = localStorage.getItem(`audiobook-${index}`);
    if (savedTime) {
      audio.currentTime = Number(savedTime);
    }
  } catch (e) {
    resultsContainer.innerHTML = "";
    audio.src = "";
    coverEl.src = "https://archive.org/images/icons/audio_item.png";
    bookTitleEl.textContent = "Título desconhecido";
    bookAuthorEl.textContent = "Autor desconhecido";
    bookDescriptionEl.textContent = "";
    episodesListEl.innerHTML = "";
  }
}

// Busca audiobooks
searchButton.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  resultsContainer.innerHTML =
    '<div class="dots-loader"><span></span><span></span><span></span><span></span><span></span></div>';
  const results = await fetchAudiobooks({ query: query });

  // Atualiza playlist e lista
  playlist = results;
  audiobookUl.innerHTML = "";
  if (!results.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum audiobook encontrado.";
    audiobookUl.appendChild(li);
    resultsContainer.innerHTML = "";
    return;
  }
  results.forEach((book, idx) => {
    const li = document.createElement("li");
    li.textContent = `${book.title} - ${book.author}`;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      currentIndex = idx;
      loadAudiobook(currentIndex);
    });
    audiobookUl.appendChild(li);
  });
  resultsContainer.innerHTML = "";
  console.log("Resultados:", results);
});

// =============================================
// Tema dinâmico baseado na capa do audiobook
// =============================================

// Carrega a imagem em um Image auxiliar (com crossOrigin) para extração de cor
// sem interferir na exibição do coverEl visível
function extractThemeFromUrl(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => applyThemeFromCover(img);
  img.onerror = () => {}; // CORS negado — mantém tema atual silenciosamente
  img.src = src;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function applyThemeFromCover(imgEl) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, 60, 60);
    const data = ctx.getImageData(0, 0, 60, 60).data;

    // Encontra a cor mais vibrante e visível da imagem
    let bestR = 29,
      bestG = 185,
      bestB = 84,
      bestScore = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];
      if (a < 200) continue;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      const brightness = max / 255;
      const saturation = max === 0 ? 0 : (max - min) / max;
      // Prefere cores saturadas e com brilho moderado (não muito escuro nem muito claro)
      const score =
        saturation * (brightness > 0.15 && brightness < 0.92 ? 1 : 0.1);
      if (score > bestScore) {
        bestScore = score;
        bestR = r;
        bestG = g;
        bestB = b;
      }
    }

    const [h, s] = rgbToHsl(bestR, bestG, bestB);
    const root = document.documentElement.style;

    // Fundos: muito escuros com leve tint do hue extraído
    root.setProperty("--spotify-dark", `hsl(${h}, ${Math.min(22, s)}%, 8%)`);
    root.setProperty("--spotify-black", `hsl(${h}, ${Math.min(18, s)}%, 11%)`);
    root.setProperty("--spotify-card", `hsl(${h}, ${Math.min(16, s)}%, 15%)`);
    root.setProperty("--theme-player-bg", `hsl(${h}, ${Math.min(14, s)}%, 5%)`);
    root.setProperty(
      "--theme-search-top",
      `hsl(${h}, ${Math.min(30, s)}%, 14%)`,
    );
    root.setProperty(
      "--theme-search-bottom",
      `hsl(${h}, ${Math.min(20, s)}%, 8%)`,
    );

    // Cor de destaque: vibrante com brilho seguro para contraste (WCAG AA)
    // Garante luminosidade >= 45% para texto preto e contraste com fundo escuro
    const accentS = Math.max(60, Math.min(100, s));
    const accentL = Math.max(50, Math.min(65, 55)); // sempre na faixa segura
    root.setProperty("--spotify-green", `hsl(${h}, ${accentS}%, ${accentL}%)`);
  } catch (e) {
    // Erro de cross-origin ou canvas — mantém tema atual
  }
}

// Sincroniza botões play/pause com o estado real do áudio
audio.addEventListener("play", () => {
  buttonPlay.style.display = "none";
  buttonPause.style.display = "";
});

audio.addEventListener("pause", () => {
  buttonPlay.style.display = "";
  buttonPause.style.display = "none";
});

// Play
buttonPlay.addEventListener("click", () => {
  audio.play();
});

// Pause
buttonPause.addEventListener("click", () => {
  audio.pause();
});

// Next
buttonNext.addEventListener("click", () => {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
  } else if (repeat) {
    currentIndex = 0;
  }

  loadAudiobook(currentIndex);
  audio.play();
});

// Previous
buttonPrevious.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
  }

  loadAudiobook(currentIndex);
  audio.play();
});

// Repeat
buttonRepeat.addEventListener("click", () => {
  repeat = !repeat;
});

// Quando metadados carregam (duração disponível)
audio.addEventListener("loadedmetadata", () => {
  progress.max = Math.floor(audio.duration);
  durationEl.textContent = formatTime(audio.duration);
  updateProgressFill();
});

// Atualiza fill dinâmico da barra de progresso
function updateProgressFill() {
  const max = progress.max || 1;
  const pct = (progress.value / max) * 100;
  progress.style.background = `linear-gradient(to right, #1db954 ${pct}%, #4d4d4d ${pct}%)`;
}

// Atualiza progresso em tempo real
audio.addEventListener("timeupdate", () => {
  progress.value = Math.floor(audio.currentTime);
  currentTimeEl.textContent = formatTime(audio.currentTime);
  updateProgressFill();

  // 🔥 Salva posição automaticamente
  localStorage.setItem(`audiobook-${currentIndex}`, audio.currentTime);
});

// Barra de progresso clicável
progress.addEventListener("input", () => {
  audio.currentTime = progress.value;
  updateProgressFill();
});

// Volume
volumeControl.addEventListener("input", () => {
  audio.volume = volumeControl.value;
  localStorage.setItem("volume", volumeControl.value);
});

// Recupera volume salvo
const savedVolume = localStorage.getItem("volume");
if (savedVolume !== null) {
  audio.volume = savedVolume;
  volumeControl.value = savedVolume;
}

// Quando termina
audio.addEventListener("ended", () => {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
  } else if (repeat) {
    currentIndex = 0;
  } else {
    return;
  }

  loadAudiobook(currentIndex);
  audio.play();
});

// Inicializa
// loadAudiobook(currentIndex); // Agora chamado após renderAudiobookList
