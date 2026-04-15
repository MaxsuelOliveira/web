import { postToApi } from "../../../lib/api";

export async function executeLookupTool(toolId, payload) {
  const response = await postToApi("/api/tools/execute", { toolId, payload });
  return response.result;
}
