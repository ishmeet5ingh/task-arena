import { NextRequest, NextResponse } from "next/server";
import { logActivity, requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  await logActivity({ userId: String(user._id), action: "reward_claimed", metadata: { at: new Date().toISOString() } });
  return NextResponse.json({ ok: true, message: "Rewards synchronized" });
}
