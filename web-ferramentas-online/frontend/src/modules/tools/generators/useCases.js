import { slugifyText } from "../../../lib/utils";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%&*()_+-=[]{}<>?";
const HEX = "0123456789ABCDEF";
const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(
    " ",
  );
const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elisa",
  "Fabio",
  "Gabriela",
  "Heitor",
  "Isabela",
  "Joao",
  "Karen",
  "Lucas",
  "Marina",
  "Nina",
  "Otavio",
  "Paula",
];
const LAST_NAMES = [
  "Silva",
  "Souza",
  "Oliveira",
  "Costa",
  "Almeida",
  "Santos",
  "Moura",
  "Ribeiro",
  "Ferreira",
  "Barbosa",
];
const CITIES = [
  "Salvador",
  "Sao Paulo",
  "Recife",
  "Fortaleza",
  "Curitiba",
  "Belo Horizonte",
  "Florianopolis",
  "Goiania",
];
const STATES = ["BA", "SP", "PE", "CE", "PR", "MG", "SC", "GO"];
const STREETS = [
  "Rua das Flores",
  "Avenida Central",
  "Rua do Sol",
  "Travessa Aurora",
  "Alameda Verde",
  "Rua do Comercio",
];
const DOMAINS = ["devmail.com", "empresa.test", "mock.dev", "sandbox.app"];
const NICKNAME_STYLES = {
  gamer: {
    prefixes: ["Shadow", "Pixel", "Nova", "Turbo", "Ghost", "Zero"],
    suffixes: ["X", "77", "Rush", "Core", "EX", "Prime"],
  },
  clean: {
    prefixes: ["hey", "go", "use", "real", "meta", "next"],
    suffixes: ["lab", "dev", "studio", "hq", "flow", "works"],
  },
  cute: {
    prefixes: ["Luna", "Mimi", "Cherry", "Neko", "Panda", "Star"],
    suffixes: ["chan", "zinha", "pop", "kiss", "moon", "spark"],
  },
  dark: {
    prefixes: ["Void", "Noir", "Night", "Raven", "Venom", "Obsidian"],
    suffixes: ["hex", "shade", "grim", "bite", "zero", "vex"],
  },
};
const EMOTICON_SETS = {
  classic: {
    happy: [":)", ":D", "=)", "^^", "xD", ":]"],
    love: ["<3", "s2", "*-*", ":3", "^3^", "=^.^="],
    shrug: ["¯\\_(ツ)_/¯", ":/", "-_-", "._.", "o_o", "meh"],
    sad: [":(", "T_T", ":'(", "):", "=/", "q_q"],
    rage: [">:(", "D:<", "ಠ_ಠ", ">:D", "grr", ">:["],
  },
  kaomoji: {
    happy: ["(＾▽＾)", "(*^‿^*)", "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "(≧▽≦)", "(✿◠‿◠)"],
    love: ["(づ｡◕‿‿◕｡)づ", "(♡°▽°♡)", "(っ˘з(˘⌣˘ )", "(❤ω❤)", "(つ≧▽≦)つ"],
    shrug: ["┐(￣ヘ￣)┌", "ヽ(ー_ー )ノ", "¯\\_(ツ)_/¯", "(・_・;)", "(￢_￢)"],
    sad: ["(╥﹏╥)", "(っ- ‸ - ς)", "(ಥ﹏ಥ)", "(︶︹︺)", "(ノ_<。)"],
    rage: ["(╯°□°）╯︵ ┻━┻", "(ಠ益ಠ)", "(ノಠ益ಠ)ノ", "ψ(｀∇´)ψ", "(＃`Д´)"],
  },
};
const EMOJI_THEMES = {
  celebration: ["🎉", "✨", "🥳", "🔥", "🚀", "🎊", "🙌", "🌟"],
  love: ["💘", "💕", "💫", "🌹", "🫶", "💞", "😍", "✨"],
  gamer: ["🎮", "🕹️", "🔥", "⚡", "👾", "🏆", "🚀", "💥"],
  study: ["📚", "🧠", "☕", "📝", "💡", "🎯", "⌛", "✨"],
  food: ["🍕", "🍔", "🌮", "🍟", "🍩", "☕", "😋", "🔥"],
  travel: ["✈️", "🧳", "🌎", "📸", "🏝️", "🗺️", "☀️", "🚗"],
};
const BIO_TEMPLATE_BANK = {
  professional: [
    "Construindo projetos de {niche} com foco em clareza e performance.",
    "Transformando ideias de {niche} em produtos simples de usar.",
    "Atuo com {niche} conectando estrategia, execucao e resultado.",
    "Operacao diaria em {niche}, qualidade alta e entrega consistente.",
  ],
  creator: [
    "Criando conteudo sobre {niche} sem enrolacao.",
    "Bastidores, dicas e experimentos reais de {niche}.",
    "Compartilho processos, falhas e acertos em {niche}.",
    "Rotina criativa focada em {niche}, teste e evolucao.",
  ],
  gamer: [
    "Gameplay, setups e papo reto sobre {niche}.",
    "Viciado em {niche}, rank, grind e highlights.",
    "Dropando dicas de {niche} e clipes da madrugada.",
    "Hud ligado, foco em {niche} e zero tilt.",
  ],
  store: [
    "Novidades de {niche} com envio rapido e atendimento humano.",
    "Curadoria de {niche} para quem quer comprar melhor.",
    "Selecao de {niche} com estoque, preco e suporte no mesmo lugar.",
    "Loja focada em {niche} com oferta nova toda semana.",
  ],
};
const BIO_EXTRAS = [
  "DM aberta.",
  "Novos projetos sempre bem-vindos.",
  "Atualizacoes semanais.",
  "Parcerias sob consulta.",
  "Sem formula pronta, so pratica.",
];
const TEAM_ADJECTIVES = [
  "Atlas",
  "Pulse",
  "Vertex",
  "Nova",
  "Delta",
  "Turbo",
  "Orbit",
  "Nexus",
  "Signal",
  "Aurora",
];
const TEAM_NOUNS = [
  "Squad",
  "Lab",
  "Crew",
  "Guild",
  "Forge",
  "Collective",
  "Studio",
  "Ops",
  "Unit",
  "Hub",
];
const PROJECT_PREFIXES = [
  "Pulse",
  "Atlas",
  "Nexus",
  "Orbit",
  "Prisma",
  "Signal",
  "Vector",
  "Nova",
  "Flux",
  "Spark",
];
const PROJECT_SUFFIXES = [
  "Flow",
  "Core",
  "Sync",
  "Desk",
  "Cloud",
  "Pilot",
  "Bridge",
  "Stack",
  "Track",
  "Loop",
];
const FILE_SUFFIXES = ["v1", "final", "draft", "backup", "revA", "2026"];
const AVATAR_COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#0f766e",
  "#334155",
  "#059669",
];
const COMMIT_SUMMARIES = {
  feat: [
    "adiciona fluxo principal",
    "inclui nova ferramenta no catalogo",
    "implementa geracao adicional",
  ],
  fix: [
    "corrige validacao do formulario",
    "ajusta retorno exibido ao usuario",
    "resolve tratamento de estado vazio",
  ],
  refactor: [
    "organiza helpers de geracao",
    "simplifica composicao do modulo",
    "reduz duplicacao de logica",
  ],
  chore: [
    "atualiza configuracoes do projeto",
    "limpa detalhes de implementacao",
    "padroniza nomes internos",
  ],
  docs: [
    "documenta novo fluxo de uso",
    "explica parametros das ferramentas",
    "melhora descricao das funcionalidades",
  ],
  test: [
    "cobre casos principais do gerador",
    "adiciona cenarios de validacao",
    "verifica saidas em lote",
  ],
};

