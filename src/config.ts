import { readFileSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGODB_URI) {
  try {
    const backendEnv = dotenv.parse(readFileSync("../remind-me-backend/.env"));
    process.env.MONGODB_URI = backendEnv.MONGODB_URI;
  } catch {
    // The local default below keeps development startup predictable.
  }
}

export const config = {
  port: Number(process.env.PORT ?? 4001),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/remind-me",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD ?? "Admin@123",
  jwtSecret:
    process.env.JWT_SECRET ?? "dev-only-change-this-admin-jwt-secret-value",
  adminFeOrigin: process.env.ADMIN_FE_ORIGIN ?? "http://localhost:3001",
};
