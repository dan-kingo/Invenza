import { Router } from "express";
import { ItemController } from "../controllers/item.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../services/cloudinary.service.js";

const router = Router();

router.post("/", auth(), upload.single("image"), ItemController.createItem);
router.get("/", auth(), ItemController.listItems);
router.get("/:id", auth(), ItemController.getItem);
router.put("/:id", auth(), upload.single("image"), ItemController.updateItem);
router.post("/:id/adjust", auth(), ItemController.adjustQuantity);
router.post("/scan", auth(), ItemController.scanItem);
router.get("/:id/events", auth(), ItemController.getItemEvents);

export default router;