function sample(collection) {
  return collection[Math.floor(Math.random() * collection.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length, characters) {
  return Array.from({ length }, () => sample(characters)).join("");
}

function clampCount(value, max = 20) {
  return Math.max(1, Math.min(max, Number(value || 1)));
}

function clampLength(value, fallback = 16, min = 4, max = 64) {
  return Math.max(min, Math.min(max, Number(value || fallback)));
}

function capitalize(value) {
  const text = String(value || "").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : "";
}

function splitWords(value) {
  return slugifyText(value).split("-").filter(Boolean);
}

function toPascalCase(words) {
  return words.map(capitalize).join("");
}

function toCamelCase(words) {
  const pascalCase = toPascalCase(words);
  return pascalCase
    ? `${pascalCase.charAt(0).toLowerCase()}${pascalCase.slice(1)}`
    : "";
}

function toNamingStyle(words, style) {
  if (style === "snake") {
    return words.join("_");
  }

  if (style === "camel") {
    return toCamelCase(words);
  }

  if (style === "pascal") {
    return toPascalCase(words);
  }

  return words.join("-");
}

function shuffle(values) {
  const cloned = [...values];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function createUniqueValues(count, factory) {
  const values = [];
  const seen = new Set();
  const maxAttempts = Math.max(20, count * 30);

  for (let attempt = 0; attempt < maxAttempts && values.length < count; attempt += 1) {
    const value = factory(values.length, attempt);
    const signature =
      typeof value === "string" ? value : JSON.stringify(value);

    if (!seen.has(signature)) {
      seen.add(signature);
      values.push(value);
    }
  }

  return values;
}

function generateCpfDigit(digits) {
  const factor = digits.length + 1;
  const total = digits.reduce(
    (sum, digit, index) => sum + digit * (factor - index),
    0,
  );
  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function generateCnpjDigit(digits) {
  const weights =
    digits.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const total = digits.reduce(
    (sum, digit, index) => sum + digit * weights[index],
    0,
  );
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function generateCpf() {
  const digits = Array.from({ length: 9 }, () => randomInt(0, 9));
  digits.push(generateCpfDigit(digits));
  digits.push(generateCpfDigit(digits));
  return digits.join("");
}

function generateCnpj() {
  const digits = Array.from({ length: 12 }, () => randomInt(0, 9));
  digits.push(generateCnpjDigit(digits));
  digits.push(generateCnpjDigit(digits));
  return digits.join("");
}

function generateNanoId(length) {
  return randomString(
    length,
    `${LOWERCASE}${UPPERCASE}${NUMBERS}_-`,
  );
}

function generateApiKey(prefix, length) {
  const token = randomString(length, `${LOWERCASE}${UPPERCASE}${NUMBERS}`);
  return prefix ? `${slugifyText(prefix).replace(/-/g, "_")}_${token}` : token;
}

function generateCoupon(prefix, length) {
  const coupon = randomString(length, `${UPPERCASE}${NUMBERS}`);
  return prefix ? `${prefix.toUpperCase()}-${coupon}` : coupon;
}

function randomHexColor() {
  return `#${randomString(6, HEX)}`;
}

function createFakeUser(index) {
  const firstName = sample(FIRST_NAMES);
  const lastName = sample(LAST_NAMES);
  const username = slugifyText(`${firstName}.${lastName}.${index + 1}`).replace(
    /-/g,
    "",
  );

  return {
    id: index + 1,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${username}@${sample(DOMAINS)}`,
    username,
    role: sample(["admin", "editor", "viewer", "analyst"]),
  };
}

function createFakeAddress(index) {
  return {
    id: index + 1,
    street: `${sample(STREETS)}, ${randomInt(10, 9999)}`,
    district: sample(["Centro", "Jardim", "Boa Vista", "Vila Nova"]),
    city: sample(CITIES),
    state: sample(STATES),
    zipCode: `${randomInt(10000, 99999)}-${randomInt(100, 999)}`,
    complement: sample(["Apto 101", "Casa 2", "Sala 4", "Bloco B"]),
  };
}

function generateCreditCard(brand) {
  const specs = {
    visa: { prefix: "4", length: 16 },
    mastercard: { prefix: String(randomInt(51, 55)), length: 16 },
    amex: { prefix: sample(["34", "37"]), length: 15 },
  };
  const { prefix, length } = specs[brand] || specs.visa;
  const digits = prefix.split("").map(Number);

  while (digits.length < length - 1) {
    digits.push(randomInt(0, 9));
  }

  const checksum = digits
    .slice()
    .reverse()
    .map((digit, index) => {
      if (index % 2 === 0) {
        const doubled = digit * 2;
        return doubled > 9 ? doubled - 9 : doubled;
      }
      return digit;
    })
    .reduce((sum, digit) => sum + digit, 0);

  const lastDigit = (10 - (checksum % 10)) % 10;
  return [...digits, lastDigit].join("");
}

function generateLicensePlate(mode) {
  if (mode === "old") {
    return `${randomString(3, UPPERCASE)}-${randomString(4, NUMBERS)}`;
  }

  return `${randomString(3, UPPERCASE)}${randomString(
    1,
    NUMBERS,
  )}${randomString(1, UPPERCASE)}${randomString(2, NUMBERS)}`;
}

function generateEan13() {
  const digits = Array.from({ length: 12 }, () => randomInt(0, 9));
  const total = digits.reduce((sum, digit, index) => {
    const factor = index % 2 === 0 ? 1 : 3;
    return sum + digit * factor;
  }, 0);
  const checkDigit = (10 - (total % 10)) % 10;
  return [...digits, checkDigit].join("");
}

function generatePixKey(keyType) {
  if (keyType === "email") {
    const user = slugifyText(`${sample(FIRST_NAMES)}.${sample(LAST_NAMES)}`);
    return `${user}@${sample(DOMAINS)}`;
  }

  if (keyType === "phone") {
    return `+55${randomInt(11, 99)}9${randomInt(
      1000,
      9999,
    )}${randomInt(1000, 9999)}`;
  }

  if (keyType === "cpf") {
    return generateCpf();
  }

  return crypto.randomUUID();
}

function generateUserAgent(browser, device) {
  const chromeVersion = `${randomInt(118, 124)}.0.${randomInt(
    1000,
    9999,
  )}.${randomInt(10, 150)}`;
  const firefoxVersion = `${randomInt(118, 126)}.0`;
  const safariVersion = `${randomInt(15, 17)}.${randomInt(0, 6)}`;

  if (device === "mobile") {
    if (browser === "firefox") {
      return `Mozilla/5.0 (Android 14; Mobile; rv:${firefoxVersion}) Gecko/${firefoxVersion} Firefox/${firefoxVersion}`;
    }

    if (browser === "safari") {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion} Mobile/15E148 Safari/604.1`;
    }

    return `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
  }

  if (browser === "firefox") {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${firefoxVersion}) Gecko/20100101 Firefox/${firefoxVersion}`;
  }

  if (browser === "safari") {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion} Safari/605.1.15`;
  }

  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

function createNickname(base, style) {
  const parts = NICKNAME_STYLES[style] || NICKNAME_STYLES.gamer;
  const source = base || `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)}`;
  const words = splitWords(source);
  const rootPascal = toPascalCase(words).slice(0, 14) || capitalize(sample(FIRST_NAMES));
  const rootCamel = toCamelCase(words).slice(0, 14) || sample(FIRST_NAMES).toLowerCase();

  if (style === "clean") {
    return sample([
      `${rootCamel}${sample(parts.suffixes)}`,
      `${sample(parts.prefixes)}${rootPascal}`,
      `${rootCamel}.${sample(parts.suffixes)}`,
      `${rootCamel}${randomInt(1, 99)}`,
    ]);
  }

  return sample([
    `${sample(parts.prefixes)}${rootPascal}`,
    `${rootPascal}${sample(parts.suffixes)}`,
    `${sample(parts.prefixes)}${rootPascal}${sample(parts.suffixes)}`,
    `${rootPascal}${randomInt(7, 999)}`,
  ]);
}

function createEmoticon(mood, style) {
  const bank =
    style === "mixed"
      ? [
          ...(EMOTICON_SETS.classic[mood] || EMOTICON_SETS.classic.happy),
          ...(EMOTICON_SETS.kaomoji[mood] || EMOTICON_SETS.kaomoji.happy),
        ]
      : EMOTICON_SETS[style]?.[mood] || EMOTICON_SETS.classic.happy;

  return sample(bank);
}

function createEmojiCombo(theme) {
  const bank = EMOJI_THEMES[theme] || EMOJI_THEMES.celebration;
  return shuffle(bank)
    .slice(0, randomInt(3, 5))
    .join(" ");
}

function createBio(niche, tone, index) {
  const templates = BIO_TEMPLATE_BANK[tone] || BIO_TEMPLATE_BANK.professional;
  const selectedNiche = niche || "criacao digital";
  const extra = BIO_EXTRAS[index % BIO_EXTRAS.length];
  return `${templates[index % templates.length].replace("{niche}", selectedNiche)} ${extra}`;
}

function createHashtag(topic, index) {
  const words = splitWords(topic || "criacao digital");
  const first = capitalize(words[0] || "digital");
  const second = capitalize(words[1] || "Hub");
  const root = toPascalCase(words) || "CriacaoDigital";
  const variations = [
    root,
    `${root}Tips`,
    `${root}Brasil`,
    `${root}Pro`,
    `${root}Lab`,
    `${first}${second}Now`,
    `${first}${second}2026`,
    `${first}Creator`,
    `${first}Insights`,
    `${second}Daily`,
    `${root}Online`,
    `${first}NaPratica`,
  ];

  return `#${variations[index] || `${root}${index + 1}`}`;
}

function createTeamName(theme) {
  const label = toPascalCase(splitWords(theme || "")) || sample(["Product", "Growth", "Ops", "Design"]);
  return sample([
    `${sample(TEAM_ADJECTIVES)} ${label} ${sample(TEAM_NOUNS)}`,
    `${sample(TEAM_ADJECTIVES)} ${sample(TEAM_NOUNS)}`,
    `${label} ${sample(TEAM_NOUNS)}`,
    `${sample(TEAM_ADJECTIVES)} ${label}`,
  ]);
}

function createProjectName(focus) {
  const label = toPascalCase(splitWords(focus || ""));
  const root = label || sample(["Flow", "Hub", "Desk", "Stack"]);
  return sample([
    `${sample(PROJECT_PREFIXES)}${root}`,
    `${root}${sample(PROJECT_SUFFIXES)}`,
    `${sample(PROJECT_PREFIXES)}${sample(PROJECT_SUFFIXES)}`,
    `${sample(PROJECT_PREFIXES)}${root}${randomInt(1, 9)}`,
  ]);
}

function sanitizeEmailLocalPart(value) {
  return String(value || "time")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "") || "time";
}

function sanitizeDomain(value) {
  return String(value || sample(DOMAINS))
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "") || sample(DOMAINS);
}

