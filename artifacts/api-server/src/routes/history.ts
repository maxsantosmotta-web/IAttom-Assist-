import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, historyTable } from "@workspace/db";
import { ListHistoryQueryParams, ListHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history", async (req, res): Promise<void> => {
  const parsed = ListHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 20;

  const items = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.createdAt))
    .limit(limit);

  res.json(ListHistoryResponse.parse(items));
});

export default router;
