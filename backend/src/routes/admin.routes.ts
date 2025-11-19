import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { auth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/businesses", auth(), requireRole("admin"), AdminController.getBusinesses);
router.post("/businesses/:id/approve", auth(), requireRole("admin"), AdminController.approveBusiness);
router.post("/businesses/:id/reject", auth(), requireRole("admin"), AdminController.rejectBusiness);
router.post("/businesses/:id/suspend", auth(), requireRole("admin"), AdminController.suspendBusiness);

router.get("/users", auth(), requireRole("admin"), AdminController.getUsers);
router.post("/users/:id/suspend", auth(), requireRole("admin"), AdminController.suspendUser);
router.post("/users/:id/unsuspend", auth(), requireRole("admin"), AdminController.unsuspendUser);

router.get("/metrics", auth(), requireRole("admin"), AdminController.getMetrics);

export default router;