function createEmailAlias(base, domain, index) {
  const local = sanitizeEmailLocalPart(base || `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)}`);
  const tag = sample(["vip", "beta", "qa", "alerts", "support", "team", "inbox"]);
  const patterns = [
    `${local}@${domain}`,
    `${local}+${tag}${index + 1}@${domain}`,
    `${local}.${tag}.${index + 1}@${domain}`,
    `${local}-${tag}-${index + 1}@${domain}`,
    `${local}${String(index + 1).padStart(2, "0")}@${domain}`,
  ];

  return patterns[index % patterns.length];
}

function createFilename(base, extension, style, index) {
  const words = splitWords(base || "arquivo modelo");
  const suffix = FILE_SUFFIXES[index % FILE_SUFFIXES.length];
  const name = toNamingStyle([...words, suffix], style);
  const ext = String(extension || "txt").replace(/^\./, "").trim() || "txt";
  return `${name}.${ext}`;
}

function createCssAnimation(preset, index) {
  const name = `${preset}-${index + 1}`;
  const duration = `${(randomInt(12, 28) / 10).toFixed(1)}s`;
  const distance = randomInt(8, 28);
  const opacity = (Math.random() * 0.35 + 0.45).toFixed(2);

  if (preset === "pulse") {
    return `@keyframes ${name} {\n  0%, 100% { transform: scale(1); opacity: 1; }\n  50% { transform: scale(1.06); opacity: ${opacity}; }\n}\n\n.animate-${name} {\n  animation: ${name} ${duration} ease-in-out infinite;\n}`;
  }

  if (preset === "slide") {
    return `@keyframes ${name} {\n  0% { transform: translateX(-${distance}px); opacity: 0; }\n  100% { transform: translateX(0); opacity: 1; }\n}\n\n.animate-${name} {\n  animation: ${name} ${duration} cubic-bezier(0.22, 1, 0.36, 1) both;\n}`;
  }

  if (preset === "tilt") {
    return `@keyframes ${name} {\n  0%, 100% { transform: rotate(0deg); }\n  25% { transform: rotate(-${Math.max(2, Math.round(distance / 5))}deg); }\n  75% { transform: rotate(${Math.max(2, Math.round(distance / 6))}deg); }\n}\n\n.animate-${name} {\n  transform-origin: center;\n  animation: ${name} ${duration} ease-in-out infinite;\n}`;
  }

  return `@keyframes ${name} {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-${distance}px); }\n}\n\n.animate-${name} {\n  animation: ${name} ${duration} ease-in-out infinite;\n}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0].toUpperCase()).join("") || "AV";
}

function createAvatarSvg(name, shape, color) {
  const label = name || `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)}`;
  const initials = getInitials(label);
  const shapeMarkup =
    shape === "circle"
      ? `<circle cx="60" cy="60" r="60" fill="${color}" />`
      : `<rect width="120" height="120" rx="${shape === "rounded" ? 28 : 42}" fill="${color}" />`;

  return `<!-- ${escapeXml(label)} -->\n<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">\n  ${shapeMarkup}\n  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(initials)}</text>\n</svg>`;
}

