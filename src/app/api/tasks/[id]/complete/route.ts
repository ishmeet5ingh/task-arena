import { NextRequest, NextResponse } from "next/server";
import { logActivity, requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { activeTaskFilter, ensureDailyRollover } from "@/lib/daily";
import { trySendUserNotificationForSetting } from "@/lib/firebase/notifications";
import { calculateLevel, isDeadlineBonusEligible } from "@/lib/utils";
import Badge from "@/models/Badge";
import Reward from "@/models/Reward";
import Task from "@/models/Task";
import User from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

const badgeDefinitions = [
  { key: "first_task", name: "First Task Completed", description: "Completed your first arena task." },
  { key: "streak_5", name: "5 Tasks Streak", description: "Completed five tasks in rhythm." },
  { key: "focus_warrior", name: "Focus Warrior", description: "Started and finished an active focus task." },
  { key: "deadline_master", name: "Deadline Master", description: "Beat a task deadline." },
  { key: "productivity_champion", name: "Productivity Champion", description: "Crossed 1,000 reward points." }
];

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const todayKey = await ensureDailyRollover(String(user._id));
  const { id } = await ctx.params;
  const task = await Task.findOne({ _id: id, userId: user._id, taskDateKey: todayKey, ...activeTaskFilter });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status === "completed") return NextResponse.json({ task: serializeDoc(task), earned: 0 });

  const deadlineBonus = isDeadlineBonusEligible(task.dueTime) ? Math.ceil(task.rewardPoints * 0.25) : 0;
  const earned = task.rewardPoints + deadlineBonus;
  task.status = "completed";
  task.completedAt = new Date();
  await task.save();

  const now = new Date();
  const last = user.lastCompletedAt ? new Date(user.lastCompletedAt) : null;
  const sameOrNextDay =
    last && now.getTime() - last.getTime() < 1000 * 60 * 60 * 36;
  const currentStreak = sameOrNextDay ? (user.currentStreak ?? 0) + 1 : 1;
  const totalRewardPoints = (user.totalRewardPoints ?? 0) + earned;

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      totalRewardPoints,
      level: calculateLevel(totalRewardPoints),
      currentStreak,
      bestStreak: Math.max(user.bestStreak ?? 0, currentStreak),
      lastCompletedAt: now
    },
    { new: true }
  );

  await Reward.create({ userId: user._id, taskId: task._id, points: earned, reason: "Task completed" });
  await logActivity({ userId: String(user._id), action: "task_completed", taskId: String(task._id), metadata: { earned } });

  await trySendUserNotificationForSetting(updatedUser, "reward", {
    title: "Reward earned",
    body: `+${earned} points for completing "${task.title}".`,
    link: "/dashboard/rewards"
  });

  const remainingToday = await Task.countDocuments({
    userId: user._id,
    taskDateKey: todayKey,
    ...activeTaskFilter,
    status: { $ne: "completed" }
  });

  if (remainingToday === 0) {
    await trySendUserNotificationForSetting(updatedUser, "streak", {
      title: "Streak protected",
      body: `All today's tasks are complete. Your streak is safe.`,
      link: "/dashboard/game"
    });
  }

  const completedCount = await Task.countDocuments({ userId: user._id, status: "completed" });
  const badgeKeys = new Set<string>();
  if (completedCount >= 1) badgeKeys.add("first_task");
  if (currentStreak >= 5) badgeKeys.add("streak_5");
  if (task.startTime) badgeKeys.add("focus_warrior");
  if (deadlineBonus > 0) badgeKeys.add("deadline_master");
  if (totalRewardPoints >= 1000) badgeKeys.add("productivity_champion");

  await Promise.all(
    badgeDefinitions
      .filter((badge) => badgeKeys.has(badge.key))
      .map((badge) =>
        Badge.updateOne({ userId: user._id, key: badge.key }, { $setOnInsert: { ...badge, userId: user._id } }, { upsert: true })
      )
  );

  return NextResponse.json({ task: serializeDoc(task), earned, user: serializeDoc(updatedUser) });
}
