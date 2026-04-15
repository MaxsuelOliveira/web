import {
  decodeBase64,
  encodeBase64,
  slugifyText,
} from "../../../lib/utils";

function toWords(value) {
  return value.trim().split(/\s+/).filter(Boolean);
}

function splitTerms(value) {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

function toCamelCase(terms) {
  return terms
    .map((term, index) => {
      const lower = term.toLowerCase();
      return index === 0
        ? lower
        : `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join("");
}

function toPascalCase(terms) {
  return terms
    .map((term) => {
      const lower = term.toLowerCase();
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join("");
}

function detectCsvDelimiter(value) {
  const firstLine = value.split(/\r?\n/).find((line) => line.trim());
  if (!firstLine) {
    return ",";
  }

  const candidates = [",", ";", "\t", "|"];
  return candidates.sort(
    (left, right) =>
      firstLine.split(right).length - firstLine.split(left).length,
  )[0];
}

function parseCsv(value) {
  const delimiter = detectCsvDelimiter(value);
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return { delimiter, rows };
}

function stringifyCsvCell(value) {
  const stringValue =
    value === null || value === undefined ? "" : String(value);

  if (/[",\n;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function encodeHtmlEntities(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeWords(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function executeTextTool(toolId, payload) {
  const text = payload.text || payload.source || "";

  if (toolId === "jsonFormat") {
    const parsed = JSON.parse(text);
    return {
      summary: "JSON validado e formatado com sucesso.",
      output: JSON.stringify(parsed, null, 2),
      meta: {
        type: Array.isArray(parsed) ? "array" : typeof parsed,
        keys:
          typeof parsed === "object" && parsed !== null
            ? Object.keys(parsed).length
            : 0,
      },
    };
  }

  if (toolId === "base64") {
    const mode = payload.mode || "encode";
    return {
      summary:
        mode === "encode"
          ? "Texto convertido para Base64."
          : "Base64 convertido para texto.",
      output: mode === "encode" ? encodeBase64(text) : decodeBase64(text),
      meta: { mode },
    };
  }

  if (toolId === "caseConverter") {
    const terms = splitTerms(text);
    return {
      summary: "Variacoes de naming geradas.",
      output: {
        lower: text.toLowerCase(),
        upper: text.toUpperCase(),
        camel: toCamelCase(terms),
        pascal: toPascalCase(terms),
        snake: terms.map((term) => term.toLowerCase()).join("_"),
        kebab: terms.map((term) => term.toLowerCase()).join("-"),
      },
    };
  }

  if (toolId === "urlTools") {
    return {
      summary: "Texto convertido com encode e decode de URL.",
      output: {
        encoded: encodeURIComponent(text),
        decoded: decodeURIComponent(text),
      },
    };
  }

  if (toolId === "textStats") {
    const lines = text.length ? text.split(/\r?\n/) : [];
    const uniqueLines = Array.from(
      new Set(lines.map((line) => line.trim()).filter(Boolean)),
    );
    return {
      summary: "Levantamento textual concluido.",
      output: uniqueLines.join("\n"),
      meta: {
        characters: text.length,
        charactersWithoutSpaces: text.replace(/\s/g, "").length,
        words: toWords(text).length,
        lines: lines.length,
        uniqueLines: uniqueLines.length,
      },
    };
  }

  if (toolId === "slugify") {
    return {
      summary: "Slug pronto para URL.",
      output: slugifyText(text),
    };
  }

  if (toolId === "removeAccents") {
    return {
      summary: "Acentos removidos do texto.",
      output: text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    };
  }

  if (toolId === "reverseText") {
    return {
      summary: "Texto invertido com sucesso.",
      output: Array.from(text).reverse().join(""),
    };
  }

  if (toolId === "titleCaseText") {
    return {
      summary: "Texto ajustado para Title Case.",
      output: text
        .toLowerCase()
        .replace(/\b[\p{L}\p{N}]/gu, (char) => char.toUpperCase()),
    };
  }

  if (toolId === "trimLines") {
    const output = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .join("\n");
    return {
      summary: "Espacos extras por linha removidos.",
      output,
    };
  }

  if (toolId === "removeBlankLines") {
    const output = text
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .join("\n");
    return {
      summary: "Linhas vazias removidas.",
      output,
    };
  }

  if (toolId === "sortLines") {
    const output = text
      .split(/\r?\n/)
      .filter(Boolean)
      .sort((left, right) =>
        left.localeCompare(right, "pt-BR", { sensitivity: "base" }),
      )
      .join("\n");
    return {
      summary: "Linhas ordenadas alfabeticamente.",
      output,
    };
  }

  if (toolId === "uniqueLinesTool") {
    const lines = text.split(/\r?\n/);
    const seen = new Set();
    const uniqueLines = lines.filter((line) => {
      const key = line.trim();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    return {
      summary: "Linhas duplicadas removidas.",
      output: uniqueLines.join("\n"),
      meta: { total: lines.length, unique: uniqueLines.length },
    };
  }

  if (toolId === "lineNumbering") {
    const lines = text.split(/\r?\n/);
    return {
      summary: "Linhas numeradas com sucesso.",
      output: lines
        .map((line, index) => `${String(index + 1).padStart(3, "0")}. ${line}`)
        .join("\n"),
      meta: { lines: lines.length },
    };
  }

  if (toolId === "extractEmails") {
    const matches = Array.from(
      new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []),
    );
    return {
      summary: `${matches.length} email(s) encontrado(s).`,
      output: matches.join("\n"),
      meta: { count: matches.length },
    };
  }

  if (toolId === "extractUrls") {
    const matches = Array.from(
      new Set(text.match(/https?:\/\/[^\s<>"')]+/gi) || []),
    );
    return {
      summary: `${matches.length} URL(s) encontrada(s).`,
      output: matches.join("\n"),
      meta: { count: matches.length },
    };
  }

  if (toolId === "extractNumbers") {
    const matches = text.match(/-?\d+(?:[.,]\d+)?/g) || [];
    return {
      summary: `${matches.length} numero(s) localizado(s).`,
      output: matches.join("\n"),
      meta: { count: matches.length },
    };
  }

  if (toolId === "wordFrequency") {
    const frequency = text
      .toLowerCase()
      .match(/[\p{L}\p{N}_-]+/gu)
      ?.reduce((accumulator, word) => {
        const key = normalizeWords(word);
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {}) || {};

    const ordered = Object.entries(frequency)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 20);

    return {
      summary: `${ordered.length} palavra(s) no ranking de frequencia.`,
      output: Object.fromEntries(ordered),
      meta: { uniqueWords: Object.keys(frequency).length },
    };
  }

  if (toolId === "readingTime") {
    const words = toWords(text).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return {
      summary: `Leitura estimada em ${minutes} minuto(s).`,
      output: `${minutes} minuto(s) para aproximadamente ${words} palavra(s).`,
      meta: { words, minutes },
    };
  }

  if (toolId === "htmlEntitiesEncode") {
    return {
      summary: "Caracteres convertidos em entidades HTML.",
      output: encodeHtmlEntities(text),
    };
  }

  if (toolId === "htmlEntitiesDecode") {
    return {
      summary: "Entidades HTML convertidas para texto normal.",
      output: decodeHtmlEntities(text),
    };
  }

  if (toolId === "jsonEscape") {
    return {
      summary: "String escapada para uso em JSON.",
      output: JSON.stringify(text),
    };
  }

  if (toolId === "csvToJson") {
    const { delimiter, rows } = parseCsv(text);
    if (rows.length < 2) {
      throw new Error("Informe um CSV com cabecalho e pelo menos uma linha.");
    }

    const [headerRow, ...bodyRows] = rows;
    const output = bodyRows.map((row) =>
      Object.fromEntries(
        headerRow.map((header, index) => [header, row[index] ?? ""]),
      ),
    );

    return {
      summary: `${output.length} registro(s) convertidos de CSV para JSON.`,
      output,
      meta: { delimiter },
    };
  }

  if (toolId === "jsonToCsv") {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const headers = Array.from(
      new Set(
        items.flatMap((item) =>
          item && typeof item === "object" ? Object.keys(item) : [],
        ),
      ),
    );

    const output = [
      headers.join(","),
      ...items.map((item) =>
        headers
          .map((header) => stringifyCsvCell(item?.[header] ?? ""))
          .join(","),
      ),
    ].join("\n");

    return {
      summary: `${items.length} registro(s) convertidos de JSON para CSV.`,
      output,
      meta: { columns: headers.length },
    };
  }

  if (toolId === "textToBulletList") {
    const output = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line}`)
      .join("\n");
    return {
      summary: "Lista markdown gerada com sucesso.",
      output,
    };
  }

  if (toolId === "removeDuplicateWords") {
    const words = text.match(/[\p{L}\p{N}_-]+/gu) || [];
    const seen = new Set();
    const output = words.filter((word) => {
      const key = normalizeWords(word);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return {
      summary: "Palavras duplicadas removidas.",
      output: output.join(" "),
      meta: { uniqueWords: output.length },
    };
  }

  throw new Error("Operacao de texto nao suportada.");
}
