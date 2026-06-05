import { NextRequest, NextResponse } from "next/server";
import { requireUser, serializeDoc } from "@/lib/api";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req);
  if (response) return response;

  await connectDB();
  const users = await User.find().select("-password").sort({ totalRewardPoints: -1 });
  const stats = await Task.aggregate([
    {
      $group: {
        _id: "$userId",
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
        total: { $sum: 1 }
      }
    }
  ]);
  return NextResponse.json({ users: serializeDoc(users), stats: serializeDoc(stats) });
}
