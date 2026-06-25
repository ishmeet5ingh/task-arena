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
  const task = await Task.findOneAndUpdate(
    { _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter, status: "active" },
    {
      $set: { status: "pending" },
      $unset: {
        startTime: 1,
        "notifications.startSentAt": 1,
        "notifications.endSentAt": 1
      }
    },
    { new: true }
  );
  if (!task) return NextResponse.json({ error: "Task not found or timer is not running" }, { status: 404 });

  await logActivity({ userId: String(user._id), action: "timer_stopped", taskId: String(task._id), metadata: { title: task.title } });
  return NextResponse.json({ task: serializeDoc(task) });
}
