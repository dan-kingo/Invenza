import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { auth } from "../middlewares/auth.middleware";
import { upload } from "../services/cloudinary.service";

const router = Router();

router.post("/", auth(), upload.single("image"), ItemController.createItem);
router.get("/", auth(), ItemController.listItems);
router.get("/:id", auth(), ItemController.getItem);
router.put("/:id", auth(), upload.single("image"), ItemController.updateItem);
router.post("/:id/adjust", auth(), ItemController.adjustQuantity);
router.post("/:id/scan", auth(), ItemController.scanItem);
router.get("/:id/events", auth(), ItemController.getItemEvents);

export default router;
