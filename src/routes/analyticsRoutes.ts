import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAdmin } from "../auth.js";
import { connectDatabase } from "../database.js";
import { ReminderModel } from "../models/Reminder.js";
import { UserModel } from "../models/User.js";

const router = Router();

const querySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

type SeriesPoint = {
  date: string;
  count: number;
};

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(23, 59, 59, 999);
  return next;
}

function defaultRange() {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  start.setUTCDate(start.getUTCDate() - 29);
  return { start, end };
}

function parseRange(query: unknown) {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return undefined;
  }

  const fallback = defaultRange();
  const start = startOfDay(parsed.data.startDate ?? fallback.start);
  const end = endOfDay(parsed.data.endDate ?? fallback.end);
  if (start > end) {
    return undefined;
  }

  return { start, end };
}

function emptySeries(start: Date, end: Date): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const cursor = startOfDay(start);
  while (cursor <= end) {
    points.push({ date: toDayKey(cursor), count: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

async function countByDay(
  model: typeof UserModel | typeof ReminderModel,
  dateField: string,
  match: Record<string, unknown>,
  start: Date,
  end: Date,
) {
  const rows = await model.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        $and: [match, { [dateField]: { $gte: start, $lte: end } }],
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return emptySeries(start, end).map((point) => ({
    ...point,
    count: counts.get(point.date) ?? 0,
  }));
}

async function buildAnalytics(start: Date, end: Date, userId?: Types.ObjectId) {
  const userMatch = userId ? { _id: userId } : {};
  const reminderUserMatch = userId ? { userId } : {};
  const now = new Date();

  const [usersJoined, upcoming, notCompleted, completed] = await Promise.all([
    countByDay(UserModel, "createdAt", userMatch, start, end),
    countByDay(
      ReminderModel,
      "remindOn",
      {
        ...reminderUserMatch,
        remindOn: { $gt: now },
        $or: [
          { status: { $in: ["upcoming", "postponed"] } },
          { status: { $exists: false } },
        ],
      },
      start,
      end,
    ),
    countByDay(
      ReminderModel,
      "remindOn",
      {
        ...reminderUserMatch,
        remindOn: { $lte: now },
        $or: [
          { status: { $in: ["upcoming", "postponed"] } },
          { status: { $exists: false } },
        ],
      },
      start,
      end,
    ),
    countByDay(
      ReminderModel,
      "completedAt",
      {
        ...reminderUserMatch,
        status: "completed",
        completedAt: { $ne: null },
      },
      start,
      end,
    ),
  ]);

  return {
    range: {
      startDate: toDayKey(start),
      endDate: toDayKey(end),
    },
    usersJoined,
    reminders: {
      upcoming,
      notCompleted,
      completed,
    },
    totals: {
      usersJoined: usersJoined.reduce((sum, point) => sum + point.count, 0),
      upcoming: upcoming.reduce((sum, point) => sum + point.count, 0),
      notCompleted: notCompleted.reduce((sum, point) => sum + point.count, 0),
      completed: completed.reduce((sum, point) => sum + point.count, 0),
    },
  };
}

router.get("/", requireAdmin, async (req, res) => {
  const range = parseRange(req.query);
  if (!range) {
    res.status(400).json({ message: "Invalid date range" });
    return;
  }

  try {
    await connectDatabase();
  } catch {
    res.status(503).json({ message: "Database is not available" });
    return;
  }

  res.json(await buildAnalytics(range.start, range.end));
});

router.get("/users/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const range = parseRange(req.query);
  if (!range) {
    res.status(400).json({ message: "Invalid date range" });
    return;
  }

  try {
    await connectDatabase();
  } catch {
    res.status(503).json({ message: "Database is not available" });
    return;
  }

  const userId = new Types.ObjectId(id);
  const user = await UserModel.exists({ _id: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(await buildAnalytics(range.start, range.end, userId));
});

export { router as analyticsRoutes };
