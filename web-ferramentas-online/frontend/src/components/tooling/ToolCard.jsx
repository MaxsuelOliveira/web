import { classNames } from "../../lib/utils";

function getFamilyLabel(family) {
  if (family === "lookup") {
    return "Consulta";
  }

  if (family === "generator") {
    return "Gerador";
  }

  if (family === "tester") {
    return "Teste";
  }

  return "Texto";
}

function getStatusLabel(tool, isActive, highlightLabel) {
  if (highlightLabel) {
    return highlightLabel;
  }

  if (isActive) {
    return "Aberta";
  }

  if (tool.isQuickAccess) {
    return "Popular";
  }

  if (tool.isFeaturedNew) {
    return "Novo";
  }

  return getFamilyLabel(tool.family);
}

export default function ToolCard({
  tool,
  isActive,
  onSelect,
  highlightLabel = "",
}) {
  const totalInputs = tool.inputs?.length ?? 0;
  const requiredInputs =
    tool.inputs?.filter((input) => input.required).length ?? 0;
  const statusLabel = getStatusLabel(tool, isActive, highlightLabel);

  return (
    <button
      type="button"
      onClick={() => onSelect(tool.slug)}
      className={classNames(
        "group w-full rounded-[24px] border p-4 text-left transition duration-200",
        isActive
          ? `bg-linear-to-br ${tool.accent} border-white/30 text-white shadow-2xl shadow-cyan-500/18`
          : "bg-white/74 text-slate-800 shadow-[0_16px_40px_rgba(15,68,98,0.08)] hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={classNames(
            `inline-flex rounded-full bg-linear-to-r ${tool.accent} px-3 py-1.5 text-xs font-semibold text-white`,
            isActive ? "shadow-none" : "shadow-sm",
          )}
        >
          {tool.badge}
        </span>

        <span
          className={classNames(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            isActive
              ? "bg-white/12 text-white/88"
              : tool.isQuickAccess
                ? "bg-cyan-50 text-cyan-700"
                : tool.isFeaturedNew
                  ? "bg-orange-50 text-orange-700"
                  : "bg-slate-100 text-slate-500",
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="text-base font-extrabold leading-6">{tool.name}</h3>
      </div>

      <p
        className={classNames(
          "mt-2 text-[14px] leading-6",
          isActive ? "text-white/88" : "text-slate-600",
        )}
      >
        {tool.description}
      </p>

      {tool.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={classNames(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium lowercase tracking-[0.02em]",
                isActive
                  ? "border-white/12 bg-white/12 text-white/88"
                  : "border-slate-200 bg-white text-slate-500",
              )}
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={classNames(
            "text-[12px] font-medium",
            isActive ? "text-white/80" : "text-slate-400",
          )}
        >
          {!totalInputs
            ? "Execucao direta"
            : requiredInputs
              ? `${requiredInputs} obrigatorio(s) de ${totalInputs} campo(s)`
              : `${totalInputs} campo(s) sem obrigatorio`}
        </span>
        <span
          className={classNames(
            "text-sm font-semibold transition",
            isActive
              ? "text-white"
              : "text-slate-700 group-hover:text-cyan-700",
          )}
        >
          {isActive ? "Ferramenta aberta" : "Abrir ferramenta"}
        </span>
      </div>
    </button>
  );
}
