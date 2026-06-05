import { model, models, Schema, Types } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    taskId: { type: Types.ObjectId, ref: "Task" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export default models.ActivityLog || model("ActivityLog", ActivityLogSchema);
