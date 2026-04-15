import * as dns from "node:dns/promises";
import tls from "node:tls";
import { fetchJson } from "../../utils/http.js";

function ensureUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Informe uma URL valida.");
  }

  return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
}

function normalizeHost(value) {
  return ensureUrl(value).hostname;
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Falha ao acessar ${url}: ${response.status}`);
  }

  return {
    body: text,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
    statusText: response.statusText,
    finalUrl: response.url,
  };
}

async function getIpInfo() {
  const response = await fetchJson("https://ipwho.is/");
  return {
    summary: `IP publico identificado: ${response.ip}.`,
    output: response,
  };
}

async function lookupIp(payload) {
  const ip = String(payload.ip || "").trim();
  const response = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
  return {
    summary: `Consulta concluida para o IP ${ip}.`,
    output: response,
  };
}

async function reverseDnsLookup(payload) {
  const ip = String(payload.ip || "").trim();
  const response = await dns.reverse(ip);
  return {
    summary: `${response.length} hostname(s) localizado(s) para ${ip}.`,
    output: response,
  };
}

async function dnsLookup(payload, type) {
  const host = normalizeHost(payload.host);

  if (type === "A") {
    const response = await dns.resolve4(host);
    return {
      summary: `${response.length} registro(s) A localizado(s).`,
      output: response,
    };
  }

  if (type === "MX") {
    const response = await dns.resolveMx(host);
    return {
      summary: `${response.length} registro(s) MX localizado(s).`,
      output: response,
    };
  }

  if (type === "NS") {
    const response = await dns.resolveNs(host);
    return {
      summary: `${response.length} nameserver(s) localizado(s).`,
      output: response,
    };
  }

  const response = await dns.resolveTxt(host);
  return {
    summary: `${response.length} registro(s) TXT localizado(s).`,
    output: response.map((record) => record.join("")),
  };
}

async function inspectSslCertificate(payload) {
  const host = normalizeHost(payload.host);
  const port = Number(payload.port || 443);

  const certificate = await new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
      },
      () => {
        const peer = socket.getPeerCertificate();
        socket.end();
        if (!peer || !Object.keys(peer).length) {
          reject(new Error("Certificado nao encontrado."));
          return;
        }
        resolve(peer);
      },
    );

    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error("Tempo esgotado ao inspecionar o certificado."));
    });

    socket.on("error", reject);
  });

  return {
    summary: `Certificado SSL inspecionado para ${host}:${port}.`,
    output: {
      subject: certificate.subject,
      issuer: certificate.issuer,
      valid_from: certificate.valid_from,
      valid_to: certificate.valid_to,
      subjectaltname: certificate.subjectaltname,
      fingerprint: certificate.fingerprint,
      serialNumber: certificate.serialNumber,
    },
  };
}

async function inspectHttpHeaders(payload) {
  const url = ensureUrl(payload.url).href;

  try {
    const response = await fetchText(url, { method: "HEAD", redirect: "follow" });
    return {
      summary: "Cabecalhos HTTP recuperados com sucesso.",
      output: response.headers,
      meta: {
        status: response.status,
        statusText: response.statusText,
        finalUrl: response.finalUrl,
      },
    };
  } catch {
    const response = await fetchText(url, { method: "GET", redirect: "follow" });
    return {
      summary: "Cabecalhos HTTP recuperados via fallback GET.",
      output: response.headers,
      meta: {
        status: response.status,
        statusText: response.statusText,
        finalUrl: response.finalUrl,
      },
    };
  }
}

async function getSiteFile(payload, fileName) {
  const url = new URL(`/${fileName}`, ensureUrl(payload.url));
  const response = await fetchText(url.href);
  return {
    summary: `${fileName} recuperado com sucesso.`,
    output: response.body,
    meta: {
      status: response.status,
      finalUrl: response.finalUrl,
    },
  };
}

export const networkToolHandlers = {
  ipInfo: getIpInfo,
  ipLookup: lookupIp,
  reverseDns: reverseDnsLookup,
  dnsA: (payload) => dnsLookup(payload, "A"),
  dnsMx: (payload) => dnsLookup(payload, "MX"),
  dnsNs: (payload) => dnsLookup(payload, "NS"),
  dnsTxt: (payload) => dnsLookup(payload, "TXT"),
  sslCertificate: inspectSslCertificate,
  httpHeadersLookup: inspectHttpHeaders,
  robotsLookup: (payload) => getSiteFile(payload, "robots.txt"),
  sitemapLookup: (payload) => getSiteFile(payload, "sitemap.xml"),
};
