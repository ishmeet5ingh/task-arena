import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const { id } = await ctx.params;
  const activity = await ActivityLog.find({ userId: id }).sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ activity: serializeDoc(activity) });
}
