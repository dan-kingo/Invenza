import mongoose from "mongoose";
import { Item } from "../models/Item";
import { InventoryEvent } from "../models/InventoryEvent";

export interface StockSummaryItem {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  totalAdded: number;
  totalRemoved: number;
  netChange: number;
}

export interface LowStockItem {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  percentageRemaining: number;
}

export interface UsageTrendItem {
  itemId: string;
  itemName: string;
  period: string;
  totalAdded: number;
  totalSold: number;
  totalUsed: number;
  totalAdjusted: number;
  netChange: number;
}

export interface TopSellingItem {
  itemId: string;
  itemName: string;
  totalSold: number;
  unit: string;
}

export class ReportService {
  static async getStockSummary(
    businessId: mongoose.Types.ObjectId,
    fromDate?: Date,
    toDate?: Date
  ): Promise<StockSummaryItem[]> {
    const items = await Item.find({ businessId }).lean();

    const summary: StockSummaryItem[] = [];

    for (const item of items) {
      const eventFilter: any = {
        itemId: item._id,
        businessId
      };

      if (fromDate || toDate) {
        eventFilter.timestamp = {};
        if (fromDate) eventFilter.timestamp.$gte = fromDate;
        if (toDate) eventFilter.timestamp.$lte = toDate;
      }

      const events = await InventoryEvent.find(eventFilter).lean();

      let totalAdded = 0;
      let totalRemoved = 0;

      for (const event of events) {
        if (event.delta > 0) {
          totalAdded += event.delta;
        } else {
          totalRemoved += Math.abs(event.delta);
        }
      }

      const netChange = totalAdded - totalRemoved;

      summary.push({
        itemId: item._id.toString(),
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentQuantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold || 0,
        totalAdded,
        totalRemoved,
        netChange
      });
    }

    return summary;
  }

  static async getLowStockItems(
    businessId: mongoose.Types.ObjectId
  ): Promise<LowStockItem[]> {
    const items = await Item.find({
      businessId,
      $expr: { $lte: ["$quantity", "$minThreshold"] }
    })
      .sort({ quantity: 1 })
      .lean();

    const lowStockItems: LowStockItem[] = items.map((item) => {
      const percentageRemaining =
        item.minThreshold > 0
          ? Math.round((item.quantity / item.minThreshold) * 100)
          : 0;

      return {
        itemId: item._id.toString(),
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentQuantity: item.quantity,
        minThreshold: item.minThreshold || 0,
        unit: item.unit,
        percentageRemaining
      };
    });

    return lowStockItems;
  }

  static async getUsageTrends(
    businessId: mongoose.Types.ObjectId,
    period: "weekly" | "monthly"
  ): Promise<UsageTrendItem[]> {
    const now = new Date();
    const startDate = new Date();

    if (period === "weekly") {
      startDate.setDate(now.getDate() - 7 * 12);
    } else {
      startDate.setMonth(now.getMonth() - 12);
    }

    const groupFormat = period === "weekly" ? "%Y-W%U" : "%Y-%m";

    const pipeline = [
      {
        $match: {
          businessId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "item"
        }
      },
      {
        $unwind: "$item"
      },
      {
        $group: {
          _id: {
            itemId: "$itemId",
            itemName: "$item.name",
            period: {
              $dateToString: {
                format: groupFormat,
                date: "$timestamp"
              }
            }
          },
          totalAdded: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$delta", 0] }, { $eq: ["$action", "added"] }] },
                "$delta",
                0
              ]
            }
          },
          totalSold: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ["$delta", 0] }, { $eq: ["$action", "sold"] }] },
                { $abs: "$delta" },
                0
              ]
            }
          },
          totalUsed: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ["$delta", 0] }, { $eq: ["$action", "used"] }] },
                { $abs: "$delta" },
                0
              ]
            }
          },
          totalAdjusted: {
            $sum: {
              $cond: [{ $eq: ["$action", "adjusted"] }, "$delta", 0]
            }
          },
          netChange: { $sum: "$delta" }
        }
      },
      {
        $project: {
          _id: 0,
          itemId: { $toString: "$_id.itemId" },
          itemName: "$_id.itemName",
          period: "$_id.period",
          totalAdded: 1,
          totalSold: 1,
          totalUsed: 1,
          totalAdjusted: 1,
          netChange: 1
        }
      },
      {
        $sort: { period: -1, itemName: 1 }
      }
    ];

    const results = await InventoryEvent.aggregate(pipeline);

    return results;
  }

  static async getTopSellingItems(
    businessId: mongoose.Types.ObjectId,
    limit: number = 10,
    fromDate?: Date,
    toDate?: Date
  ): Promise<TopSellingItem[]> {
    const matchStage: any = {
      businessId,
      action: "sold",
      delta: { $lt: 0 }
    };

    if (fromDate || toDate) {
      matchStage.timestamp = {};
      if (fromDate) matchStage.timestamp.$gte = fromDate;
      if (toDate) matchStage.timestamp.$lte = toDate;
    }

    const pipeline = [
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "item"
        }
      },
      {
        $unwind: "$item"
      },
      {
        $group: {
          _id: "$itemId",
          itemName: { $first: "$item.name" },
          unit: { $first: "$item.unit" },
          totalSold: { $sum: { $abs: "$delta" } }
        }
      },
      {
        $project: {
          _id: 0,
          itemId: { $toString: "$_id" },
          itemName: 1,
          unit: 1,
          totalSold: 1
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: limit
      }
    ];

    const results = await InventoryEvent.aggregate(pipeline);

    return results;
  }

  static async getCategoryBreakdown(
    businessId: mongoose.Types.ObjectId
  ): Promise<{ category: string; itemCount: number; totalQuantity: number }[]> {
    const pipeline = [
      {
        $match: { businessId }
      },
      {
        $group: {
          _id: { $ifNull: ["$category", "Uncategorized"] },
          itemCount: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          itemCount: 1,
          totalQuantity: 1
        }
      },
      {
        $sort: { totalQuantity: -1 }
      }
    ];

    const results = await Item.aggregate(pipeline);

    return results;
  }
}
