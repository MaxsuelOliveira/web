import { Router } from "express";
import { executeTool } from "../services/toolService.js";

const router = Router();

router.get("/health", (_request, response) => {
  response.json({ ok: true, service: "backend-tools" });
});

router.post("/tools/execute", async (request, response) => {
  try {
    const { toolId, payload } = request.body || {};
    const result = await executeTool(toolId, payload);
    response.json({ ok: true, result });
  } catch (error) {
    response.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Erro inesperado.",
    });
  }
});

export default router;
