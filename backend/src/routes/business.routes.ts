import { Router } from "express";
import { BusinessController } from "../controllers/business.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../services/cloudinary.service.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/:id", BusinessController.getBusiness);
router.put("/:id", auth(), requireRole("owner"), BusinessController.updateBusiness);
router.post(
  "/:id/doc",
  auth(),
  requireRole("owner"),
  upload.single("document"),
  BusinessController.uploadDocument
);
router.get("/:id/settings", auth(), BusinessController.getSettings);

export default router;
