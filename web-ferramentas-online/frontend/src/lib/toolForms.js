export function isFieldFilled(field, value) {
  if (field.type === "checkbox") {
    return Boolean(value);
  }

  return String(value ?? "").trim().length > 0;
}

export function hasRequiredFields(tool, formData) {
  return (tool.inputs || []).every((field) => {
    if (!field.required) {
      return true;
    }

    return isFieldFilled(field, formData[field.name]);
  });
}

export function countFilledFields(tool, formData) {
  return (tool.inputs || []).filter((field) =>
    isFieldFilled(field, formData[field.name]),
  ).length;
}

export function countMissingRequiredFields(tool, formData) {
  return (tool.inputs || []).filter((field) => {
    if (!field.required) {
      return false;
    }

    return !isFieldFilled(field, formData[field.name]);
  }).length;
}

export function isAdvancedField(tool, field) {
  const inputs = tool.inputs || [];
  const hasRequiredFields = inputs.some((input) => input.required);

  if (field.advanced !== undefined) {
    return Boolean(field.advanced);
  }

  if (!hasRequiredFields) {
    return false;
  }

  return !field.required;
}

export function getVisibleFields(tool, simpleMode = true) {
  if (!simpleMode) {
    return tool.inputs || [];
  }

  return (tool.inputs || []).filter((field) => !isAdvancedField(tool, field));
}

export function countAdvancedFields(tool) {
  return (tool.inputs || []).filter((field) => isAdvancedField(tool, field)).length;
}

export function createExampleValues(tool) {
  return Object.fromEntries(
    (tool.inputs || []).map((field) => {
      if (field.exampleValue !== undefined) {
        return [field.name, field.exampleValue];
      }

      if (field.type === "checkbox") {
        return [field.name, field.defaultValue ?? true];
      }

      if (field.type === "select") {
        return [
          field.name,
          field.defaultValue ?? (field.options?.[0]?.value ?? ""),
        ];
      }

      if (field.type === "number") {
        return [field.name, field.defaultValue ?? (field.placeholder || "1")];
      }

      return [field.name, field.defaultValue ?? (field.placeholder || "")];
    }),
  );
}
