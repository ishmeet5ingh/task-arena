export const notificationSettingDefaults = {
  taskStart: true,
  taskEnd: true,
  dueSoon: true,
  overdue: true,
  dailySummary: false,
  streak: false,
  reward: false
};

export type NotificationSettingKey = keyof typeof notificationSettingDefaults;
export type NotificationSettings = Record<NotificationSettingKey, boolean>;

export const notificationSettingLabels: Array<{
  key: NotificationSettingKey;
  label: string;
  description: string;
}> = [
  {
    key: "taskStart",
    label: "Task start",
    description: "When a scheduled task starts."
  },
  {
    key: "taskEnd",
    label: "Task end",
    description: "When a task timer ends."
  },
  {
    key: "dueSoon",
    label: "Due soon",
    description: "10 minutes before a task is due."
  },
  {
    key: "overdue",
    label: "Overdue",
    description: "When a task passes its due time."
  },
  {
    key: "dailySummary",
    label: "Daily summary",
    description: "Evening pending task summary."
  },
  {
    key: "streak",
    label: "Streak",
    description: "When all tasks are completed."
  },
  {
    key: "reward",
    label: "Reward",
    description: "When points are earned."
  }
];

export function mergeNotificationSettings(settings?: Partial<NotificationSettings> | null): NotificationSettings {
  return {
    ...notificationSettingDefaults,
    ...(settings ?? {})
  };
}
