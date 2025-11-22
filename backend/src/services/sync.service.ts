import mongoose from "mongoose";
import { SyncOp, ISyncOp } from "../models/SyncOp.js";
import { Item } from "../models/Item.js";
import { Tag } from "../models/Tag.js";
import { Business } from "../models/Business.js";
import { InventoryEvent } from "../models/InventoryEvent.js";
import { AlertService } from "./alert.service.js";

interface ClientOperation {
  opId: string;
  type: "adjust" | "create" | "update" | "delete";
  entityType?: "item" | "tag" | "business";
  payload: Record<string, any>;
  clientTimestamp?: string | Date;
}

interface AppliedOperation {
  opId: string;
  status: "applied" | "conflict" | "failed";
  appliedAt: Date;
  serverData?: any;
  error?: string;
  conflictReason?: string;
}

export class SyncService {
  static async applyOperations(
    operations: ClientOperation[],
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation[]> {
    const results: AppliedOperation[] = [];

    for (const op of operations) {
      try {
        const existingOp = await SyncOp.findOne({ opId: op.opId });

        if (existingOp) {
          results.push({
            opId: op.opId,
            status: existingOp.status as "applied" | "conflict" | "failed",
            appliedAt: existingOp.appliedAt,
            serverData: existingOp.payload
          });
          continue;
        }

        const result = await this.applyOperation(op, businessId, userId);
        results.push(result);
      } catch (err: any) {
        console.error(`Failed to apply operation ${op.opId}:`, err);

        await SyncOp.create({
          opId: op.opId,
          businessId,
          userId,
          type: op.type,
          entityType: op.entityType || "item",
          payload: op.payload,
          clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
          appliedAt: new Date(),
          source: "client",
          status: "failed",
          conflictReason: err.message
        });

        results.push({
          opId: op.opId,
          status: "failed",
          appliedAt: new Date(),
          error: err.message
        });
      }
    }

    return results;
  }

  private static async applyOperation(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation> {
    const entityType = op.entityType || "item";

    switch (op.type) {
      case "adjust":
        return await this.applyAdjustment(op, businessId, userId);
      case "create":
        return await this.applyCreate(op, businessId, userId, entityType);
      case "update":
        return await this.applyUpdate(op, businessId, userId, entityType);
      case "delete":
        return await this.applyDelete(op, businessId, userId, entityType);
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private static async applyAdjustment(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation> {
    const { itemId, delta, action, reason } = op.payload;

    if (!itemId || delta === undefined) {
      throw new Error("itemId and delta are required for adjust operations");
    }

    const item = await Item.findOne({
      _id: itemId,
      businessId
    });

    if (!item) {
      throw new Error("Item not found");
    }

    const newQuantity = item.quantity + delta;

    if (newQuantity < 0) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType: "item",
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "conflict",
        conflictReason: "Insufficient quantity",
        itemId: item._id
      });

      return {
        opId: op.opId,
        status: "conflict",
        appliedAt: syncOp.appliedAt,
        conflictReason: "Insufficient quantity",
        serverData: { quantity: item.quantity }
      };
    }

    item.quantity = newQuantity;
    await item.save();

    await InventoryEvent.create({
      itemId: item._id,
      businessId,
      userId,
      delta,
      action: action || "adjusted",
      reason: reason || "Sync operation"
    });

    await AlertService.checkItemThreshold(item._id, businessId, newQuantity);

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType: "item",
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      itemId: item._id
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: {
        itemId: item._id,
        quantity: item.quantity,
        updatedAt: item.updatedAt
      }
    };
  }

  private static async applyCreate(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "item" | "tag" | "business"
  ): Promise<AppliedOperation> {
    let createdEntity: any;
    let entityId: mongoose.Types.ObjectId;

    switch (entityType) {
      case "item":
        const { quantity, ...restPayload } = op.payload as any;
        const itemData = {
          ...restPayload,
          businessId,
          quantity
        };
        createdEntity = await Item.create(itemData);
        entityId = createdEntity._id;

        const initialQuantity = typeof quantity === "number" ? quantity : (quantity ? Number(quantity) : 0);

        if (initialQuantity > 0) {
          await InventoryEvent.create({
            itemId: createdEntity._id,
            businessId,
            userId,
            delta: initialQuantity,
            action: "added",
            reason: "Initial stock (sync)"
          });
        }
        break;

      case "tag":
        const tagData = {
          ...op.payload,
          businessId
        };
        createdEntity = await Tag.create(tagData);
        entityId = createdEntity._id;
        break;

      default:
        throw new Error(`Create operation not supported for entity type: ${entityType}`);
    }

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      itemId: entityType === "item" ? entityId : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: createdEntity.toObject()
    };
  }

