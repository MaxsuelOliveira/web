import { fetchJson, normalizeIdentifier } from "../../utils/http.js";

const BRASIL_API_URL = "https://brasilapi.com.br/api";

async function brasilApi(path) {
  return fetchJson(`${BRASIL_API_URL}${path}`);
}

async function getCep(payload) {
  const cep = normalizeIdentifier(payload.cep);

  try {
    const response = await brasilApi(`/cep/v2/${cep}`);
    return {
      summary: `Endereco localizado para o CEP ${cep}.`,
      output: response,
    };
  } catch {
    const response = await fetchJson(`https://viacep.com.br/ws/${cep}/json/`);
    return {
      summary: `Endereco localizado para o CEP ${cep} via fallback.`,
      output: response,
    };
  }
}

async function getCnpj(payload) {
  const cnpj = normalizeIdentifier(payload.cnpj);
  const response = await brasilApi(`/cnpj/v1/${cnpj}`);
  return {
    summary: `Dados empresariais encontrados para ${cnpj}.`,
    output: response,
  };
}

async function getDdd(payload) {
  const response = await brasilApi(
    `/ddd/v1/${normalizeIdentifier(payload.ddd)}`,
  );
  return {
    summary: `${response.cities?.length || 0} cidades encontradas no DDD ${payload.ddd}.`,
    output: response,
  };
}

async function getNcm(payload) {
  const query = String(payload.query || "").trim();
  const numeric = normalizeIdentifier(query);
  const response =
    numeric.length >= 4
      ? await brasilApi(`/ncm/v1/${numeric}`)
      : await brasilApi(`/ncm/v1?search=${encodeURIComponent(query)}`);

  return {
    summary: Array.isArray(response)
      ? `${response.length} resultados localizados para NCM.`
      : "Codigo NCM localizado.",
    output: response,
  };
}

async function getFipeMarcas(payload) {
  const response = await brasilApi(`/fipe/marcas/v1/${payload.type}`);
  return {
    summary: `${response.length} marcas encontradas em ${payload.type}.`,
    output: response,
  };
}

async function getFipePreco(payload) {
  const response = await brasilApi(`/fipe/preco/v1/${payload.code}`);
  return {
    summary: "Preco FIPE recuperado com sucesso.",
    output: response,
  };
}

async function getBanks(payload) {
  const code = normalizeIdentifier(payload.code);
  const response = code
    ? await brasilApi(`/banks/v1/${code}`)
    : await brasilApi("/banks/v1");
  return {
    summary: Array.isArray(response)
      ? `${response.length} bancos encontrados.`
      : "Banco localizado.",
    output: response,
  };
}

async function getTaxas(payload) {
  const name = String(payload.name || "").trim();
  const response = name
    ? await brasilApi(`/taxas/v1/${name}`)
    : await brasilApi("/taxas/v1");
  return {
    summary: Array.isArray(response)
      ? `${response.length} taxas encontradas.`
      : "Indicador localizado.",
    output: response,
  };
}

async function getFeriados(payload) {
  const year = Number(payload.year || new Date().getFullYear());
  const response = await brasilApi(`/feriados/v1/${year}`);
  return {
    summary: `${response.length} feriados nacionais em ${year}.`,
    output: response,
  };
}

async function getRegistroBr(payload) {
  const response = await brasilApi(`/registrobr/v1/${payload.domain}`);
  return {
    summary: `Consulta de dominio concluida para ${payload.domain}.`,
    output: response,
  };
}

async function getCptecClima(payload) {
  const cities = await brasilApi(
    `/cptec/v1/cidade/${encodeURIComponent(payload.city)}`,
  );

  if (!Array.isArray(cities) || !cities.length) {
    throw new Error("Cidade nao encontrada no CPTEC.");
  }

  const city = cities[0];
  const forecast = await brasilApi(`/cptec/v1/clima/previsao/${city.id}`);

  return {
    summary: `Previsao encontrada para ${city.nome}.`,
    output: {
      city,
      forecast,
    },
  };
}

async function getPixParticipantes() {
  const response = await brasilApi("/pix/v1/participants");
  return {
    summary: `${response.length} participantes PIX recuperados.`,
    output: response,
  };
}

async function searchCepByAddress(payload) {
  const uf = String(payload.uf || "").trim();
  const city = String(payload.city || "").trim();
  const street = String(payload.street || "").trim();
  const response = await fetchJson(
    `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(
      city,
    )}/${encodeURIComponent(street)}/json/`,
  );
  return {
    summary: `${Array.isArray(response) ? response.length : 0} CEP(s) encontrado(s) pelo endereco.`,
    output: response,
  };
}

export const brasilToolHandlers = {
  cep: getCep,
  cnpj: getCnpj,
  ddd: getDdd,
  ncm: getNcm,
  fipeMarcas: getFipeMarcas,
  fipePreco: getFipePreco,
  banks: getBanks,
  taxas: getTaxas,
  feriados: getFeriados,
  registroBr: getRegistroBr,
  cptecClima: getCptecClima,
  pixParticipantes: getPixParticipantes,
  cepAddressSearch: searchCepByAddress,
};
