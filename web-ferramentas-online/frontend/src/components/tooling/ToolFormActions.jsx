export default function ToolFormActions({
  submitLabel,
  submitBusyLabel,
  isLoading = false,
  canSubmit = true,
  onReset,
  onFillExample,
  helperMessage = "",
  helperTone = "default",
}) {
  const helperToneClassName =
    helperTone === "success"
      ? "text-emerald-700"
      : helperTone === "warning"
        ? "text-amber-700"
        : helperTone === "loading"
          ? "text-cyan-700"
          : "text-slate-400";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">
      {helperMessage ? (
        <p className={`mb-3 text-sm font-medium leading-6 ${helperToneClassName}`}>
          {helperMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="submit"
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? submitBusyLabel : submitLabel}
        </button>
        <button
          className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onFillExample}
        >
          Preencher exemplo
        </button>
        <button
          className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          type="button"
          onClick={onReset}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
