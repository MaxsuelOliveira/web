import crypto from "crypto";
import { Router } from "express";
import { convertDays } from "../models/conversion.js";
import {
  createConversion,
  deleteConversion,
  getConversion,
  getConversions,
  getUserConversions,
  updateConversion,
} from "../models/crud.js";

const router = Router();

// Histórico de conversões por usuário
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const list = await getUserConversions(userId);
  res.json(list);
});

router.get("/", async (req, res) => {
  const list = await getConversions();
  res.json(list);
});

router.get("/:id", async (req, res) => {
  const item = await getConversion(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

router.post("/", async (req, res) => {
  const { days, userId } = req.body;
  if (typeof days !== "number" || !userId)
    return res.status(400).json({ error: "Invalid input" });
  const result = convertDays(days);
  const conversion = {
    id: crypto.randomUUID(),
    userId,
    days,
    ...result,
    createdAt: new Date().toISOString(),
  };
  await createConversion(conversion);
  res.status(201).json(conversion);
});

router.put("/:id", async (req, res) => {
  const { days } = req.body;
  if (typeof days !== "number")
    return res.status(400).json({ error: "Invalid input" });
  const result = convertDays(days);
  await updateConversion(req.params.id, { days, ...result });
  res.json({ id: req.params.id, days, ...result });
});

router.delete("/:id", async (req, res) => {
  await deleteConversion(req.params.id);
  res.status(204).end();
});

export default router;
