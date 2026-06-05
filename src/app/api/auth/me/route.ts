import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { publicUser } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;
  return NextResponse.json({ user: publicUser(user) });
}
