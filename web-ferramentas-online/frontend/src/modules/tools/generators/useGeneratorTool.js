import { useMemo, useState } from "react";
import { createExampleValues } from "../../../lib/toolForms";
import { executeGeneratorTool } from "./useCases";

function createInitialState(tool) {
  return Object.fromEntries(
    (tool.inputs || []).map((field) => {
      if (field.defaultValue !== undefined) {
        return [field.name, field.defaultValue];
      }

      if (field.type === "checkbox") {
        return [field.name, true];
      }

      if (field.type === "select") {
        return [field.name, field.options[0]?.value ?? ""];
      }

      return [field.name, ""];
    }),
  );
}

export function useGeneratorTool(tool) {
  const initialState = useMemo(() => createInitialState(tool), [tool]);
  const [formData, setFormData] = useState(initialState);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setFormData(initialState);
    setData(null);
    setError("");
    setIsLoading(false);
  }

  function fillExampleValues() {
    setFormData((current) => ({
      ...current,
      ...createExampleValues(tool),
    }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      setData(executeGeneratorTool(tool.id, formData));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha na geracao.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return {
    data,
    error,
    isLoading,
    formData,
    updateField,
    submit,
    resetForm,
    fillExampleValues,
  };
}
