import { Router } from "express";
import { DeviceController } from "../controllers/device.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", auth(), DeviceController.registerDevice);

export default router;
