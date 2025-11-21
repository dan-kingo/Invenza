import { Request, Response } from "express";
import { Tag } from "../models/Tag";
import { User } from "../models/User";
import crypto from "crypto";
  import QRCode from "qrcode";

export class TagController {
  static async registerTag(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { tagId, type, meta } = req.body;

      if (!type || !["item", "box"].includes(type)) {
        return res.status(400).json({ error: "Valid type (item|box) is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const businessId = user.businessId;

      const generatedTagId = tagId || crypto.randomBytes(16).toString("hex");

     const existingTag = await Tag.findOne({ tagId: generatedTagId, businessId });


      if (existingTag) {
        return res.status(400).json({ error: "Tag ID already exists" });
      }

      const tag = await Tag.create({
        tagId: generatedTagId,
        type,
        businessId,
        meta: meta || {}
      });

      return res.status(201).json({
        message: "Tag registered successfully",
        tag
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to register tag" });
    }
  }

  static async getTag(req: Request, res: Response) {
    try {
      const { tagId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const tag = await Tag.findOne({ tagId, businessId: user.businessId })
        .populate("attachedItemId");

      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      return res.json(tag);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch tag" });
    }
  }

  static async listTags(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const filter: any = { businessId: user.businessId };
      if (type) {
        filter.type = type;
      }

      const tags = await Tag.find(filter)
        .populate("attachedItemId")
        .sort({ createdAt: -1 });

      return res.json(tags);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list tags" });
    }
  }


static async getTagQRCode(req: Request, res: Response) {
  try {
    const { tagId } = req.params;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user || !user.businessId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const tag = await Tag.findOne({ tagId, businessId: user.businessId });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const qrData = await QRCode.toDataURL(tagId);

    return res.json({ tagId, qr: qrData });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate QR" });
  }
}

}
