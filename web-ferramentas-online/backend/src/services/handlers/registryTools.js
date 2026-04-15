import { fetchJson, normalizeIdentifier } from "../../utils/http.js";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ferramentas-online",
};

async function getGithubProfile(payload) {
  const username = String(payload.username || "").trim();
  const response = await fetchJson(`https://api.github.com/users/${username}`, {
    headers: GITHUB_HEADERS,
  });
  return {
    summary: `Perfil GitHub localizado para ${username}.`,
    output: response,
  };
}

async function getGithubRepo(payload) {
  const owner = String(payload.owner || "").trim();
  const repo = String(payload.repo || "").trim();
  const response = await fetchJson(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: GITHUB_HEADERS,
    },
  );
  return {
    summary: `Repositorio ${owner}/${repo} localizado no GitHub.`,
    output: response,
  };
}

async function getNpmPackage(payload) {
  const packageName = String(payload.packageName || "").trim();
  const response = await fetchJson(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
  );
  return {
    summary: `Pacote NPM ${packageName} localizado.`,
    output: {
      name: response.name,
      description: response.description,
      distTags: response["dist-tags"],
      latestVersion: response["dist-tags"]?.latest,
      license: response.license,
      homepage: response.homepage,
      repository: response.repository,
    },
  };
}

async function getNpmDownloads(payload) {
  const packageName = String(payload.packageName || "").trim();
  const response = await fetchJson(
    `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(
      packageName,
    )}`,
  );
  return {
    summary: `Downloads da ultima semana recuperados para ${packageName}.`,
    output: response,
  };
}

async function getPypiPackage(payload) {
  const packageName = String(payload.packageName || "").trim();
  const response = await fetchJson(
    `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`,
  );
  return {
    summary: `Pacote PyPI ${packageName} localizado.`,
    output: {
      name: response.info?.name,
      version: response.info?.version,
      summary: response.info?.summary,
      homePage: response.info?.home_page,
      license: response.info?.license,
      requiresPython: response.info?.requires_python,
    },
  };
}

async function getIsbnBook(payload) {
  const isbn = normalizeIdentifier(payload.isbn);
  const response = await fetchJson(
    `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`,
  );
  return {
    summary: `Livro localizado para o ISBN ${isbn}.`,
    output: response,
  };
}

async function getCountry(payload) {
  const name = String(payload.name || "").trim();
  const response = await fetchJson(
    `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`,
  );
  return {
    summary: `Consulta de pais concluida para ${name}.`,
    output: Array.isArray(response) ? response[0] : response,
  };
}

async function getIbgeStates() {
  const response = await fetchJson(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
  );
  return {
    summary: `${response.length} UF(s) recuperada(s) do IBGE.`,
    output: response,
  };
}

async function getIbgeCities(payload) {
  const ufValue = String(payload.uf || "").trim().toUpperCase();
  const states = await fetchJson(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
  );
  const state = states.find(
    (item) =>
      item.sigla?.toUpperCase() === ufValue ||
      item.nome?.toUpperCase() === ufValue,
  );

  if (!state) {
    throw new Error("UF nao encontrada no IBGE.");
  }

  const response = await fetchJson(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.id}/municipios`,
  );

  return {
    summary: `${response.length} municipio(s) recuperado(s) para ${state.sigla}.`,
    output: response,
  };
}

export const registryToolHandlers = {
  githubProfileLookup: getGithubProfile,
  githubRepoLookup: getGithubRepo,
  npmPackageLookup: getNpmPackage,
  npmDownloadsLookup: getNpmDownloads,
  pypiPackageLookup: getPypiPackage,
  isbnLookup: getIsbnBook,
  countryLookup: getCountry,
  ibgeStatesLookup: getIbgeStates,
  ibgeCitiesLookup: getIbgeCities,
};