function escapeWifiValue(value) {
  return String(value || "").replace(/([\\;,:"])/g, "\\$1");
}

export function executeGeneratorTool(toolId, payload) {
  if (toolId === "passwordGenerator") {
    const length = clampLength(payload.length, 16);
    const pool = [
      LOWERCASE,
      payload.uppercase ? UPPERCASE : "",
      payload.numbers ? NUMBERS : "",
      payload.symbols ? SYMBOLS : "",
    ].join("");
    const password = Array.from({ length }, () =>
      sample(pool || LOWERCASE),
    ).join("");

    return {
      summary: `Senha forte gerada com ${length} caracteres.`,
      output: password,
      meta: {
        length,
        uppercase: Boolean(payload.uppercase),
        numbers: Boolean(payload.numbers),
        symbols: Boolean(payload.symbols),
      },
    };
  }

  if (toolId === "uuidGenerator") {
    const count = clampCount(payload.count);
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    return {
      summary: `${count} UUIDs v4 gerados.`,
      output: uuids.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "loremGenerator") {
    const paragraphs = Math.max(
      1,
      Math.min(10, Number(payload.paragraphs || 3)),
    );
    const output = Array.from({ length: paragraphs }, () => {
      const size = 40 + Math.floor(Math.random() * 35);
      const words = Array.from({ length: size }, () => sample(LOREM_WORDS));
      const text = words.join(" ");
      return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
    }).join("\n\n");

    return {
      summary: `${paragraphs} paragrafos lorem gerados.`,
      output,
      meta: { paragraphs },
    };
  }

  if (toolId === "documentGenerator") {
    const value =
      payload.documentType === "cnpj" ? generateCnpj() : generateCpf();
    return {
      summary: `${payload.documentType?.toUpperCase() || "CPF"} valido gerado para ambiente de teste.`,
      output: value,
      meta: { documentType: payload.documentType || "cpf" },
    };
  }

  if (toolId === "nanoIdGenerator") {
    const length = clampLength(payload.length, 12, 6, 40);
    const count = clampCount(payload.count);
    const values = Array.from({ length: count }, () => generateNanoId(length));
    return {
      summary: `${count} Nano ID(s) gerado(s).`,
      output: values.join("\n"),
      meta: { length, count },
    };
  }

  if (toolId === "apiKeyGenerator") {
    const length = clampLength(payload.length, 32, 12, 80);
    const count = clampCount(payload.count);
    const prefix = String(payload.prefix || "").trim();
    const keys = Array.from({ length: count }, () =>
      generateApiKey(prefix, length),
    );
    return {
      summary: `${count} API key(s) gerada(s).`,
      output: keys.join("\n"),
      meta: { prefix, length, count },
    };
  }

  if (toolId === "couponCodeGenerator") {
    const length = clampLength(payload.length, 10, 4, 24);
    const count = clampCount(payload.count);
    const prefix = String(payload.prefix || "").trim();
    const coupons = Array.from({ length: count }, () =>
      generateCoupon(prefix, length),
    );
    return {
      summary: `${count} cupom(ns) gerado(s).`,
      output: coupons.join("\n"),
      meta: { prefix, length, count },
    };
  }

  if (toolId === "hexColorGenerator") {
    const count = clampCount(payload.count);
    const colors = Array.from({ length: count }, () => randomHexColor());
    return {
      summary: `${count} cor(es) HEX gerada(s).`,
      output: colors.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "gradientGenerator") {
    const count = clampCount(payload.count, 12);
    const gradients = Array.from({ length: count }, () => {
      const angle = randomInt(0, 360);
      return `linear-gradient(${angle}deg, ${randomHexColor()}, ${randomHexColor()})`;
    });
    return {
      summary: `${count} gradient(s) CSS gerado(s).`,
      output: gradients.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "fakeUserGenerator") {
    const count = clampCount(payload.count, 30);
    const users = Array.from({ length: count }, (_, index) =>
      createFakeUser(index),
    );
    return {
      summary: `${count} usuario(s) fake gerado(s).`,
      output: users,
      meta: { count },
    };
  }

  if (toolId === "fakeAddressGenerator") {
    const count = clampCount(payload.count, 30);
    const addresses = Array.from({ length: count }, (_, index) =>
      createFakeAddress(index),
    );
    return {
      summary: `${count} endereco(s) fake gerado(s).`,
      output: addresses,
      meta: { count },
    };
  }

  if (toolId === "usernameGenerator") {
    const count = clampCount(payload.count, 30);
    const base = String(payload.base || "").trim();
    const usernames = Array.from({ length: count }, (_, index) => {
      const source = base || `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)}`;
      return `${slugifyText(source).replace(/-/g, "_")}${randomInt(
        10 + index,
        999 + index,
      )}`;
    });
    return {
      summary: `${count} username(s) gerado(s).`,
      output: usernames.join("\n"),
      meta: { base: base || "aleatorio", count },
    };
  }

  if (toolId === "ipv4Generator") {
    const count = clampCount(payload.count, 50);
    const ips = Array.from({ length: count }, () =>
      Array.from({ length: 4 }, () => randomInt(1, 254)).join("."),
    );
    return {
      summary: `${count} IPv4(s) gerado(s).`,
      output: ips.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "macAddressGenerator") {
    const count = clampCount(payload.count, 50);
    const macs = Array.from({ length: count }, () =>
      Array.from({ length: 6 }, () => randomString(2, HEX)).join(":"),
    );
    return {
      summary: `${count} MAC address(es) gerado(s).`,
      output: macs.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "timestampGenerator") {
    const count = clampCount(payload.count, 20);
    const values = Array.from({ length: count }, (_, index) => {
      const date = new Date(Date.now() + index * 60_000);
      return {
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMilliseconds: date.getTime(),
        iso: date.toISOString(),
        local: date.toLocaleString("pt-BR"),
      };
    });
    return {
      summary: `${count} timestamp(s) gerado(s).`,
      output: values,
      meta: { count },
    };
  }

  if (toolId === "creditCardGenerator") {
    const brand = String(payload.brand || "visa");
    const count = clampCount(payload.count, 20);
    const cards = Array.from({ length: count }, () => ({
      brand,
      number: generateCreditCard(brand),
      cvv: randomString(brand === "amex" ? 4 : 3, NUMBERS),
      expiresAt: `${String(randomInt(1, 12)).padStart(2, "0")}/${randomInt(
        26,
        32,
      )}`,
    }));
    return {
      summary: `${count} cartao(oes) ${brand} gerado(s).`,
      output: cards,
      meta: { brand, count },
    };
  }

  if (toolId === "licensePlateGenerator") {
    const mode = String(payload.mode || "mercosul");
    const count = clampCount(payload.count, 30);
    const plates = Array.from({ length: count }, () =>
      generateLicensePlate(mode),
    );
    return {
      summary: `${count} placa(s) ${mode} gerada(s).`,
      output: plates.join("\n"),
      meta: { mode, count },
    };
  }

  if (toolId === "ean13Generator") {
    const count = clampCount(payload.count, 30);
    const values = Array.from({ length: count }, () => generateEan13());
    return {
      summary: `${count} codigo(s) EAN-13 gerado(s).`,
      output: values.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "pixKeyGenerator") {
    const keyType = String(payload.keyType || "evp");
    const count = clampCount(payload.count, 20);
    const keys = Array.from({ length: count }, () => generatePixKey(keyType));
    return {
      summary: `${count} chave(s) PIX ${keyType} gerada(s).`,
      output: keys.join("\n"),
      meta: { keyType, count },
    };
  }

  if (toolId === "htmlTableGenerator") {
    const rows = Math.max(1, Math.min(12, Number(payload.rows || 4)));
    const columns = Math.max(1, Math.min(8, Number(payload.columns || 3)));
    const header = Array.from({ length: columns }, (_, index) => `Coluna ${index + 1}`);
    const body = Array.from({ length: rows }, (_, rowIndex) =>
      `  <tr>${Array.from(
        { length: columns },
        (_, columnIndex) => `<td>Item ${rowIndex + 1}.${columnIndex + 1}</td>`,
      ).join("")}</tr>`,
    ).join("\n");
    const output = `<table>\n  <thead>\n    <tr>${header
      .map((item) => `<th>${item}</th>`)
      .join("")}</tr>\n  </thead>\n  <tbody>\n${body}\n  </tbody>\n</table>`;
    return {
      summary: `Tabela HTML com ${rows} linha(s) e ${columns} coluna(s) gerada.`,
      output,
      meta: { rows, columns },
    };
  }

  if (toolId === "mockJsonGenerator") {
    const items = clampCount(payload.items, 30);
    const output = Array.from({ length: items }, (_, index) => ({
      id: index + 1,
      name: `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)}`,
      email: `mock${index + 1}@${sample(DOMAINS)}`,
      active: Math.random() > 0.35,
      createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    }));
    return {
      summary: `${items} item(ns) mock em JSON gerado(s).`,
      output,
      meta: { items },
    };
  }

  if (toolId === "sqlSeedGenerator") {
    const rows = clampCount(payload.rows, 30);
    const tableName = slugifyText(payload.tableName || "users").replace(
      /-/g,
      "_",
    );
    const values = Array.from({ length: rows }, (_, index) => {
      const user = createFakeUser(index);
      return `INSERT INTO ${tableName} (name, email, role) VALUES ('${user.fullName}', '${user.email}', '${user.role}');`;
    });
    return {
      summary: `${rows} insert(s) SQL gerado(s) para ${tableName}.`,
      output: values.join("\n"),
      meta: { tableName, rows },
    };
  }

  if (toolId === "userAgentGenerator") {
    const browser = String(payload.browser || "chrome");
    const device = String(payload.device || "desktop");
    const count = clampCount(payload.count, 20);
    const values = Array.from({ length: count }, () =>
      generateUserAgent(browser, device),
    );
    return {
      summary: `${count} user-agent(s) ${browser}/${device} gerado(s).`,
      output: values.join("\n"),
      meta: { browser, device, count },
    };
  }

  if (toolId === "cssShadowGenerator") {
    const count = clampCount(payload.count, 20);
    const values = Array.from({ length: count }, () => {
      const x = randomInt(0, 24);
      const y = randomInt(4, 32);
      const blur = randomInt(12, 48);
      const spread = randomInt(-6, 8);
      const alpha = (Math.random() * 0.35 + 0.1).toFixed(2);
      return `box-shadow: ${x}px ${y}px ${blur}px ${spread}px rgba(15, 68, 98, ${alpha});`;
    });
    return {
      summary: `${count} sombra(s) CSS gerada(s).`,
      output: values.join("\n"),
      meta: { count },
    };
  }

  if (toolId === "nicknameGenerator") {
    const style = String(payload.style || "gamer");
    const count = clampCount(payload.count, 24);
    const base = String(payload.base || "").trim();
    const values = createUniqueValues(count, () => createNickname(base, style));
    return {
      summary: `${values.length} nickname(s) ${style} gerado(s).`,
      output: values.join("\n"),
      meta: { base: base || "aleatorio", style, count: values.length },
    };
  }

  if (toolId === "emoticonGenerator") {
    const mood = String(payload.mood || "happy");
    const style = String(payload.style || "mixed");
    const count = clampCount(payload.count, 24);
    const values = createUniqueValues(count, () => createEmoticon(mood, style));
    return {
      summary: `${values.length} emoticon(s) ${mood}/${style} gerado(s).`,
      output: values.join("\n"),
      meta: { mood, style, count: values.length },
    };
  }

  if (toolId === "emojiComboGenerator") {
    const theme = String(payload.theme || "celebration");
    const count = clampCount(payload.count, 20);
    const values = createUniqueValues(count, () => createEmojiCombo(theme));
    return {
      summary: `${values.length} combo(s) emoji do tema ${theme} gerado(s).`,
      output: values.join("\n"),
      meta: { theme, count: values.length },
    };
  }

  if (toolId === "bioGenerator") {
    const tone = String(payload.tone || "professional");
    const niche = String(payload.niche || "").trim();
    const count = clampCount(payload.count, 12);
    const values = Array.from({ length: count }, (_, index) =>
      createBio(niche, tone, index),
    );
    return {
      summary: `${count} bio(s) no tom ${tone} gerada(s).`,
      output: values.join("\n\n"),
      meta: { tone, niche: niche || "criacao digital", count },
    };
  }

  if (toolId === "hashtagGenerator") {
    const topic = String(payload.topic || "").trim();
    const count = clampCount(payload.count, 30);
    const values = createUniqueValues(count, (_, index) =>
      createHashtag(topic, index),
    );
    return {
      summary: `${values.length} hashtag(s) gerada(s) para ${topic || "criacao digital"}.`,
      output: values.join("\n"),
      meta: { topic: topic || "criacao digital", count: values.length },
    };
  }

  if (toolId === "teamNameGenerator") {
    const theme = String(payload.theme || "").trim();
    const count = clampCount(payload.count, 20);
    const values = createUniqueValues(count, () => createTeamName(theme));
    return {
      summary: `${values.length} nome(s) de equipe sugerido(s).`,
      output: values.join("\n"),
      meta: { theme: theme || "geral", count: values.length },
    };
  }

  if (toolId === "projectNameGenerator") {
    const focus = String(payload.focus || "").trim();
    const count = clampCount(payload.count, 20);
    const values = createUniqueValues(count, () => createProjectName(focus));
    return {
      summary: `${values.length} nome(s) de projeto gerado(s).`,
      output: values.join("\n"),
      meta: { focus: focus || "produto digital", count: values.length },
    };
  }

  if (toolId === "emailAliasGenerator") {
    const base = String(payload.base || "").trim();
    const domain = sanitizeDomain(payload.domain);
    const count = clampCount(payload.count, 24);
    const values = createUniqueValues(count, (index) =>
      createEmailAlias(base, domain, index),
    );
    return {
      summary: `${values.length} alias(es) de email gerado(s).`,
      output: values.join("\n"),
      meta: { base: base || "aleatorio", domain, count: values.length },
    };
  }

  if (toolId === "filenameGenerator") {
    const base = String(payload.base || "").trim();
    const extension = String(payload.extension || "").trim();
    const style = String(payload.style || "kebab");
    const count = clampCount(payload.count, 20);
    const values = Array.from({ length: count }, (_, index) =>
      createFilename(base, extension, style, index),
    );
    return {
      summary: `${count} nome(s) de arquivo no estilo ${style} gerado(s).`,
      output: values.join("\n"),
      meta: { base: base || "arquivo modelo", extension: extension || "txt", style, count },
    };
  }

  if (toolId === "cssAnimationGenerator") {
    const preset = String(payload.preset || "float");
    const count = clampCount(payload.count, 8);
    const values = Array.from({ length: count }, (_, index) =>
      createCssAnimation(preset, index),
    );
    return {
      summary: `${count} animacao(oes) CSS ${preset} gerada(s).`,
      output: values.join("\n\n"),
      meta: { preset, count },
    };
  }

  if (toolId === "avatarSvgGenerator") {
    const baseName = String(payload.name || "").trim();
    const shape = String(payload.shape || "circle");
    const count = clampCount(payload.count, 6);
    const values = Array.from({ length: count }, (_, index) => {
      const name =
        baseName ||
        `${sample(FIRST_NAMES)} ${sample(LAST_NAMES)} ${index + 1}`;
      return createAvatarSvg(name, shape, AVATAR_COLORS[index % AVATAR_COLORS.length]);
    });
    return {
      summary: `${count} avatar(es) SVG ${shape} gerado(s).`,
      output: values.join("\n\n"),
      meta: { name: baseName || "aleatorio", shape, count },
    };
  }

  if (toolId === "wifiPayloadGenerator") {
    const encryption = String(payload.encryption || "WPA");
    const ssid = String(payload.ssid || "Minha Rede").trim() || "Minha Rede";
    const password =
      encryption === "nopass"
        ? ""
        : String(payload.password || "senha12345").trim() || "senha12345";
    const hidden = Boolean(payload.hidden);
    const output = `WIFI:T:${encryption};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(
      password,
    )};H:${hidden ? "true" : "false"};;`;
    return {
      summary: `Payload Wi-Fi ${encryption} gerado para ${ssid}.`,
      output,
      meta: { ssid, encryption, hidden, passwordLength: password.length },
    };
  }

  if (toolId === "commitMessageGenerator") {
    const type = String(payload.type || "feat");
    const scope = String(payload.scope || "").trim();
    const summary =
      String(payload.summary || "").trim() || sample(COMMIT_SUMMARIES[type] || COMMIT_SUMMARIES.feat);
    const normalizedSummary =
      summary.charAt(0).toLowerCase() + summary.slice(1);
    const title = `${type}${scope ? `(${slugifyText(scope)})` : ""}: ${normalizedSummary}`;
    const body = [
      title,
      "",
      "Contexto sugerido:",
      `- foco principal: ${scope || "geral"}`,
      `- resumo: ${normalizedSummary}`,
      "- revisar impacto visual e fluxo de uso",
    ].join("\n");
    return {
      summary: "Mensagem de commit sugerida no padrao conventional commits.",
      output: body,
      meta: { type, scope: scope || "sem escopo", summary: normalizedSummary },
    };
  }

  throw new Error("Ferramenta geradora nao suportada.");
}
