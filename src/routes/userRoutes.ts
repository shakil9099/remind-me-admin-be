import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAdmin } from "../auth.js";
import { connectDatabase } from "../database.js";
import { UserModel } from "../models/User.js";

const router = Router();

const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function serializeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  avatarUrl?: string | null;
  lastLoginAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.get("/", requireAdmin, async (req, res) => {
  const parsed = usersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid pagination parameters" });
    return;
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  try {
    await connectDatabase();
  } catch {
    res.status(503).json({ message: "Database is not available" });
    return;
  }

  const [total, users] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email avatarUrl lastLoginAt createdAt")
      .lean(),
  ]);

  res.json({
    users: users.map(serializeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.get("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  try {
    await connectDatabase();
  } catch {
    res.status(503).json({ message: "Database is not available" });
    return;
  }

  const user = await UserModel.findById(id)
    .select("name email avatarUrl lastLoginAt createdAt updatedAt")
    .lean();

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user: serializeUser(user) });
});

export { router as userRoutes };
