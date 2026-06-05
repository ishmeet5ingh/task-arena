import { model, models, Schema, Types } from "mongoose";

const TaskSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 90 },
    description: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "overdue"],
      default: "pending",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true
    },
    rewardPoints: { type: Number, required: true, min: 0 },
    boxPosition: { type: Number, required: true, min: 0, max: 11 },
    startTime: { type: Date },
    durationMinutes: { type: Number, min: 5, max: 720 },
    dueTime: { type: Date, index: true },
    completedAt: { type: Date },
    notifications: {
      startSentAt: { type: Date },
      endSentAt: { type: Date },
      dueSoonSentAt: { type: Date },
      overdueSentAt: { type: Date }
    },
    taskDate: { type: Date, index: true },
    taskDateKey: { type: String, index: true },
    archivedAt: { type: Date, index: true }
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, taskDateKey: 1, boxPosition: 1 });
TaskSchema.index({ userId: 1, status: 1, dueTime: 1 });
TaskSchema.index({ userId: 1, archivedAt: 1, taskDateKey: 1 });

export default models.Task || model("Task", TaskSchema);
