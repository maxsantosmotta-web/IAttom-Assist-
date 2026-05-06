import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, projectsTable, historyTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalResult] = await db
    .select({ count: count() })
    .from(projectsTable);

  const [activeResult] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "in_progress"));

  const [completedResult] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "completed"));

  const [totalActionsResult] = await db
    .select({ count: count() })
    .from(historyTable);

  const recentProjects = await db
    .select()
    .from(projectsTable)
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
