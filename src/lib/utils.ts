import type { TaskPriority } from "@/types";
import { mergeNotificationSettings, type NotificationSettings } from "@/lib/notificationSettings";

export const priorityReward: Record<TaskPriority, number> = {
  low: 20,
  medium: 35,
  high: 55,
  urgent: 80
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function calculateLevel(points: number) {
  return Math.max(1, Math.floor(points / 250) + 1);
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function isDeadlineBonusEligible(dueTime?: Date | string | null) {
  if (!dueTime) return false;
  return new Date(dueTime).getTime() > Date.now();
}

export function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string;
  totalRewardPoints: number;
  level: number;
  currentStreak?: number;
  bestStreak?: number;
  notificationsEnabled?: boolean;
  notificationSettings?: Partial<NotificationSettings>;
}) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    totalRewardPoints: user.totalRewardPoints,
    level: user.level,
    currentStreak: user.currentStreak ?? 0,
    bestStreak: user.bestStreak ?? 0,
    notificationsEnabled: user.notificationsEnabled ?? false,
    notificationSettings: mergeNotificationSettings(user.notificationSettings)
  };
}
