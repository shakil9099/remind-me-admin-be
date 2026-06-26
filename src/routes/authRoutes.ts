import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminToken, requireAdmin } from "../auth.js";
import { getAdminRecord, updateAdminPassword } from "../adminStore.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .refine((value) => /[A-Z]/.test(value), "New password must include an uppercase letter")
    .refine((value) => /[a-z]/.test(value), "New password must include a lowercase letter")
    .refine((value) => /\d/.test(value), "New password must include a number"),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  const admin = await getAdminRecord();
  const usernameMatches = parsed.data.username === admin.username;
  const passwordMatches = await bcrypt.compare(parsed.data.password, admin.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    res.status(401).json({ message: "Invalid username or password" });
    return;
  }

  const token = createAdminToken({
    sub: "admin",
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
  });

  res.json({
    token,
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
  });
});

router.post("/change-password", requireAdmin, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid password" });
    return;
  }

  const admin = await getAdminRecord();
  const currentPasswordMatches = await bcrypt.compare(
    parsed.data.currentPassword,
    admin.passwordHash,
  );

  if (!currentPasswordMatches) {
    res.status(401).json({ message: "Current password is incorrect" });
    return;
  }

  const updatedAdmin = await updateAdminPassword(parsed.data.newPassword);
  const token = createAdminToken({
    sub: "admin",
    username: updatedAdmin.username,
    mustChangePassword: updatedAdmin.mustChangePassword,
  });

  res.json({
    token,
    username: updatedAdmin.username,
    mustChangePassword: updatedAdmin.mustChangePassword,
  });
});

router.get("/me", requireAdmin, async (req, res) => {
  const admin = await getAdminRecord();

  res.json({
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
  });
});

export { router as authRoutes };
