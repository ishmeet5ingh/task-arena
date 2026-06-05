import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Notification token is required" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  const tokenExists = user.notificationTokens?.some((item: { token: string }) => item.token === token);

  await User.updateOne(
    { _id: user._id },
    tokenExists
      ? {
          $set: {
            notificationsEnabled: true,
            "notificationTokens.$[match].lastSeenAt": new Date(),
            "notificationTokens.$[match].userAgent": userAgent
          }
        }
      : {
          $set: { notificationsEnabled: true },
          $push: {
            notificationTokens: {
              token,
              userAgent,
              createdAt: new Date(),
              lastSeenAt: new Date()
            }
          }
        },
    tokenExists ? { arrayFilters: [{ "match.token": token }] } : undefined
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const { token } = await req.json().catch(() => ({ token: "" }));

  await User.updateOne(
    { _id: user._id },
    token
      ? {
          $pull: { notificationTokens: { token } }
        }
      : {
          $set: {
            notificationsEnabled: false,
            notificationTokens: []
          }
        }
  );

  return NextResponse.json({ ok: true });
}
