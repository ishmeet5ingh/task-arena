import DailyHistory from "@/models/DailyHistory";
import Task from "@/models/Task";

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

export const activeTaskFilter = {
  $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }]
};

export function getTodayKey(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export async function ensureDailyRollover(userId: string) {
  const todayKey = getTodayKey();

  await Task.updateMany(
    { userId, taskDateKey: { $exists: false } },
    { $set: { taskDateKey: todayKey, taskDate: dateFromKey(todayKey) } }
  );

  const oldDateKeys = await Task.distinct("taskDateKey", {
    userId,
    ...activeTaskFilter,
    taskDateKey: { $exists: true, $ne: todayKey }
  });

  const historyKeys = oldDateKeys.filter((dateKey): dateKey is string => typeof dateKey === "string" && dateKey < todayKey);

  for (const dateKey of historyKeys) {
    const tasks = await Task.find({
      userId,
      taskDateKey: dateKey,
      ...activeTaskFilter
    }).sort({ boxPosition: 1 });

    if (!tasks.length) continue;

    const snapshotTasks = tasks.map((task) => ({
      taskId: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      historyStatus: task.status === "completed" ? "completed" : "pending",
      priority: task.priority,
      rewardPoints: task.rewardPoints,
      boxPosition: task.boxPosition,
      dueTime: task.dueTime,
      completedAt: task.completedAt
    }));

    const summary = {
      total: snapshotTasks.length,
      completed: snapshotTasks.filter((task) => task.historyStatus === "completed").length,
      pending: snapshotTasks.filter((task) => task.historyStatus === "pending").length,
      overdue: snapshotTasks.filter((task) => task.status === "overdue").length,
      rewardPoints: snapshotTasks
        .filter((task) => task.historyStatus === "completed")
        .reduce((total, task) => total + task.rewardPoints, 0)
    };

    await DailyHistory.updateOne(
      { userId, dateKey },
      { $set: { userId, dateKey, tasks: snapshotTasks, summary } },
      { upsert: true }
    );

    await Task.updateMany(
      { userId, taskDateKey: dateKey, ...activeTaskFilter },
      { $set: { archivedAt: new Date() } }
    );
  }

  return todayKey;
}
