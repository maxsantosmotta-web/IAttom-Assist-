import { db, historyTable } from "@workspace/db";

interface LogUsageOptions {
  clerkUserId: string;
  action: string;
  module: string;
  projectName?: string;
}

export async function logAiUsage(opts: LogUsageOptions): Promise<void> {
  try {
    await db.insert(historyTable).values({
      clerkUserId: opts.clerkUserId,
      action: opts.action,
      module: opts.module,
      projectName: opts.projectName ?? null,
    });
  } catch {
    // Non-critical — don't fail the request if logging fails
  }
}
