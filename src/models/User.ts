import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserRecord = InferSchemaType<typeof userSchema>;

export const UserModel = models.User ?? model<UserRecord>("User", userSchema);
