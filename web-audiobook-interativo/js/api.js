const BASE_URL = "https://archive.org/advancedsearch.php";

// Busca audiobooks
export async function fetchAudiobooks({
  query = "",
  rows = 20,
  page = 1,
} = {}) {
  try {
    let searchQuery = "collection:(librivoxaudio)";
    if (query) {
      searchQuery += ` AND title:(${query})`;
    }

    const url = `${BASE_URL}?q=${encodeURIComponent(searchQuery)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=language&fl[]=description&rows=${rows}&page=${page}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    let results = data.response.docs;

    return results.map((book) => ({
      id: book.identifier,
      title: book.title,
      author: book.creator || "Autor desconhecido",
      language: book.language || "Desconhecido",
      description: book.description || "",
    }));
  } catch (error) {
    console.error("Erro ao buscar audiobooks:", error);
    return [];
  }
}

// Busca os arquivos MP3 de um audiobook específico
export async function fetchAudiobookFiles(identifier) {
  try {
    const url = `https://archive.org/metadata/${identifier}`;
    const response = await fetch(url);
    const data = await response.json();

    const files = data.files
      .filter((file) => file.name.endsWith(".mp3"))
      .map((file) => ({
        name: file.name,
        url: `https://archive.org/download/${identifier}/${file.name}`,
      }));

    return files;
  } catch (error) {
    console.error("Erro ao buscar arquivos do audiobook:", error);
    return [];
  }
}

// Busca audiobooks iniciais
export async function getAudiobookInit() {
  const initialResults = await fetchAudiobooks({
    rows: 10,
  });
  return initialResults;
}
