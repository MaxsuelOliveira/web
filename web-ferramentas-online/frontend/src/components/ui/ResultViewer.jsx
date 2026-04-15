import { useEffect, useMemo, useRef, useState } from "react";
import { classNames, formatJsonPreview } from "../../lib/utils";

function toResultText(value) {
  return typeof value === "string" ? value : formatJsonPreview(value);
}

function getOutputTypeLabel(value) {
  if (typeof value === "string") {
    return "texto";
  }

  if (Array.isArray(value)) {
    return "lista";
  }

  if (value && typeof value === "object") {
    return "json";
  }

  return typeof value;
}

function getOutputStats(value) {
  if (typeof value === "string") {
    return `${value.length} caractere(s)`;
  }

  if (Array.isArray(value)) {
    return `${value.length} item(ns)`;
  }

  if (value && typeof value === "object") {
    return `${Object.keys(value).length} chave(s)`;
  }

  return "retorno simples";
}

function getStatusPillClassName(status) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "loading") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-white text-slate-500";
}

function actionButtonClassName() {
  return "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700";
}

export default function ResultViewer({
  result,
  isLoading,
  error,
  emptyMessage = "Execute a ferramenta para ver o retorno.",
  onClear,
}) {
  const [copyState, setCopyState] = useState("idle");
  const [copyMetaState, setCopyMetaState] = useState("idle");
  const [wrapOutput, setWrapOutput] = useState(true);
  const [metaOpen, setMetaOpen] = useState(true);
  const containerRef = useRef(null);
  const outputText = useMemo(
    () => (result?.output ? toResultText(result.output) : ""),
    [result],
  );
  const outputLines = useMemo(
    () => (outputText ? outputText.split(/\r?\n/).length : 0),
    [outputText],
  );

  useEffect(() => {
    if ((isLoading || result || error) && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [error, isLoading, result]);

  useEffect(() => {
    setWrapOutput(true);
    setMetaOpen(true);
  }, [result]);

  async function handleCopy() {
    if (!outputText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  async function handleCopyMeta() {
    if (!result?.meta) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatJsonPreview(result.meta));
      setCopyMetaState("copied");
      window.setTimeout(() => setCopyMetaState("idle"), 1800);
    } catch {
      setCopyMetaState("error");
      window.setTimeout(() => setCopyMetaState("idle"), 1800);
    }
  }

  function handleDownload() {
    if (!outputText) {
      return;
    }

    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      getOutputTypeLabel(result?.output) === "json"
        ? "resultado.json"
        : "resultado.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div
        ref={containerRef}
        className="glass-strong min-h-[14rem] rounded-[22px] border border-white/70 p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-500" />
          <span className="text-sm font-semibold text-slate-500">
            Processando retorno...
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusPillClassName("loading")}`}
          >
            Em execucao
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/70" />
          <div className="h-28 animate-pulse rounded-[18px] bg-slate-200/55" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        ref={containerRef}
        className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.08em] text-rose-500">
                Falha na execucao
              </p>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusPillClassName("error")}`}
              >
                Erro
              </span>
            </div>
            <p className="mt-2 leading-6">{error}</p>
          </div>

          {onClear ? (
            <button type="button" onClick={onClear} className={actionButtonClassName()}>
              Limpar estado
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        ref={containerRef}
        className="glass-strong flex min-h-[12rem] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-200 p-5 text-center"
      >
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500">
          Sem resultado
        </span>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="glass-strong rounded-[22px] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.08em] text-cyan-600">
                Resumo
              </p>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusPillClassName("success")}`}
              >
                Concluido
              </span>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-slate-950">
              {result.summary}
            </h3>
            {result.output ? (
              <p className="mt-2 text-[13px] leading-6 text-slate-500">
                {getOutputStats(result.output)} - {outputLines} linha(s) -
                formato {getOutputTypeLabel(result.output)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {result.output ? (
              <>
                <button
                  type="button"
                  onClick={() => setWrapOutput((current) => !current)}
                  className={actionButtonClassName()}
                >
                  {wrapOutput ? "Linha livre" : "Quebrar linha"}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={actionButtonClassName()}
                >
                  {copyState === "copied"
                    ? "Copiado"
                    : copyState === "error"
                      ? "Falhou"
                      : "Copiar saida"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className={actionButtonClassName()}
                >
                  Baixar
                </button>
              </>
            ) : null}
            {onClear ? (
              <button type="button" onClick={onClear} className={actionButtonClassName()}>
                Limpar retorno
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {result.output ? (
        <div className="glass-strong rounded-[22px] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-cyan-600">
                Saida
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
                Retorno principal pronto para leitura, copia ou download.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                {getOutputTypeLabel(result.output)}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                {outputLines} linha(s)
              </span>
            </div>
          </div>

          <pre
            className={`scroll-soft mt-3 max-h-[22rem] overflow-auto rounded-[18px] bg-slate-950/96 p-3 text-[13px] leading-5 text-slate-100 ${
              wrapOutput
                ? "whitespace-pre-wrap break-words"
                : "whitespace-pre"
            }`}
          >
            {outputText}
          </pre>
        </div>
      ) : null}

      {result.meta ? (
        <div className="glass-strong rounded-[22px] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-cyan-600">
                Metadados
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
                Informacoes auxiliares para debug e verificacao.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMetaOpen((current) => !current)}
                className={actionButtonClassName()}
              >
                {metaOpen ? "Ocultar meta" : "Mostrar meta"}
              </button>
              <button
                type="button"
                onClick={handleCopyMeta}
                className={actionButtonClassName()}
              >
                {copyMetaState === "copied"
                  ? "Meta copiado"
                  : copyMetaState === "error"
                    ? "Falhou"
                    : "Copiar meta"}
              </button>
            </div>
          </div>

          {metaOpen ? (
            <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3">
              <pre
                className={classNames(
                  "scroll-soft max-h-56 overflow-auto whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-700",
                )}
              >
                {formatJsonPreview(result.meta)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
