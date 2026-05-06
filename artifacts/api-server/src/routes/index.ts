import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";
import authRouter from "./authRoutes";
import adminRouter from "./admin";
import creditsRouter from "./credits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(historyRouter);
router.use(dashboardRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(creditsRouter);

export default router;
