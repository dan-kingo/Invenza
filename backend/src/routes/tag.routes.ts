import { Router } from "express";
import { TagController } from "../controllers/tag.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", auth(), TagController.registerTag);
router.get("/", auth(), TagController.listTags);
router.get("/:tagId", auth(), TagController.getTag);
router.get("/:tagId/qr", auth(), TagController.getTagQRCode);
export default router;
