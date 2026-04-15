export default function ToolViewHeader({ toneLabel, tool }) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] border border-white/70 bg-white/74 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.08em] text-cyan-700">
          {toneLabel}
        </span>
        <span
          className={`inline-flex rounded-full bg-linear-to-r ${tool.accent} px-3 py-1.5 text-xs font-medium text-white`}
        >
          {tool.badge}
        </span>
      </div>

      <div>
        <h3 className="font-['Sora'] text-lg font-extrabold text-slate-950">
          {tool.name}
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-slate-600">
          {tool.description}
        </p>
      </div>
    </div>
  );
}
