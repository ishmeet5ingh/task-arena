import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import Task from "@/models/Task";

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const result = await Task.updateMany(
    {
      userId: user._id,
      taskDateKey: todayKey,
      ...activeTaskFilter,
      status: { $in: ["pending", "active"] },
      dueTime: { $lt: new Date() }
    },
    { status: "overdue" }
  );
  return NextResponse.json({ updated: result.modifiedCount });
}
