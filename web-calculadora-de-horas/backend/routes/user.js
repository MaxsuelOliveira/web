import crypto from "crypto";
import { Router } from "express";
import { createUser, getUser } from "../models/crud.js";
import { createTempUser } from "../models/user.js";

const router = Router();

router.post("/temp", async (req, res) => {
  const user = createTempUser();
  await createUser(user);
  res.status(201).json(user);
});

router.post("/register", async (req, res) => {
  const { name, email } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email ? email.trim() : null,
    createdAt: new Date().toISOString(),
  };

  await createUser(user);
  res.status(201).json(user);
});

router.get("/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

export default router;
