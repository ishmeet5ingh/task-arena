import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ensureDailyRollover } from "@/lib/daily";
import DailyHistory from "@/models/DailyHistory";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  await ensureDailyRollover(String(user._id));

  const history = await DailyHistory.find({ userId: user._id }).sort({ dateKey: -1 }).limit(90);
  return NextResponse.json({ history: serializeDoc(history) });
}
