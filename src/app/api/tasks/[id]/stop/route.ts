import { NextRequest, NextResponse } from "next/server";
import { logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import Task from "@/models/Task";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const task = await Task.findOne({ _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter, status: "active" });
  if (!task) return NextResponse.json({ error: "Task not found or timer is not running" }, { status: 404 });

  const now = new Date();
  const previousElapsed = Math.max(0, Number(task.timerElapsedSeconds ?? 0));
  const startedAt = task.startTime ? new Date(task.startTime).getTime() : now.getTime();
  const currentElapsed = Number.isFinite(startedAt) ? Math.max(0, Math.floor((now.getTime() - startedAt) / 1000)) : 0;
  const durationSeconds = task.durationMinutes ? task.durationMinutes * 60 : null;
  const timerElapsedSeconds = durationSeconds
    ? Math.min(durationSeconds, previousElapsed + currentElapsed)
    : previousElapsed + currentElapsed;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: task._id },
    {
      $set: { status: "pending", timerElapsedSeconds },
      $unset: {
        startTime: 1,
        "notifications.startSentAt": 1,
        "notifications.endSentAt": 1
      }
    },
    { new: true }
  );

  await logActivity({
    userId: String(user._id),
    action: "timer_stopped",
    taskId: String(task._id),
    metadata: { title: task.title, timerElapsedSeconds }
  });
  return NextResponse.json({ task: serializeDoc(updatedTask) });
}
