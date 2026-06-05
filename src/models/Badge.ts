import { model, models, Schema, Types } from "mongoose";

const BadgeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

BadgeSchema.index({ userId: 1, key: 1 }, { unique: true });

export default models.Badge || model("Badge", BadgeSchema);
