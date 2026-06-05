import { NextResponse } from "next/server";
import { authCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validations";
import { publicUser } from "@/lib/utils";
import User from "@/models/User";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid credentials");

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email });
  if (!user) return jsonError("Invalid email or password", 401);

  const valid = await verifyPassword(parsed.data.password, user.password);
  if (!valid) return jsonError("Invalid email or password", 401);

  const token = signAuthToken({ userId: String(user._id), email: user.email });
  const response = NextResponse.json({ user: publicUser(user) });
  response.cookies.set(authCookie(token));
  return response;
}
