import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const { id } = await ctx.params;
  const tasks = await Task.find({ userId: id }).sort({ createdAt: -1 });
  return NextResponse.json({ tasks: serializeDoc(tasks) });
}
