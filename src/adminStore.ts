import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { connectDatabase } from "./database.js";
import { AdminModel } from "./models/Admin.js";

export type AdminRecord = {
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  updatedAt: string;
};

async function ensureConnected() {
  await connectDatabase();
}

export async function getAdminRecord(): Promise<AdminRecord> {
  await ensureConnected();

  let doc = await AdminModel.findOne({ username: config.adminUsername });

  if (!doc) {
    const passwordHash = await bcrypt.hash(config.adminDefaultPassword, 12);
    doc = await AdminModel.create({
      username: config.adminUsername,
      passwordHash,
      mustChangePassword: true,
    });
  }

  return {
    username: doc.username,
    passwordHash: doc.passwordHash,
    mustChangePassword: doc.mustChangePassword,
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

export async function saveAdminRecord(record: Omit<AdminRecord, "updatedAt">): Promise<AdminRecord> {
  await ensureConnected();

  const doc = await AdminModel.findOneAndUpdate(
    { username: record.username },
    { passwordHash: record.passwordHash, mustChangePassword: record.mustChangePassword },
    { new: true, upsert: true },
  );

  return {
    username: doc!.username,
    passwordHash: doc!.passwordHash,
    mustChangePassword: doc!.mustChangePassword,
    updatedAt: (doc!.updatedAt as Date).toISOString(),
  };
}

export async function updateAdminPassword(newPassword: string): Promise<AdminRecord> {
  const record = await getAdminRecord();
  return saveAdminRecord({
    username: record.username,
    passwordHash: await bcrypt.hash(newPassword, 12),
    mustChangePassword: false,
  });
}
