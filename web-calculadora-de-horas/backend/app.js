import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { initDb } from "./database/db.js";
import conversionRouter from "./routes/conversion.js";
import userRouter from "./routes/user.js";

const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "app")));

await initDb();

app.use("/api/conversions", conversionRouter);
app.use("/api/users", userRouter);
const swaggerDocument = JSON.parse(
  fs.readFileSync("./backend/docs/swagger.json", "utf8"),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});

app.get("/api", (req, res) => {
  res.json({
    status: "Online",
    message: "Olá! Bem-vindo à API de Conversão de Unidades.",
    version: "1.0.0",
    documentation: "/api-docs",
    app: "/",
    dev: "MaxsuelDavid",
  });
});

export default app;
