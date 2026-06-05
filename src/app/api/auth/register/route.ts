import { NextResponse } from "next/server";
import { authCookie, hashPassword, signAuthToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { publicUser } from "@/lib/utils";
import User from "@/models/User";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid data");

  await connectDB();
  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) return jsonError("An account already exists for this email", 409);

  const user = await User.create({
    ...parsed.data,
    password: await hashPassword(parsed.data.password)
  });

  const token = signAuthToken({ userId: String(user._id), email: user.email });
  const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  response.cookies.set(authCookie(token));
  return response;
}
