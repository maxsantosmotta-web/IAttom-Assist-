import { Router, type IRouter } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth.js";
import {
  AiFindProductsBody,
  AiValidateProductBody,
  AiCreateCampaignBody,
  AiCreateContentBody,
  AiCreativeIdeasBody,
  AiVideoScriptBody,
} from "@workspace/api-zod";
import { streamFindProducts } from "../lib/ai/findProducts.js";
import { streamValidateProduct } from "../lib/ai/validateProduct.js";
import { streamCreateCampaign } from "../lib/ai/createCampaign.js";
import { streamCreateContent } from "../lib/ai/createContent.js";
import { streamCreativeIdeas } from "../lib/ai/creativeIdeas.js";
import { streamVideoScript } from "../lib/ai/videoScript.js";

const router: IRouter = Router();

router.post("/ai/find-products", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiFindProductsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamFindProducts(parsed.data, res, clerkUserId);
});

router.post("/ai/validate-product", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiValidateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamValidateProduct(parsed.data, res, clerkUserId);
});

router.post("/ai/create-campaign", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiCreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamCreateCampaign(parsed.data, res, clerkUserId);
});

router.post("/ai/create-content", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiCreateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamCreateContent(parsed.data, res, clerkUserId);
});

router.post("/ai/creative-ideas", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiCreativeIdeasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamCreativeIdeas(parsed.data, res, clerkUserId);
});

router.post("/ai/video-script", requireAuth, async (req, res): Promise<void> => {
  const { clerkUserId } = req as AuthenticatedRequest;
  const parsed = AiVideoScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await streamVideoScript(parsed.data, res, clerkUserId);
});

export default router;
