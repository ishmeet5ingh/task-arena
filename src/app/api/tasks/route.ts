import { NextRequest, NextResponse } from "next/server";
import { cleanDate, logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, dateFromKey, ensureDailyRollover } from "@/lib/daily";
import { priorityReward } from "@/lib/utils";
import { taskSchema } from "@/lib/validations";
import Task from "@/models/Task";
import type { SortOrder } from "mongoose";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { searchParams } = new URL(req.url);
  const query: Record<string, unknown> = {
    userId: user._id,
    taskDateKey: todayKey,
    ...activeTaskFilter
  };
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

  if (status && status !== "all") query.status = status;
  if (priority && priority !== "all") query.priority = priority;
  if (search) query.title = { $regex: search, $options: "i" };

  const sort: Record<string, SortOrder> = searchParams.get("sort") === "dueTime" ? { dueTime: 1 } : { boxPosition: 1 };
  const tasks = await Task.find(query).sort(sort);
  return NextResponse.json({ tasks: serializeDoc(tasks) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const parsed = taskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid task" }, { status: 400 });
  }

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const existing = await Task.findOne({
    userId: user._id,
    boxPosition: parsed.data.boxPosition,
    taskDateKey: todayKey,
    ...activeTaskFilter
  });
  if (existing) return NextResponse.json({ error: "That arena slot already has a task" }, { status: 409 });

  const task = await Task.create({
    ...parsed.data,
    userId: user._id,
    taskDateKey: todayKey,
    taskDate: dateFromKey(todayKey),
    rewardPoints: priorityReward[parsed.data.priority],
    startTime: cleanDate(parsed.data.startTime),
    dueTime: cleanDate(parsed.data.dueTime)
  });
  await logActivity({ userId: String(user._id), action: "task_created", taskId: String(task._id), metadata: { title: task.title } });
  return NextResponse.json({ task: serializeDoc(task) }, { status: 201 });
}
