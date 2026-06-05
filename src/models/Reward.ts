import { model, models, Schema, Types } from "mongoose";

const RewardSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: Types.ObjectId, ref: "Task" },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    claimed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

RewardSchema.index({ userId: 1, createdAt: -1 });

export default models.Reward || model("Reward", RewardSchema);
