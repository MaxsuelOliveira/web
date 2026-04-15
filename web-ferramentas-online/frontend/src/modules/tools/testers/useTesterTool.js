import { useMemo, useState } from "react";
import { useAsyncTask } from "../../../hooks/useAsyncTask";
import { createExampleValues } from "../../../lib/toolForms";
import { executeTesterTool } from "./useCases";

function createInitialState(tool) {
  return Object.fromEntries(
    (tool.inputs || []).map((field) => {
      if (field.type === "select") {
        return [field.name, field.options[0]?.value ?? ""];
      }

      return [field.name, ""];
    }),
  );
}

export function useTesterTool(tool) {
  const initialState = useMemo(() => createInitialState(tool), [tool]);
  const [formData, setFormData] = useState(initialState);
  const task = useAsyncTask();

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setFormData(initialState);
    task.reset();
  }

  function fillExampleValues() {
    setFormData((current) => ({
      ...current,
      ...createExampleValues(tool),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    await task.run(() => executeTesterTool(tool.id, formData));
  }

  return {
    formData,
    updateField,
    submit,
    resetForm,
    fillExampleValues,
    ...task,
  };
}
