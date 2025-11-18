import { Request, Response } from "express";
import { Item } from "../models/Item";
import { Tag } from "../models/Tag";
import { InventoryEvent } from "../models/InventoryEvent";
import { User } from "../models/User";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { AlertService } from "../services/alert.service";

export class ItemController {
  static async createItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        name,
        sku,
        description,
        quantity,
        unit,
        category,
        location,
        tags,
        minThreshold,
        expiryDate
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Item name is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const businessId = user.businessId;

      let imageUrl;
      if (req.file) {
        imageUrl = await uploadToCloudinary(
          req.file.buffer,
          `items/${businessId}`
        );
      }

      const item = await Item.create({
        businessId,
        name,
        sku,
        description,
        quantity: quantity || 0,
        unit: unit || "pcs",
        category,
        location,
        tags: tags || [],
        minThreshold: minThreshold || 0,
        image: imageUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });

      if (tags && tags.length > 0) {
        await Tag.updateMany(
          { tagId: { $in: tags }, businessId },
          { $set: { attachedItemId: item._id } }
        );
      }

      if (quantity && quantity > 0) {
        await InventoryEvent.create({
          itemId: item._id,
          businessId,
          userId,
          delta: quantity,
          action: "added",
          reason: "Initial stock"
        });
      }

      await AlertService.checkItemThreshold(item._id, businessId, item.quantity);

      return res.status(201).json({
        message: "Item created successfully",
        item
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to create item" });
    }
  }

  static async listItems(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { category, tag, lowStock } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const filter: any = { businessId: user.businessId };

      if (category) {
        filter.category = category;
      }

      if (tag) {
        filter.tags = tag;
      }

      if (lowStock === "true") {
        filter.$expr = { $lte: ["$quantity", "$minThreshold"] };
      }

      const items = await Item.find(filter).sort({ createdAt: -1 });

      return res.json(items);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list items" });
    }
  }

  static async getItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const item = await Item.findOne({ _id: id, businessId: user.businessId });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(item);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch item" });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const item = await Item.findOne({ _id: id, businessId: user.businessId });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const {
        name,
        sku,
        description,
        unit,
        category,
        location,
        tags,
        minThreshold,
        expiryDate
      } = req.body;

      if (name !== undefined) item.name = name;
      if (sku !== undefined) item.sku = sku;
      if (description !== undefined) item.description = description;
      if (unit !== undefined) item.unit = unit;
      if (category !== undefined) item.category = category;
      if (location !== undefined) item.location = location;
      if (minThreshold !== undefined) item.minThreshold = minThreshold;
      if (expiryDate !== undefined) {
        item.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
      }

      if (req.file) {
        const imageUrl = await uploadToCloudinary(
          req.file.buffer,
          `items/${user.businessId}`
        );
        item.image = imageUrl;
      }

      if (tags !== undefined) {
        const oldTags = item.tags;
        item.tags = tags;

        await Tag.updateMany(
          { tagId: { $in: oldTags }, businessId: user.businessId },
          { $unset: { attachedItemId: "" } }
        );

        await Tag.updateMany(
          { tagId: { $in: tags }, businessId: user.businessId },
          { $set: { attachedItemId: item._id } }
        );
      }

      await item.save();

      return res.json({
        message: "Item updated successfully",
        item
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update item" });
    }
  }

  static async adjustQuantity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { delta, action, reason } = req.body;

      if (delta === undefined || !action) {
        return res.status(400).json({ error: "Delta and action are required" });
      }

      if (!["added", "sold", "used", "adjusted"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const item = await Item.findOne({ _id: id, businessId: user.businessId });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const newQuantity = item.quantity + delta;

      if (newQuantity < 0) {
        return res.status(400).json({ error: "Insufficient quantity" });
      }

      item.quantity = newQuantity;
      await item.save();

      await InventoryEvent.create({
        itemId: item._id,
        businessId: user.businessId,
        userId,
        delta,
        action,
        reason
      });

      await AlertService.checkItemThreshold(item._id, user.businessId, newQuantity);

      return res.json({
        message: "Quantity adjusted successfully",
        item
      });
    } catch (err: any) {
      if (err.name === "VersionError") {
        return res.status(409).json({ error: "Concurrent update detected. Please retry." });
      }
      console.error(err);
      return res.status(500).json({ error: "Failed to adjust quantity" });
    }
  }

  static async scanItem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { tagId } = req.body;

      if (!tagId) {
        return res.status(400).json({ error: "Tag ID is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const tag = await Tag.findOne({ tagId, businessId: user.businessId })
        .populate("attachedItemId");

      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      if (!tag.attachedItemId) {
        return res.json({
          message: "Tag found but not attached to any item",
          tag
        });
      }

      const item = await Item.findById(tag.attachedItemId);

      return res.json({
        message: "Item scanned successfully",
        tag,
        item
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to scan item" });
    }
  }

  static async getItemEvents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const item = await Item.findOne({ _id: id, businessId: user.businessId });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const events = await InventoryEvent.find({ itemId: id })
        .populate("userId", "name email")
        .sort({ timestamp: -1 });

      return res.json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch item events" });
    }
  }
}
