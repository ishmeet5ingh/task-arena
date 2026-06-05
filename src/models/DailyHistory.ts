import { model, models, Schema, Types } from "mongoose";

const DailyHistoryTaskSchema = new Schema(
  {
    taskId: { type: Types.ObjectId, ref: "Task" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "overdue"],
      required: true
    },
    historyStatus: {
      type: String,
      enum: ["completed", "pending"],
      required: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      required: true
    },
    rewardPoints: { type: Number, default: 0 },
    boxPosition: { type: Number, required: true },
    dueTime: { type: Date },
    completedAt: { type: Date }
  },
  { _id: false }
);

const DailyHistorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true },
    tasks: { type: [DailyHistoryTaskSchema], default: [] },
    summary: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      overdue: { type: Number, default: 0 },
      rewardPoints: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

DailyHistorySchema.index({ userId: 1, dateKey: 1 }, { unique: true });
DailyHistorySchema.index({ userId: 1, dateKey: -1 });

export default models.DailyHistory || model("DailyHistory", DailyHistorySchema);
