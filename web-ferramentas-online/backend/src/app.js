import cors from "cors";
import express from "express";
import toolsRoutes from "./routes/tools.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", toolsRoutes);

export default app;
