import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stock-summary", auth(), ReportController.getStockSummary);
router.get("/low-stock", auth(), ReportController.getLowStock);
router.get("/usage-trends", auth(), ReportController.getUsageTrends);
router.get("/top-selling", auth(), ReportController.getTopSelling);
router.get("/category-breakdown", auth(), ReportController.getCategoryBreakdown);

export default router;
