import { useState } from "react";
import { useAsyncTask } from "../../../hooks/useAsyncTask";
import { executeTextTool } from "./useCases";

function createInitialState(toolId) {
  if (toolId === "base64") {
    return { text: "", mode: "encode" };
  }

  return { text: "" };
}

export function useTextTool(tool) {
  const [formData, setFormData] = useState(createInitialState(tool.id));
  const task = useAsyncTask();

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setFormData(createInitialState(tool.id));
    task.reset();
  }

  function fillExampleValues() {
    if (tool.id === "base64") {
      setFormData({
        text: "Ferramentas online para devs",
        mode: "encode",
      });
      return;
    }

    setFormData({
      text: tool.id === "jsonFormat"
        ? '{\n  "name": "paradevs",\n  "active": true\n}'
        : "Exemplo rapido para testar a ferramenta atual.",
    });
  }

  async function submit(event) {
    event.preventDefault();
    await task.run(() => executeTextTool(tool.id, formData));
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
