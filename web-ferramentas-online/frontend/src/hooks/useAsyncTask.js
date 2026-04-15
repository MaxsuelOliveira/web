import { useState } from "react";

export function useAsyncTask(initialValue = null) {
  const [data, setData] = useState(initialValue);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function run(task) {
    setIsLoading(true);
    setError("");

    try {
      const result = await task();
      setData(result);
      return result;
    } catch (taskError) {
      const message =
        taskError instanceof Error ? taskError.message : "Erro inesperado.";
      setError(message);
      throw taskError;
    } finally {
      setIsLoading(false);
    }
  }

  function reset(nextValue = initialValue) {
    setData(nextValue);
    setError("");
    setIsLoading(false);
  }

  return {
    data,
    error,
    isLoading,
    run,
    reset,
  };
}
