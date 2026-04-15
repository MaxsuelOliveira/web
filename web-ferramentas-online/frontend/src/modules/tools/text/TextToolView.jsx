import ToolFormActions from "../../../components/tooling/ToolFormActions";
import PanelCard from "../../../components/ui/PanelCard";
import ResultViewer from "../../../components/ui/ResultViewer";
import { useTextTool } from "./useTextTool";

function countLines(value) {
  if (!value) {
    return 0;
  }

  return value.split(/\r?\n/).length;
}

export default function TextToolView({ tool }) {
  const controller = useTextTool(tool);
  const textValue = controller.formData.text || "";
  const canSubmit = textValue.trim().length > 0;

  return (
    <div className="space-y-4">
      <PanelCard className="overflow-hidden p-0">
        <div className={`bg-linear-to-br ${tool.accent} p-4 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-white/75">
                Texto
              </p>
              <h2 className="mt-1.5 font-['Sora'] text-xl font-extrabold">
                {tool.name}
              </h2>
            </div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
              {tool.badge}
            </span>
          </div>

          <p className="mt-2 max-w-xl text-[13px] leading-5 text-white/86">
            {tool.description}
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[20px] border border-cyan-100 bg-cyan-50/80 p-4">
            <p className="text-sm font-bold text-slate-900">Como usar</p>
            <p className="mt-2 text-[14px] leading-6 text-slate-600">
              Cole ou escreva o texto que voce quer transformar. Depois clique
              no botao principal e veja o retorno pronto para copiar logo
              abaixo.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
              <p className="text-xs font-medium text-slate-500">
                Caracteres
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                {textValue.length}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
              <p className="text-xs font-medium text-slate-500">
                Linhas
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                {countLines(textValue)}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
              <p className="text-xs font-medium text-slate-500">
                Fluxo
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                Instantaneo
              </p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={controller.submit}>
            {tool.id === "base64" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-[15px] font-bold text-slate-800">
                    Texto
                  </span>
                  <textarea
                    className="min-h-36 rounded-[18px] border border-slate-200 bg-white/92 px-4 py-3.5 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="Cole o conteudo aqui..."
                    value={controller.formData.text}
                    onChange={(event) =>
                      controller.updateField("text", event.target.value)
                    }
                    spellCheck={false}
                    autoFocus
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[15px] font-bold text-slate-800">
                    Modo
                  </span>
                  <select
                    className="rounded-[18px] border border-slate-200 bg-white/92 px-4 py-3.5 text-[15px] text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    value={controller.formData.mode}
                    onChange={(event) =>
                      controller.updateField("mode", event.target.value)
                    }
                  >
                    <option value="encode">Codificar</option>
                    <option value="decode">Decodificar</option>
                  </select>
                </label>
              </div>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-[15px] font-bold text-slate-800">
                  Conteudo
                </span>
                <textarea
                  className="min-h-44 rounded-[18px] border border-slate-200 bg-white/92 px-4 py-3.5 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Cole ou escreva o texto que deseja transformar..."
                  value={controller.formData.text}
                  onChange={(event) =>
                    controller.updateField("text", event.target.value)
                  }
                  spellCheck={false}
                  autoFocus
                />
              </label>
            )}

            <ToolFormActions
              submitLabel="Processar texto"
              submitBusyLabel="Processando..."
              isLoading={controller.isLoading}
              canSubmit={canSubmit}
              onReset={controller.resetForm}
              onFillExample={controller.fillExampleValues}
              helperMessage={
                controller.isLoading
                  ? "Processando texto e montando retorno."
                  : canSubmit
                  ? "Texto pronto para processamento."
                  : "Cole ou digite um conteudo para liberar a execucao."
              }
              helperTone={
                controller.isLoading
                  ? "loading"
                  : canSubmit
                    ? "success"
                    : "warning"
              }
            />
          </form>
        </div>
      </PanelCard>

      <ResultViewer
        result={controller.data}
        isLoading={controller.isLoading}
        error={controller.error}
        emptyMessage="Cole ou digite o conteudo para processar."
        onClear={controller.resetForm}
      />
    </div>
  );
}
