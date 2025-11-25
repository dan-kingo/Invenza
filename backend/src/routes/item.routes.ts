import { Router } from "express";
import { ItemController } from "../controllers/item.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../services/cloudinary.service.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", auth(), requireRole("owner"), upload.single("image"), ItemController.createItem);
router.get("/", auth(), ItemController.listItems);
router.get("/:id", auth(), ItemController.getItem);
router.put("/:id", auth(), requireRole("owner"), upload.single("image"), ItemController.updateItem);
router.post("/:id/adjust", auth(), ItemController.adjustQuantity);
router.post("/scan", auth(), ItemController.scanItem);
router.get("/:id/events", auth(), ItemController.getItemEvents);

export default router;
