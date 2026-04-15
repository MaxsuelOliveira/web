import { brasilToolHandlers } from "./handlers/brasilTools.js";
import { networkToolHandlers } from "./handlers/networkTools.js";
import { registryToolHandlers } from "./handlers/registryTools.js";
import { testerToolHandlers } from "./handlers/testerTools.js";

const toolHandlers = {
  ...brasilToolHandlers,
  ...networkToolHandlers,
  ...registryToolHandlers,
  ...testerToolHandlers,
};

export async function executeTool(toolId, payload = {}) {
  const handler = toolHandlers[toolId];

  if (!handler) {
    throw new Error("Ferramenta nao encontrada no backend.");
  }

  return handler(payload);
}
