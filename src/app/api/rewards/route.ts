import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import Badge from "@/models/Badge";
import Reward from "@/models/Reward";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const rewards = await Reward.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
  const badges = await Badge.find({ userId: user._id }).sort({ earnedAt: -1 });
  return NextResponse.json({ rewards: serializeDoc(rewards), badges: serializeDoc(badges) });
}
