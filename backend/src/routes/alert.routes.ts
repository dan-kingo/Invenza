import { Router } from "express";
import { AlertController } from "../controllers/alert.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", auth(), AlertController.getAlerts);
router.put("/:id/resolve", auth(), AlertController.resolveAlert);
router.post("/check", auth(), AlertController.triggerThresholdCheck);

export default router;
