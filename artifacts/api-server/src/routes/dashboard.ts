import { Router, type IRouter } from "express";
import { and, eq, desc, count } from "drizzle-orm";
import { db, projectsTable, historyTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;

  const [totalResult] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(eq(projectsTable.clerkUserId, clerkUserId));

  const [activeResult] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(and(eq(projectsTable.clerkUserId, clerkUserId), eq(projectsTable.status, "in_progress")));

  const [completedResult] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(and(eq(projectsTable.clerkUserId, clerkUserId), eq(projectsTable.status, "completed")));

  const [totalActionsResult] = await db
    .select({ count: count() })
    .from(historyTable)
    .where(eq(historyTable.clerkUserId, clerkUserId));

  const recentProjects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.clerkUserId, clerkUserId))
    .orderBy(desc(projectsTable.updatedAt))
    .limit(5);

  const summary = {
    totalProjects: totalResult.count,
    activeProjects: activeResult.count,
    completedProjects: completedResult.count,
    totalActions: totalActionsResult.count,
    recentProjects,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
