import { Schema, model, models, type InferSchemaType } from "mongoose";

const reminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    remindOn: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["upcoming", "completed", "postponed"],
      default: "upcoming",
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ReminderRecord = InferSchemaType<typeof reminderSchema>;

export const ReminderModel =
  models.Reminder ?? model<ReminderRecord>("Reminder", reminderSchema);
