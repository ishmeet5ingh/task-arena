import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    totalRewardPoints: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    currentStreak: { type: Number, default: 0, min: 0 },
    bestStreak: { type: Number, default: 0, min: 0 },
    notificationsEnabled: { type: Boolean, default: false },
    notificationSettings: {
      taskStart: { type: Boolean, default: true },
      dueSoon: { type: Boolean, default: true },
      overdue: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: false },
      streak: { type: Boolean, default: false },
      reward: { type: Boolean, default: false }
    },
    notificationTokens: {
      type: [
        {
          token: { type: String, required: true },
          userAgent: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
          lastSeenAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    lastDailySummaryNotifiedKey: { type: String, default: "" },
    lastCompletedAt: { type: Date }
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
