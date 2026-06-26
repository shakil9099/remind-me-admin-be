import mongoose from "mongoose";
import { config } from "./config.js";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  connectionPromise ??= mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 })
    .finally(() => {
      connectionPromise = undefined;
    });

  await connectionPromise;
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
