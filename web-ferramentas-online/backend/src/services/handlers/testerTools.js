import { safeJsonParse } from "../../utils/http.js";

async function runHttpTester(payload) {
  const method = String(payload.method || "GET").toUpperCase();
  const headers = safeJsonParse(payload.headers, {});
  const requestInit = {
    method,
    headers,
  };

  if (!["GET", "HEAD"].includes(method) && payload.body) {
    requestInit.body = payload.body;
  }

  const response = await fetch(payload.url, requestInit);
  const text = await response.text();
  let parsedBody = text;

  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    parsedBody = text;
  }

  return {
    summary: `Resposta ${response.status} ${response.statusText}`,
    output: parsedBody,
    meta: {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    },
  };
}

export const testerToolHandlers = {
  httpTester: runHttpTester,
};
