import { postToApi } from "../../../lib/api";
import { decodeBase64, encodeBase64 } from "../../../lib/utils";

const MIME_MAP = {
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".ts": "text/typescript",
  ".html": "text/html",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

function safeParseBase64Json(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return JSON.parse(decodeBase64(`${normalized}${padding}`));
}

async function digestText(algorithm, value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(hashBuffer), (item) =>
    item.toString(16).padStart(2, "0"),
  ).join("");
}

async function createHmacSha256(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signature), (item) =>
    item.toString(16).padStart(2, "0"),
  ).join("");
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function validateCpf(value) {
  const digits = normalizeDigits(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);
  const getDigit = (sliceLength) => {
    const total = numbers
      .slice(0, sliceLength)
      .reduce(
        (sum, digit, index) => sum + digit * (sliceLength + 1 - index),
        0,
      );
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return getDigit(9) === numbers[9] && getDigit(10) === numbers[10];
}

function validateCnpj(value) {
  const digits = normalizeDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);
  const calculateDigit = (sliceLength) => {
    const weights =
      sliceLength === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const total = numbers
      .slice(0, sliceLength)
      .reduce((sum, digit, index) => sum + digit * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === numbers[12] &&
    calculateDigit(13) === numbers[13];
}

function parseXmlDocument(value) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(value, "application/xml");
  const errorNode = xml.querySelector("parsererror");

  if (errorNode) {
    throw new Error(errorNode.textContent || "XML invalido.");
  }

  return xml;
}

function formatXml(value) {
  const xml = parseXmlDocument(value);
  const serialized = new XMLSerializer().serializeToString(xml)
    .replace(/(>)(<)(\/*)/g, "$1\n$2$3");
  let indentLevel = 0;

  return serialized
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      if (/^<\/.+>/.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = `${"  ".repeat(indentLevel)}${line}`;

      if (/^<[^!?/][^>]*[^/]>\s*$/.test(line)) {
        indentLevel += 1;
      }

      return formattedLine;
    })
    .join("\n");
}

function parseSemver(value) {
  const match = String(value || "")
    .trim()
    .match(/^v?(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);

  if (!match) {
    throw new Error("Use versoes no formato x.y.z.");
  }

  return match.slice(1, 4).map(Number);
}

export async function executeTesterTool(toolId, payload) {
  if (toolId === "httpTester") {
    const response = await postToApi("/api/tools/execute", { toolId, payload });
    return response.result;
  }

  if (toolId === "regexTester") {
    const flags = (payload.flags || "g").includes("g")
      ? payload.flags || "g"
      : `${payload.flags || ""}g`;
    const regex = new RegExp(payload.pattern, flags);
    const matches = Array.from(payload.text.matchAll(regex)).map((match) => ({
      value: match[0],
      index: match.index,
      groups: match.groups ?? null,
    }));

    return {
      summary: `${matches.length} correspondencias encontradas.`,
      output: matches,
      meta: {
        pattern: payload.pattern,
        flags,
      },
    };
  }

  if (toolId === "jwtDecoder") {
    const [header, payloadPart] = payload.token.split(".");

    if (!header || !payloadPart) {
      throw new Error("JWT invalido. Use o formato header.payload.signature.");
    }

    return {
      summary: "JWT decodificado localmente.",
      output: {
        header: safeParseBase64Json(header),
        payload: safeParseBase64Json(payloadPart),
      },
    };
  }

  if (toolId === "hashGenerator") {
    return {
      summary: "Hash SHA-256 gerado.",
      output: await digestText("SHA-256", payload.text),
    };
  }

  if (toolId === "jsonValidator") {
    const parsed = JSON.parse(payload.text);
    return {
      summary: "JSON valido.",
      output: parsed,
      meta: {
        type: Array.isArray(parsed) ? "array" : typeof parsed,
        keys:
          parsed && typeof parsed === "object" ? Object.keys(parsed).length : 0,
      },
    };
  }

  if (toolId === "jsonMinifier") {
    const parsed = JSON.parse(payload.text);
    return {
      summary: "JSON minificado com sucesso.",
      output: JSON.stringify(parsed),
      meta: { bytes: JSON.stringify(parsed).length },
    };
  }

  if (toolId === "urlInspector") {
    const url = new URL(payload.url);
    return {
      summary: "URL analisada com sucesso.",
      output: {
        href: url.href,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port || "(padrao)",
        pathname: url.pathname,
        hash: url.hash,
        search: url.search,
        params: Object.fromEntries(url.searchParams.entries()),
      },
    };
  }

  if (toolId === "queryStringParser") {
    const raw = String(payload.text || "").trim().replace(/^\?/, "");
    const params = new URLSearchParams(
      raw.includes("?") ? raw.split("?")[1] : raw,
    );
    const output = {};
    params.forEach((value, key) => {
      if (key in output) {
        output[key] = Array.isArray(output[key])
          ? [...output[key], value]
          : [output[key], value];
      } else {
        output[key] = value;
      }
    });
    return {
      summary: `${Array.from(params.keys()).length} parametro(s) processado(s).`,
      output,
    };
  }

  if (toolId === "uuidValidator") {
    const isValid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(payload.text || "").trim(),
      );
    return {
      summary: isValid ? "UUID valido." : "UUID invalido.",
      output: { value: payload.text, isValid },
    };
  }

  if (toolId === "cpfValidator") {
    const isValid = validateCpf(payload.text);
    return {
      summary: isValid ? "CPF valido." : "CPF invalido.",
      output: { value: payload.text, isValid },
    };
  }

  if (toolId === "cnpjValidator") {
    const isValid = validateCnpj(payload.text);
    return {
      summary: isValid ? "CNPJ valido." : "CNPJ invalido.",
      output: { value: payload.text, isValid },
    };
  }

  if (toolId === "emailValidator") {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
      String(payload.text || "").trim(),
    );
    return {
      summary: isValid ? "Email com formato valido." : "Email invalido.",
      output: { value: payload.text, isValid },
    };
  }

  if (toolId === "passwordStrength") {
    const value = String(payload.text || "");
    const score = [
      value.length >= 8,
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
      value.length >= 14,
    ].filter(Boolean).length;
    const levels = ["muito fraca", "fraca", "media", "boa", "forte", "muito forte", "excelente"];
    return {
      summary: `Senha classificada como ${levels[score]}.`,
      output: {
        score,
        label: levels[score],
        checks: {
          minLength8: value.length >= 8,
          lower: /[a-z]/.test(value),
          upper: /[A-Z]/.test(value),
          number: /\d/.test(value),
          symbol: /[^A-Za-z0-9]/.test(value),
          length14: value.length >= 14,
        },
      },
    };
  }

  if (toolId === "hmacSha256") {
    return {
      summary: "HMAC SHA-256 calculado.",
      output: await createHmacSha256(payload.text, payload.secret),
    };
  }

  if (toolId === "sha1HashTester") {
    return {
      summary: "Hash SHA-1 calculado.",
      output: await digestText("SHA-1", payload.text),
    };
  }

  if (toolId === "sha512HashTester") {
    return {
      summary: "Hash SHA-512 calculado.",
      output: await digestText("SHA-512", payload.text),
    };
  }

  if (toolId === "basicAuthInspector") {
    const mode = payload.mode || "encode";

    if (mode === "encode") {
      const encoded = `Basic ${encodeBase64(payload.text)}`;
      return {
        summary: "Header Basic Auth gerado.",
        output: encoded,
      };
    }

    const value = String(payload.text || "").replace(/^Basic\s+/i, "").trim();
    return {
      summary: "Header Basic Auth decodificado.",
      output: decodeBase64(value),
    };
  }

  if (toolId === "unixTimestampConverter") {
    const raw = String(payload.text || "").trim();
    const numeric = Number(raw);

    if (!Number.isNaN(numeric)) {
      const timestamp = raw.length <= 10 ? numeric * 1000 : numeric;
      const date = new Date(timestamp);
      return {
        summary: "Timestamp convertido para data.",
        output: {
          iso: date.toISOString(),
          utc: date.toUTCString(),
          local: date.toLocaleString("pt-BR"),
        },
      };
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Informe um timestamp ou data valida.");
    }

    return {
      summary: "Data convertida para timestamp.",
      output: {
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMilliseconds: date.getTime(),
        iso: date.toISOString(),
      },
    };
  }

  if (toolId === "semverComparator") {
    const left = parseSemver(payload.versionA);
    const right = parseSemver(payload.versionB);
    const index = left.findIndex((item, itemIndex) => item !== right[itemIndex]);
    const diff = index === -1 ? 0 : left[index] > right[index] ? 1 : -1;
    return {
      summary:
        diff === 0
          ? "As versoes sao equivalentes."
          : diff > 0
            ? "A versao A e maior."
            : "A versao B e maior.",
      output: {
        versionA: payload.versionA,
        versionB: payload.versionB,
        comparison: diff,
      },
    };
  }

  if (toolId === "mimeTypeLookup") {
    const raw = String(payload.text || "").trim().toLowerCase();
    const extension = raw.startsWith(".")
      ? raw
      : Object.entries(MIME_MAP).find(([, mime]) => mime === raw)?.[0];
    const mimeType = raw.includes("/") ? raw : MIME_MAP[extension || raw];

    if (!mimeType) {
      throw new Error("Extensao ou MIME nao mapeado nesta versao.");
    }

    return {
      summary: "Mapeamento MIME localizado.",
      output: {
        extension: extension || raw,
        mimeType,
      },
    };
  }

  if (toolId === "regexReplaceTester") {
    const flags = payload.flags || "g";
    const regex = new RegExp(payload.pattern, flags);
    return {
      summary: "Substituicao com regex executada.",
      output: String(payload.text || "").replace(regex, payload.replacement),
      meta: {
        pattern: payload.pattern,
        flags,
        replacement: payload.replacement,
      },
    };
  }

  if (toolId === "xmlValidator") {
    const xml = parseXmlDocument(payload.text);
    return {
      summary: "XML bem formado.",
      output: {
        root: xml.documentElement.nodeName,
      },
    };
  }

  if (toolId === "xmlFormatter") {
    return {
      summary: "XML formatado com sucesso.",
      output: formatXml(payload.text),
    };
  }

  if (toolId === "jwtExpirationInspector") {
    const [, payloadPart] = String(payload.token || "").split(".");
    if (!payloadPart) {
      throw new Error("JWT invalido. Use o formato header.payload.signature.");
    }

    const decoded = safeParseBase64Json(payloadPart);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
    const issuedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;
    return {
      summary: expiresAt
        ? decoded.exp < nowSeconds
          ? "JWT expirado."
          : "JWT ainda valido."
        : "JWT sem campo exp.",
      output: {
        exp: decoded.exp ?? null,
        expIso: expiresAt ? expiresAt.toISOString() : null,
        iat: decoded.iat ?? null,
        iatIso: issuedAt ? issuedAt.toISOString() : null,
        isExpired: decoded.exp ? decoded.exp < nowSeconds : null,
        payload: decoded,
      },
    };
  }

  throw new Error("Ferramenta de teste nao suportada.");
}
