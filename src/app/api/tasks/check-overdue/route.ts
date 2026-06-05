import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import { trySendUserNotificationForSetting } from "@/lib/firebase/notifications";
import Task from "@/models/Task";

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const now = new Date();
  const tasks = await Task.find({
    userId: user._id,
    taskDateKey: todayKey,
    ...activeTaskFilter,
    status: { $in: ["pending", "active"] },
    dueTime: { $lt: now },
    $or: [{ "notifications.overdueSentAt": { $exists: false } }, { "notifications.overdueSentAt": null }]
  }).select("title");

  for (const task of tasks) {
    await trySendUserNotificationForSetting(user, "overdue", {
      title: "Task overdue",
      body: `"${task.title}" was not completed on time.`,
      link: "/dashboard/game"
    });
  }

  const result = await Task.updateMany(
    {
      userId: user._id,
      taskDateKey: todayKey,
      ...activeTaskFilter,
      status: { $in: ["pending", "active"] },
      dueTime: { $lt: now }
    },
    { status: "overdue", "notifications.overdueSentAt": now }
  );
  return NextResponse.json({ updated: result.modifiedCount, notified: tasks.length });
}
