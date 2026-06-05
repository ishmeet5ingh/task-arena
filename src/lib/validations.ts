import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, "Password is required")
});

export const taskSchema = z.object({
  title: z.string().min(2).max(90),
  description: z.string().max(1000).optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  boxPosition: z.coerce.number().int().min(0).max(11),
  startTime: z.string().datetime().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5).max(720).optional(),
  dueTime: z.string().datetime().optional().or(z.literal(""))
});

export const updateTaskSchema = taskSchema.partial().extend({
  status: z.enum(["pending", "active", "completed", "overdue"]).optional()
});

export const moveTaskSchema = z.object({
  boxPosition: z.coerce.number().int().min(0).max(11)
});
