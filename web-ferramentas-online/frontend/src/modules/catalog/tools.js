import generatorTools from "./toolGroups/generatorTools";
import lookupTools from "./toolGroups/lookupTools";
import testerTools from "./toolGroups/testerTools";
import textTools from "./toolGroups/textTools";

const FEATURED_NEW_TOOL_IDS = [
  "dnsA",
  "sslCertificate",
  "githubRepoLookup",
  "npmPackageLookup",
  "nicknameGenerator",
  "emoticonGenerator",
  "emojiComboGenerator",
  "bioGenerator",
  "hashtagGenerator",
  "csvToJson",
  "jsonToCsv",
  "nanoIdGenerator",
  "apiKeyGenerator",
  "jsonValidator",
  "passwordStrength",
];

const QUICK_ACCESS_TOOL_IDS = [
  "jsonFormat",
  "base64",
  "csvToJson",
  "jsonValidator",
  "httpTester",
  "passwordGenerator",
  "nicknameGenerator",
  "emoticonGenerator",
  "dnsA",
  "cep",
];

const PRIORITY_ORDER = [
  "jsonFormat",
  "base64",
  "httpTester",
  "jsonValidator",
  "csvToJson",
  "jsonToCsv",
  "passwordGenerator",
  "nicknameGenerator",
  "emoticonGenerator",
  "emojiComboGenerator",
  "hashtagGenerator",
  "bioGenerator",
  "teamNameGenerator",
  "projectNameGenerator",
  "emailAliasGenerator",
  "filenameGenerator",
  "cssAnimationGenerator",
  "avatarSvgGenerator",
  "wifiPayloadGenerator",
  "commitMessageGenerator",
  "nanoIdGenerator",
  "apiKeyGenerator",
  "cep",
  "cnpj",
  "dnsA",
  "sslCertificate",
  "passwordStrength",
  "jwtDecoder",
  "uuidGenerator",
  "caseConverter",
  "textStats",
  "urlTools",
  "githubRepoLookup",
  "npmPackageLookup",
  "lookupIp",
].reduce((accumulator, id, index) => {
  accumulator[id] = index;
  return accumulator;
}, {});

const CUSTOM_TAGS = {
  cep: ["brasil", "endereco"],
  cnpj: ["empresa", "cadastro"],
  ddd: ["telefone", "brasil"],
  ncm: ["fiscal", "tributario"],
  fipeMarcas: ["veiculos", "preco"],
  fipePreco: ["veiculos", "mercado"],
  banks: ["financeiro", "codigo"],
  taxas: ["juros", "economia"],
  registroBr: ["dominio", "dns"],
  cptecClima: ["tempo", "cidade"],
  ipInfo: ["rede", "internet"],
  ipLookup: ["rede", "geoip"],
  reverseDns: ["dns", "host"],
  dnsA: ["dns", "infra"],
  dnsMx: ["dns", "email"],
  dnsNs: ["dns", "nameserver"],
  dnsTxt: ["dns", "spf"],
  sslCertificate: ["ssl", "seguranca"],
  httpHeadersLookup: ["http", "headers"],
  robotsLookup: ["seo", "crawler"],
  sitemapLookup: ["seo", "xml"],
  githubProfileLookup: ["github", "dev"],
  githubRepoLookup: ["github", "repositorio"],
  npmPackageLookup: ["npm", "javascript"],
  npmDownloadsLookup: ["npm", "metricas"],
  pypiPackageLookup: ["python", "pypi"],
  isbnLookup: ["livros", "isbn"],
  countryLookup: ["pais", "geografia"],
  ibgeStatesLookup: ["ibge", "brasil"],
  ibgeCitiesLookup: ["ibge", "municipios"],
  jsonFormat: ["json", "formatacao"],
  base64: ["encode", "decode"],
  caseConverter: ["camel", "snake"],
  urlTools: ["url", "encode"],
  textStats: ["texto", "analise"],
  slugify: ["seo", "slug"],
  csvToJson: ["csv", "json"],
  jsonToCsv: ["json", "csv"],
  extractEmails: ["emails", "extracao"],
  extractUrls: ["links", "extracao"],
  wordFrequency: ["texto", "frequencia"],
  apiKeyGenerator: ["api", "keys"],
  nanoIdGenerator: ["ids", "frontend"],
  fakeUserGenerator: ["mock", "seed"],
  mockJsonGenerator: ["mock", "json"],
  sqlSeedGenerator: ["sql", "seed"],
  pixKeyGenerator: ["pix", "financeiro"],
  nicknameGenerator: ["nick", "apelido"],
  emoticonGenerator: ["emoticon", "carinhas"],
  emojiComboGenerator: ["emoji", "combos"],
  bioGenerator: ["perfil", "instagram"],
  hashtagGenerator: ["social", "marketing"],
  teamNameGenerator: ["squad", "team"],
  projectNameGenerator: ["startup", "produto"],
  emailAliasGenerator: ["email", "alias"],
  filenameGenerator: ["arquivo", "padrao"],
  cssAnimationGenerator: ["css", "animacao"],
  avatarSvgGenerator: ["avatar", "svg"],
  wifiPayloadGenerator: ["wifi", "qr"],
  commitMessageGenerator: ["git", "commit"],
  httpTester: ["http", "api"],
  regexTester: ["regex", "validacao"],
  jwtDecoder: ["jwt", "token"],
  hashGenerator: ["sha256", "hash"],
  jsonValidator: ["json", "validacao"],
  passwordStrength: ["senha", "seguranca"],
  hmacSha256: ["assinatura", "hash"],
  xmlValidator: ["xml", "validacao"],
  xmlFormatter: ["xml", "formatacao"],
  semverComparator: ["versao", "semver"],
  unixTimestampConverter: ["tempo", "timestamp"],
};

function tokenize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getFamilyTag(family) {
  if (family === "lookup") {
    return ["consulta", "dados"];
  }

  if (family === "generator") {
    return ["geracao", "mock"];
  }

  if (family === "tester") {
    return ["teste", "validacao"];
  }

  return ["texto", "transformacao"];
}

function enrichTool(tool) {
  const tags = unique([
    ...getFamilyTag(tool.family),
    tool.category,
    tool.badge,
    ...tokenize(tool.slug),
    ...tokenize(tool.name),
    ...(CUSTOM_TAGS[tool.id] || []),
  ]);

  return {
    ...tool,
    tags,
    isFeaturedNew: FEATURED_NEW_TOOL_IDS.includes(tool.id),
    isQuickAccess: QUICK_ACCESS_TOOL_IDS.includes(tool.id),
    priority: PRIORITY_ORDER[tool.id] ?? 999,
  };
}

const tools = [...lookupTools, ...textTools, ...generatorTools, ...testerTools]
  .map(enrichTool)
  .sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    if (left.isFeaturedNew !== right.isFeaturedNew) {
      return left.isFeaturedNew ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });

export const featuredNewTools = tools.filter((tool) => tool.isFeaturedNew);
export const quickAccessTools = tools.filter((tool) => tool.isQuickAccess);
export const highlightedTags = unique(
  tools
    .filter((tool) => tool.isFeaturedNew || tool.isQuickAccess)
    .flatMap((tool) => tool.tags)
    .filter((tag) => tag.length >= 3),
).slice(0, 16);

export default tools;
