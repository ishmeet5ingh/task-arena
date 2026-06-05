export type TaskStatus = "pending" | "active" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type NotificationSettings = {
  taskStart: boolean;
  taskEnd: boolean;
  dueSoon: boolean;
  overdue: boolean;
  dailySummary: boolean;
  streak: boolean;
  reward: boolean;
};

export type ArenaTask = {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  rewardPoints: number;
  boxPosition: number;
  startTime?: string;
  durationMinutes?: number;
  dueTime?: string;
  completedAt?: string;
  taskDateKey?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  totalRewardPoints: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  notificationsEnabled?: boolean;
  notificationSettings?: NotificationSettings;
};

export type ActivityAction =
  | "task_created"
  | "task_edited"
  | "task_moved"
  | "task_deleted"
  | "task_completed"
  | "timer_started"
  | "reward_claimed";

export type DailyHistoryTask = {
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  historyStatus: "completed" | "pending";
  priority: TaskPriority;
  rewardPoints: number;
  boxPosition: number;
  dueTime?: string;
  completedAt?: string;
};

export type DailyHistory = {
  _id: string;
  userId: string;
  dateKey: string;
  tasks: DailyHistoryTask[];
  summary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    rewardPoints: number;
  };
  createdAt: string;
  updatedAt: string;
};