  private static async applyUpdate(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "item" | "tag" | "business"
  ): Promise<AppliedOperation> {
    const { _id, ...updateData } = op.payload;

    if (!_id) {
      throw new Error("_id is required for update operations");
    }

    let entity: any;
    let Model: any;

    switch (entityType) {
      case "item":
        Model = Item;
        break;
      case "tag":
        Model = Tag;
        break;
      case "business":
        Model = Business;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    entity = await Model.findOne({ _id, businessId });

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    const serverTimestamp = entity.updatedAt;
    const clientTimestamp = op.clientTimestamp ? new Date(op.clientTimestamp) : null;

    if (clientTimestamp && serverTimestamp > clientTimestamp) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType,
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "conflict",
        conflictReason: "Server has newer data (last-write-wins)",
        itemId: entityType === "item" ? entity._id : undefined
      });

      return {
        opId: op.opId,
        status: "conflict",
        appliedAt: syncOp.appliedAt,
        conflictReason: "Server has newer data",
        serverData: entity.toObject()
      };
    }

    Object.assign(entity, updateData);
    await entity.save();

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      itemId: entityType === "item" ? entity._id : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: entity.toObject()
    };
  }

  private static async applyDelete(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "item" | "tag" | "business"
  ): Promise<AppliedOperation> {
    const { _id } = op.payload;

    if (!_id) {
      throw new Error("_id is required for delete operations");
    }

    let Model: any;

    switch (entityType) {
      case "item":
        Model = Item;
        break;
      case "tag":
        Model = Tag;
        break;
      default:
        throw new Error(`Delete operation not supported for entity type: ${entityType}`);
    }

    const entity = await Model.findOne({ _id, businessId });

    if (!entity) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType,
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "applied"
      });

      return {
        opId: op.opId,
        status: "applied",
        appliedAt: syncOp.appliedAt
      };
    }

    await entity.deleteOne();

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      itemId: entityType === "item" ? entity._id : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt
    };
  }

  static async getOperationsSince(
    businessId: mongoose.Types.ObjectId,
    sinceTimestamp: Date
  ): Promise<ISyncOp[]> {
    const operations = await SyncOp.find({
      businessId,
      appliedAt: { $gt: sinceTimestamp },
      status: "applied"
    })
      .sort({ appliedAt: 1 })
      .lean();

    return operations as unknown as ISyncOp[];
  }

  static async deduplicateOperations(businessId: mongoose.Types.ObjectId): Promise<number> {
    const duplicates = await SyncOp.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$opId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let removedCount = 0;

    for (const dup of duplicates) {
      const [keep, ...remove] = dup.ids;
      await SyncOp.deleteMany({ _id: { $in: remove } });
      removedCount += remove.length;
    }

    return removedCount;
  }

  static async cleanupOldOperations(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SyncOp.deleteMany({
      appliedAt: { $lt: cutoffDate }
    });

    return result.deletedCount || 0;
  }

  static async getConflictLog(
    businessId: mongoose.Types.ObjectId,
    limit: number = 100
  ): Promise<ISyncOp[]> {
    const conflicts = await SyncOp.find({
      businessId,
      status: "conflict"
    })
      .sort({ appliedAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .populate("itemId", "name sku")
      .lean();

    return conflicts as unknown as ISyncOp[];
  }
}
