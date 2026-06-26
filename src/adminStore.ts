import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";
import { config } from "./config.js";

export type AdminRecord = {
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  updatedAt: string;
};

const dataFile = resolve(process.cwd(), config.adminDataFile);

async function createDefaultRecord(): Promise<AdminRecord> {
  return {
    username: config.adminUsername,
    passwordHash: await bcrypt.hash(config.adminDefaultPassword, 12),
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function getAdminRecord(): Promise<AdminRecord> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw) as AdminRecord;
  } catch (error) {
    const record = await createDefaultRecord();
    await saveAdminRecord(record);
    return record;
  }
}

export async function saveAdminRecord(record: AdminRecord): Promise<void> {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(record, null, 2), "utf8");
}

export async function updateAdminPassword(newPassword: string): Promise<AdminRecord> {
  const record = await getAdminRecord();
  const nextRecord: AdminRecord = {
    ...record,
    passwordHash: await bcrypt.hash(newPassword, 12),
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  await saveAdminRecord(nextRecord);
  return nextRecord;
}
