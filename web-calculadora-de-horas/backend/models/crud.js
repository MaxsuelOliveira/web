import { openDb } from "../database/db.js";

export async function createConversion(conversion) {
  const db = await openDb();
  await db.run(
    `INSERT INTO conversions (id, userId, days, horas, minutos, segundos, semanas, meses, anos, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    conversion.id,
    conversion.userId,
    conversion.days,
    conversion.horas,
    conversion.minutos,
    conversion.segundos,
    conversion.semanas,
    conversion.meses,
    conversion.anos,
    conversion.createdAt,
  );
}

export async function getConversions() {
  const db = await openDb();
  return db.all("SELECT * FROM conversions");
}

export async function getConversion(id) {
  const db = await openDb();
  return db.get("SELECT * FROM conversions WHERE id = ?", id);
}

export async function updateConversion(id, data) {
  const db = await openDb();
  await db.run(
    `UPDATE conversions SET days = ?, horas = ?, minutos = ?, segundos = ?, semanas = ?, meses = ?, anos = ? WHERE id = ?`,
    data.days,
    data.horas,
    data.minutos,
    data.segundos,
    data.semanas,
    data.meses,
    data.anos,
    id,
  );
}

export async function deleteConversion(id) {
  const db = await openDb();
  await db.run("DELETE FROM conversions WHERE id = ?", id);
}

export async function createUser(user) {
  const db = await openDb();
  await db.run(
    "INSERT INTO users (id, name, createdAt) VALUES (?, ?, ?)",
    user.id,
    user.name,
    user.createdAt,
  );
}

export async function getUser(id) {
  const db = await openDb();
  return db.get("SELECT * FROM users WHERE id = ?", id);
}

export async function getUserConversions(userId) {
  const db = await openDb();
  return db.all(
    "SELECT * FROM conversions WHERE userId = ? ORDER BY createdAt DESC",
    userId,
  );
}
