import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth";
import ActivityLog from "@/models/ActivityLog";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return { user: null, response: jsonError("Unauthorized", 401) };
  return { user, response: null };
}

export async function logActivity(input: {
  userId: string;
  action: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ActivityLog.create({
    userId: input.userId,
    action: input.action,
    taskId: input.taskId,
    metadata: input.metadata ?? {}
  });
}

export function cleanDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export function serializeDoc<T>(doc: T) {
  return JSON.parse(JSON.stringify(doc));
}
