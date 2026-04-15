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
import { useLookupTool } from "./useLookupTool";

export default function LookupToolView({ tool }) {
  const controller = useLookupTool(tool);
  const [simpleMode, setSimpleMode] = useState(true);
  const canSubmit =
    !tool.inputs.length || hasRequiredFields(tool, controller.formData);
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-white/75">
                Consulta
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
              Preencha somente o que estiver pedido. Se nao souber o valor
              exato, use o exemplo para entender o formato esperado.
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
                    ? `Mostrando apenas o essencial primeiro. ${advancedFields} opcao(oes) complementar(es) podem ser abertas se precisar.`
                    : "Todas as opcoes de consulta estao visiveis."}
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

          <div className="rounded-[18px] border border-slate-100 bg-slate-50/90 p-3">
            <p className="text-xs font-medium text-slate-500">
              Melhor uso
            </p>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
              Preencha apenas o necessario e acompanhe o retorno consolidado no
              painel abaixo.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {filledFields} de {tool.inputs.length} campo(s) preenchido(s)
            </p>
          </div>

          <form className="space-y-3" onSubmit={controller.submit}>
            {tool.inputs.length ? (
              visibleFields.map((field, index) => (
                <DynamicField
                  key={field.name}
                  field={field}
                  value={controller.formData[field.name]}
                  onChange={controller.updateField}
                  autoFocus={index === 0}
                  stepIndex={index}
                />
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-600">
                Esta ferramenta nao exige parametros. Basta clicar para executar.
              </div>
            )}

            <ToolFormActions
              submitLabel="Executar consulta"
              submitBusyLabel="Consultando..."
              isLoading={controller.isLoading}
              canSubmit={canSubmit}
              onReset={controller.resetForm}
              onFillExample={controller.fillExampleValues}
              helperMessage={
                controller.isLoading
                  ? "Consultando dados e montando retorno."
                  : !tool.inputs.length
                  ? "Sem parametros obrigatorios."
                  : canSubmit
                    ? "Fluxo liberado para consulta."
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
        onClear={controller.resetForm}
      />
    </div>
  );
}
