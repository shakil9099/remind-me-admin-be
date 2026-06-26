import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDatabase } from "./database.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

const app = express();

app.use(
  cors({
    origin: config.adminFeOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "remind-me-admin-be" });
});

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Admin backend listening on http://localhost:${config.port}`);
});

void connectDatabase().catch((error) => {
  console.error("Failed to connect to MongoDB", error);
});
