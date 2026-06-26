import { Schema, model, models, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AdminRecord = InferSchemaType<typeof adminSchema> & { updatedAt: Date };

export const AdminModel = models.Admin ?? model<AdminRecord>("Admin", adminSchema);
