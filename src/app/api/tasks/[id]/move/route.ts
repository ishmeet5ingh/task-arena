import { NextRequest, NextResponse } from "next/server";
import { logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import { moveTaskSchema } from "@/lib/validations";
import Task from "@/models/Task";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;
  const parsed = moveTaskSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid box position" }, { status: 400 });

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const occupied = await Task.findOne({
    userId: user._id,
    boxPosition: parsed.data.boxPosition,
    taskDateKey: todayKey,
    ...activeTaskFilter,
    _id: { $ne: id }
  });
  if (occupied) return NextResponse.json({ error: "Target slot is occupied" }, { status: 409 });
  const task = await Task.findOneAndUpdate(
    { _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter },
    { boxPosition: parsed.data.boxPosition },
    { new: true }
  );
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await logActivity({ userId: String(user._id), action: "task_moved", taskId: String(task._id), metadata: { boxPosition: task.boxPosition } });
  return NextResponse.json({ task: serializeDoc(task) });
}
