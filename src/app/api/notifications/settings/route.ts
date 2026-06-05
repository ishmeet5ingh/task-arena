import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { mergeNotificationSettings, notificationSettingDefaults, type NotificationSettings } from "@/lib/notificationSettings";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const input = body.settings ?? {};
  const update: Partial<Record<`notificationSettings.${keyof NotificationSettings}`, boolean>> = {};

  for (const key of Object.keys(notificationSettingDefaults) as Array<keyof NotificationSettings>) {
    if (typeof input[key] === "boolean") {
      update[`notificationSettings.${key}`] = input[key];
    }
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No notification settings provided" }, { status: 400 });
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true }).select("notificationSettings");
  return NextResponse.json({
    settings: mergeNotificationSettings(updatedUser?.notificationSettings)
  });
}
