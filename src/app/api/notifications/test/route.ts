import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { sendPushNotification } from "@/lib/firebase/notifications";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const tokens = (user.notificationTokens ?? []).map((item: { token: string }) => item.token);
  if (!tokens.length) {
    return NextResponse.json({ error: "Enable notifications on this device first" }, { status: 400 });
  }

  try {
    const result = await sendPushNotification({
      tokens,
      title: "Task Arena notifications enabled",
      body: "You will receive task reminders from Task Arena.",
      link: "/dashboard/game"
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send notification" }, { status: 500 });
  }
}
