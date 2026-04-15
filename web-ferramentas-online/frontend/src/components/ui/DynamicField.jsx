function FieldHeader({ field, hasValue, onUseExample, onClear, stepIndex }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {typeof stepIndex === "number" ? (
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
              Passo {stepIndex + 1}
            </span>
          ) : null}
          {field.required ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Obrigatorio
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              Opcional
            </span>
          )}
        </div>

        <div>
          <span className="text-[15px] font-bold text-slate-800">
            {field.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {field.placeholder ? (
          <button
            type="button"
            onClick={onUseExample}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
          >
            Usar exemplo
          </button>
        ) : null}
        {hasValue ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getFieldClassName(type) {
  const baseClassName =
    "w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100";

  if (type === "textarea") {
    return `${baseClassName} min-h-32 resize-y leading-6`;
  }

  return baseClassName;
}

function getStringValue(value) {
  return typeof value === "string" ? value : "";
}

function getHelperText(field) {
  if (field.helperText) {
    return field.helperText;
  }

  if (field.type === "select") {
    return "Escolha a opcao que mais combina com o que voce quer gerar ou consultar.";
  }

  if (field.type === "checkbox") {
    return "Ative esta opcao somente se quiser incluir esse comportamento no resultado.";
  }

  if (field.placeholder) {
    return `Exemplo para preencher: ${field.placeholder}`;
  }

  if (field.required) {
    return "Este campo precisa ser preenchido para continuar.";
  }

  return "Voce pode deixar este campo em branco se nao precisar personalizar.";
}

export default function DynamicField({
  field,
  value,
  onChange,
  autoFocus = false,
  stepIndex,
}) {
  const textValue = getStringValue(value);
  const hasValue =
    field.type === "checkbox" ? Boolean(value) : textValue.trim().length > 0;
  const helperText = getHelperText(field);

  if (field.type === "textarea") {
    return (
      <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-4">
        <FieldHeader
          field={field}
          hasValue={hasValue}
          onUseExample={() => onChange(field.name, field.placeholder || "")}
          onClear={() => onChange(field.name, "")}
          stepIndex={stepIndex}
        />
        <textarea
          className={getFieldClassName(field.type)}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          spellCheck={false}
          autoFocus={autoFocus}
        />
        <span className="text-[13px] leading-5 text-slate-500">
          {helperText}
        </span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-4">
        <FieldHeader
          field={field}
          hasValue={hasValue}
          onUseExample={() =>
            onChange(field.name, field.options?.[0]?.value ?? "")
          }
          onClear={() => onChange(field.name, field.options?.[0]?.value ?? "")}
          stepIndex={stepIndex}
        />
        <select
          className={getFieldClassName(field.type)}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          autoFocus={autoFocus}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-[13px] leading-5 text-slate-500">
          {helperText}
        </span>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-4 transition hover:border-cyan-200">
        <FieldHeader
          field={field}
          hasValue={hasValue}
          onUseExample={() => onChange(field.name, true)}
          onClear={() => onChange(field.name, false)}
          stepIndex={stepIndex}
        />

        <div className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <span className="block text-sm font-semibold text-slate-800">
              {Boolean(value) ? "Opcao ativada" : "Opcao desativada"}
            </span>
            <span className="mt-1 block text-[13px] leading-5 text-slate-500">
              {helperText}
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.name, event.target.checked)}
            className="h-5 w-5 accent-cyan-600"
            autoFocus={autoFocus}
          />
        </div>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-4">
      <FieldHeader
        field={field}
        hasValue={hasValue}
        onUseExample={() => onChange(field.name, field.placeholder || "")}
        onClear={() => onChange(field.name, "")}
        stepIndex={stepIndex}
      />
      <input
        className={getFieldClassName(field.type)}
        type={field.type}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
        autoFocus={autoFocus}
      />
      <span className="text-[13px] leading-5 text-slate-500">
        {helperText}
      </span>
    </label>
  );
}
