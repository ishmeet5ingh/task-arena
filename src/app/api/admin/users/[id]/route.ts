import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const { id } = await ctx.params;
  const user = await User.findById(id).select("-password");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: serializeDoc(user) });
}
