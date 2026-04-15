import ToolWorkspace from "../../tooling/ToolWorkspace";

export default function WorkspacePanel({
  activeTool,
  activeCategoryLabel,
  onBackToCatalog,
}) {
  return (
    <section className="glass rounded-[28px] border border-white/60 p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-2 rounded-[20px] border border-white/70 bg-white/74 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-cyan-700">
            Workspace
          </p>
          <h2 className="mt-1.5 font-['Sora'] text-xl font-extrabold text-slate-950">
            {activeTool.name}
          </h2>
          <p className="mt-1 text-[14px] leading-6 text-slate-600">
            Preencha os campos com calma. Se ficar em duvida, use o exemplo em
            cada passo do formulario.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {activeCategoryLabel}
          </span>
          {activeTool.isFeaturedNew ? (
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
              Novo destaque
            </span>
          ) : null}
          <span
            className={`rounded-full bg-linear-to-r ${activeTool.accent} px-3 py-1.5 text-xs font-medium text-white`}
          >
            {activeTool.badge}
          </span>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            Voltar ao catalogo
          </button>
        </div>
      </div>

      <ToolWorkspace key={activeTool.id} tool={activeTool} />
    </section>
  );
}
