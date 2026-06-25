import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, getTodayKey } from "@/lib/daily";
import { notificationSettingEnabled, trySendUserNotificationForSetting } from "@/lib/firebase/notifications";
import type { NotificationSettings } from "@/lib/notificationSettings";
import Task from "@/models/Task";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DUE_SOON_MINUTES = 10;
const DAILY_SUMMARY_HOUR_IST = 20;
const IST_TIME_ZONE = "Asia/Kolkata";

type NotifiableUser = {
  _id: unknown;
  name?: string;
  notificationTokens?: Array<{ token?: string }>;
  notificationSettings?: Partial<NotificationSettings>;
};

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function getHourInTimeZone(date: Date, timeZone: string) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false
  }).format(date);
  return Number(hour);
}

async function loadUsers(userIds: unknown[]) {
  const users = await User.find({
    _id: { $in: userIds },
    notificationsEnabled: true,
    "notificationTokens.0": { $exists: true }
  }).select("name notificationTokens notificationSettings");

  return new Map(users.map((user) => [String(user._id), user as NotifiableUser]));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const todayKey = getTodayKey(now);
  const dueSoonUntil = new Date(now.getTime() + DUE_SOON_MINUTES * 60 * 1000);
  const counts = {
    start: 0,
    end: 0,
    dueSoon: 0,
    overdue: 0,
    dailySummary: 0
  };
  const diagnostics = {
    todayKey,
    checkedAt: now.toISOString(),
    startEligible: 0,
    startUsersWithTokens: 0,
    startDisabled: 0,
    startSendFailures: 0,
    endEligible: 0,
    endUsersWithTokens: 0,
    endDisabled: 0,
    endSendFailures: 0,
    dueSoonEligible: 0,
    dueSoonUsersWithTokens: 0,
    dueSoonDisabled: 0,
    dueSoonSendFailures: 0,
    overdueEligible: 0,
    overdueUsersWithTokens: 0,
    overdueDisabled: 0,
    overdueSendFailures: 0
  };

  const startTasks = await Task.find({
    taskDateKey: todayKey,
    $and: [
      activeTaskFilter,
      { $or: [{ "notifications.startSentAt": { $exists: false } }, { "notifications.startSentAt": null }] }
    ],
    status: { $in: ["pending", "active"] },
    startTime: { $lte: now }
  }).select("userId title");
  diagnostics.startEligible = startTasks.length;

  let usersById = await loadUsers(startTasks.map((task) => task.userId));
  for (const task of startTasks) {
    const user = usersById.get(String(task.userId));
    const enabled = notificationSettingEnabled(user, "taskStart");
    if (user) diagnostics.startUsersWithTokens += 1;
    if (!enabled) diagnostics.startDisabled += 1;

    if (user && enabled) {
      const result = await trySendUserNotificationForSetting(user, "taskStart", {
        title: "Task starting now",
        body: `"${task.title}" starts now.`,
        link: "/dashboard/game"
      });
      if (result.successCount > 0) counts.start += 1;
      if (result.failureCount > 0 || result.successCount === 0) diagnostics.startSendFailures += 1;
    }
    if (!enabled || user) await Task.updateOne({ _id: task._id }, { $set: { status: "active", "notifications.startSentAt": now } });
  }

  const candidateEndTasks = await Task.find({
    taskDateKey: todayKey,
    $and: [
      activeTaskFilter,
      { $or: [{ "notifications.endSentAt": { $exists: false } }, { "notifications.endSentAt": null }] }
    ],
    status: "active",
    startTime: { $exists: true, $ne: null },
    durationMinutes: { $exists: true, $ne: null }
  }).select("userId title startTime durationMinutes timerElapsedSeconds");
  const endTasks = candidateEndTasks.filter((task) => {
    const start = task.startTime instanceof Date ? task.startTime.getTime() : new Date(task.startTime).getTime();
    const durationMs = Number(task.durationMinutes) * 60 * 1000;
    const elapsedMs = Math.max(0, Number(task.timerElapsedSeconds ?? 0)) * 1000;
    return Number.isFinite(start) && Number.isFinite(durationMs) && start + durationMs - elapsedMs <= now.getTime();
  });
  diagnostics.endEligible = endTasks.length;

  usersById = await loadUsers(endTasks.map((task) => task.userId));
  for (const task of endTasks) {
    const user = usersById.get(String(task.userId));
    const enabled = notificationSettingEnabled(user, "taskEnd");
    if (user) diagnostics.endUsersWithTokens += 1;
    if (!enabled) diagnostics.endDisabled += 1;

    if (user && enabled) {
      const result = await trySendUserNotificationForSetting(user, "taskEnd", {
        title: "Task timer ended",
        body: `"${task.title}" timer has ended.`,
        link: "/dashboard/game"
      });
      if (result.successCount > 0) counts.end += 1;
      if (result.failureCount > 0 || result.successCount === 0) diagnostics.endSendFailures += 1;
    }
    if (!enabled || user) await Task.updateOne({ _id: task._id }, { $set: { "notifications.endSentAt": now } });
  }

  const dueSoonTasks = await Task.find({
    taskDateKey: todayKey,
    $and: [
      activeTaskFilter,
      { $or: [{ "notifications.dueSoonSentAt": { $exists: false } }, { "notifications.dueSoonSentAt": null }] }
    ],
    status: { $in: ["pending", "active"] },
    dueTime: { $gt: now, $lte: dueSoonUntil }
  }).select("userId title dueTime");
  diagnostics.dueSoonEligible = dueSoonTasks.length;

  usersById = await loadUsers(dueSoonTasks.map((task) => task.userId));
  for (const task of dueSoonTasks) {
    const user = usersById.get(String(task.userId));
    const enabled = notificationSettingEnabled(user, "dueSoon");
    if (user) diagnostics.dueSoonUsersWithTokens += 1;
    if (!enabled) diagnostics.dueSoonDisabled += 1;

    if (user && enabled) {
      const result = await trySendUserNotificationForSetting(user, "dueSoon", {
        title: "Task due soon",
        body: `"${task.title}" is due in ${DUE_SOON_MINUTES} minutes.`,
        link: "/dashboard/game"
      });
      if (result.successCount > 0) counts.dueSoon += 1;
      if (result.failureCount > 0 || result.successCount === 0) diagnostics.dueSoonSendFailures += 1;
    }
    if (!enabled || user) await Task.updateOne({ _id: task._id }, { $set: { "notifications.dueSoonSentAt": now } });
  }

  const overdueTasks = await Task.find({
    taskDateKey: todayKey,
    $and: [
      activeTaskFilter,
      { $or: [{ "notifications.overdueSentAt": { $exists: false } }, { "notifications.overdueSentAt": null }] }
    ],
    status: { $in: ["pending", "active"] },
    dueTime: { $lte: now }
  }).select("userId title");
  diagnostics.overdueEligible = overdueTasks.length;

  usersById = await loadUsers(overdueTasks.map((task) => task.userId));
  for (const task of overdueTasks) {
    const user = usersById.get(String(task.userId));
    const enabled = notificationSettingEnabled(user, "overdue");
    if (user) diagnostics.overdueUsersWithTokens += 1;
    if (!enabled) diagnostics.overdueDisabled += 1;

    if (user && enabled) {
      const result = await trySendUserNotificationForSetting(user, "overdue", {
        title: "Task overdue",
        body: `"${task.title}" was not completed on time.`,
        link: "/dashboard/game"
      });
      if (result.successCount > 0) counts.overdue += 1;
      if (result.failureCount > 0 || result.successCount === 0) diagnostics.overdueSendFailures += 1;
    }
    if (!enabled || user) {
      await Task.updateOne(
        { _id: task._id },
        {
          $set: {
            status: "overdue",
            "notifications.overdueSentAt": now
          }
        }
      );
    }
  }

  if (getHourInTimeZone(now, IST_TIME_ZONE) >= DAILY_SUMMARY_HOUR_IST) {
    const summaryUsers = await User.find({
      notificationsEnabled: true,
      "notificationTokens.0": { $exists: true },
      "notificationSettings.dailySummary": true,
      lastDailySummaryNotifiedKey: { $ne: todayKey }
    }).select("name notificationTokens notificationSettings lastDailySummaryNotifiedKey");

    for (const user of summaryUsers) {
      const pendingCount = await Task.countDocuments({
        userId: user._id,
        taskDateKey: todayKey,
        ...activeTaskFilter,
        status: { $ne: "completed" }
      });

      if (pendingCount > 0) {
        await trySendUserNotificationForSetting(user, "dailySummary", {
          title: "Daily arena summary",
          body: `You still have ${pendingCount} pending ${pendingCount === 1 ? "task" : "tasks"} today.`,
          link: "/dashboard/tasks"
        });
        counts.dailySummary += 1;
      }

      await User.updateOne({ _id: user._id }, { $set: { lastDailySummaryNotifiedKey: todayKey } });
    }
  }

  return NextResponse.json({ ok: true, counts, diagnostics });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
