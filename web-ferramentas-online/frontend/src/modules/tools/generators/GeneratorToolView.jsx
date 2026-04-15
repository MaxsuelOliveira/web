import { useMemo, useState } from "react";
import ToolFormActions from "../../../components/tooling/ToolFormActions";
import DynamicField from "../../../components/ui/DynamicField";
import PanelCard from "../../../components/ui/PanelCard";
import ResultViewer from "../../../components/ui/ResultViewer";
import {
  countAdvancedFields,
  countFilledFields,
  countMissingRequiredFields,
  getVisibleFields,
  hasRequiredFields,
} from "../../../lib/toolForms";
import { useGeneratorTool } from "./useGeneratorTool";

export default function GeneratorToolView({ tool }) {
  const controller = useGeneratorTool(tool);
  const [simpleMode, setSimpleMode] = useState(true);
  const canSubmit = hasRequiredFields(tool, controller.formData);
  const filledFields = countFilledFields(tool, controller.formData);
  const missingRequiredFields = countMissingRequiredFields(
    tool,
    controller.formData,
  );
  const advancedFields = countAdvancedFields(tool);
  const visibleFields = useMemo(
    () => getVisibleFields(tool, simpleMode),
    [simpleMode, tool],
  );

  return (
    <div className="space-y-4">
      <PanelCard className="overflow-hidden p-0">
        <div className={`bg-linear-to-br ${tool.accent} p-4 text-white`}>
          <p className="text-xs font-semibold tracking-[0.08em] text-white/75">
            Gerador
          </p>
          <h2 className="mt-1.5 font-['Sora'] text-xl font-extrabold">
            {tool.name}
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-5 text-white/86">
            {tool.description}
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[20px] border border-cyan-100 bg-cyan-50/80 p-4">
            <p className="text-sm font-bold text-slate-900">Como usar</p>
            <p className="mt-2 text-[14px] leading-6 text-slate-600">
              Preencha os campos na ordem, use "Preencher exemplo" se quiser um
              modelo pronto e depois clique em "Gerar agora". O resultado
              aparece logo abaixo para copiar ou baixar.
            </p>
          </div>

          {advancedFields ? (
            <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white/82 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Modo {simpleMode ? "simples" : "completo"}
                </p>
                <p className="mt-1 text-[14px] leading-6 text-slate-600">
                  {simpleMode
                    ? `Mostrando primeiro os campos essenciais. ${advancedFields} opcao(oes) extra(s) estao ocultas para nao confundir.`
                    : "Todas as opcoes da ferramenta estao visiveis."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSimpleMode((current) => !current)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                {simpleMode ? "Mostrar opcoes avancadas" : "Voltar ao modo simples"}
              </button>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
              <p className="text-xs font-medium text-slate-500">
                Parametros
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                {tool.inputs.length}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
              <p className="text-xs font-medium text-slate-500">
                Execucao
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                Instantanea
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3 sm:col-span-2">
              <p className="text-xs font-medium text-slate-500">
                Progresso
              </p>
              <p className="mt-1.5 text-base font-extrabold text-slate-950">
                {filledFields} de {tool.inputs.length} configurado(s)
              </p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={controller.submit}>
            {visibleFields.map((field, index) => (
              <DynamicField
                key={field.name}
                field={field}
                value={controller.formData[field.name]}
                onChange={controller.updateField}
                autoFocus={index === 0}
                stepIndex={index}
              />
            ))}

            <ToolFormActions
              submitLabel="Gerar agora"
              submitBusyLabel="Gerando..."
              canSubmit={canSubmit}
              isLoading={controller.isLoading}
              onReset={controller.resetForm}
              onFillExample={controller.fillExampleValues}
              helperMessage={
                controller.isLoading
                  ? "Gerando saida com os parametros informados."
                  : canSubmit
                  ? "Parametros prontos para gerar."
                  : `Faltam ${missingRequiredFields} campo(s) obrigatorio(s).`
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
        emptyMessage="Configure os parametros para gerar o resultado."
        onClear={controller.resetForm}
      />
    </div>
  );
}
