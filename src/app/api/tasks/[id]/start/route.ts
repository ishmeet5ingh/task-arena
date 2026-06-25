import { NextRequest, NextResponse } from "next/server";
import { logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import { trySendUserNotificationForSetting } from "@/lib/firebase/notifications";
import Task from "@/models/Task";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const now = new Date();
  const task = await Task.findOneAndUpdate(
    { _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter, status: { $in: ["pending", "overdue"] } },
    {
      $set: {
        status: "active",
        startTime: now,
        "notifications.startSentAt": now
      },
      $unset: { "notifications.endSentAt": 1 }
    },
    { new: true }
  );
  if (!task) return NextResponse.json({ error: "Task not found or already completed" }, { status: 404 });
  await logActivity({ userId: String(user._id), action: "timer_started", taskId: String(task._id), metadata: { title: task.title } });
  await trySendUserNotificationForSetting(user, "taskStart", {
    title: "Task starting now",
    body: `"${task.title}" starts now.`,
    link: "/dashboard/game"
  });
  return NextResponse.json({ task: serializeDoc(task) });
}
