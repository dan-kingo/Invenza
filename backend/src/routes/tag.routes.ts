import { Router } from "express";
import { TagController } from "../controllers/tag.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", auth(), TagController.registerTag);
router.get("/", auth(), TagController.listTags);
router.get("/:tagId", auth(), TagController.getTag);

export default router;
