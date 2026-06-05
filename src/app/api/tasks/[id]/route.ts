import { NextRequest, NextResponse } from "next/server";
import { cleanDate, logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import { priorityReward } from "@/lib/utils";
import { updateTaskSchema } from "@/lib/validations";
import Task from "@/models/Task";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const task = await Task.findOne({ _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ task: serializeDoc(task) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const parsed = updateTaskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid task update" }, { status: 400 });
  }

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const update = {
    ...parsed.data,
    rewardPoints: parsed.data.priority ? priorityReward[parsed.data.priority] : undefined,
    startTime: cleanDate(parsed.data.startTime),
    dueTime: cleanDate(parsed.data.dueTime)
  };
  const $unset: Record<string, 1> = {};
  if ("startTime" in parsed.data) {
    $unset["notifications.startSentAt"] = 1;
    $unset["notifications.endSentAt"] = 1;
  }
  if ("durationMinutes" in parsed.data) $unset["notifications.endSentAt"] = 1;
  if ("dueTime" in parsed.data) {
    $unset["notifications.dueSoonSentAt"] = 1;
    $unset["notifications.overdueSentAt"] = 1;
  }
  const task = await Task.findOneAndUpdate(
    { _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter },
    Object.keys($unset).length ? { $set: update, $unset } : update,
    { new: true }
  );
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await logActivity({ userId: String(user._id), action: "task_edited", taskId: String(task._id), metadata: { title: task.title } });
  return NextResponse.json({ task: serializeDoc(task) });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const task = await Task.findOneAndDelete({ _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await logActivity({ userId: String(user._id), action: "task_deleted", taskId: String(task._id), metadata: { title: task.title } });
  return NextResponse.json({ ok: true });
}
