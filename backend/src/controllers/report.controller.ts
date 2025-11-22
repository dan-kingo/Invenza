import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";
import { ReportService } from "../services/report.service.js";
import { ExportService } from "../services/export.service.js";

export class ReportController {
  static async getStockSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { from, to, format } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      if (from && isNaN(fromDate!.getTime())) {
        return res.status(400).json({ error: "Invalid 'from' date format" });
      }

      if (to && isNaN(toDate!.getTime())) {
        return res.status(400).json({ error: "Invalid 'to' date format" });
      }

      const summary = await ReportService.getStockSummary(
        user.businessId,
        fromDate,
        toDate
      );

      if (format === "csv") {
        return await ExportService.exportStockSummaryCSV(summary, res);
      }

      if (format === "pdf") {
        const business = await Business.findById(user.businessId);
        const businessName = business?.name || "Business";
        return await ExportService.exportStockSummaryPDF(summary, res, businessName);
      }

      return res.json({
        summary,
        count: summary.length,
        from: fromDate?.toISOString(),
        to: toDate?.toISOString()
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate stock summary" });
    }
  }

  static async getLowStock(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { format } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const lowStockItems = await ReportService.getLowStockItems(user.businessId);

      if (format === "csv") {
        return await ExportService.exportLowStockCSV(lowStockItems, res);
      }

      if (format === "pdf") {
        const business = await Business.findById(user.businessId);
        const businessName = business?.name || "Business";
        return await ExportService.exportLowStockPDF(lowStockItems, res, businessName);
      }

      return res.json({
        lowStockItems,
        count: lowStockItems.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate low stock report" });
    }
  }

  static async getUsageTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period, format } = req.query;

      if (!period || !["weekly", "monthly"].includes(period as string)) {
        return res.status(400).json({
          error: "Invalid period. Must be 'weekly' or 'monthly'"
        });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const trends = await ReportService.getUsageTrends(
        user.businessId,
        period as "weekly" | "monthly"
      );

      if (format === "csv") {
        return await ExportService.exportUsageTrendsCSV(trends, res, period as string);
      }

      if (format === "pdf") {
        const business = await Business.findById(user.businessId);
        const businessName = business?.name || "Business";
        return await ExportService.exportUsageTrendsPDF(
          trends,
          res,
          businessName,
          period as string
        );
      }

      return res.json({
        trends,
        count: trends.length,
        period
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate usage trends" });
    }
  }

  static async getTopSelling(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit, from, to, format } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const itemLimit = limit ? parseInt(limit as string, 10) : 10;

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      if (from && isNaN(fromDate!.getTime())) {
        return res.status(400).json({ error: "Invalid 'from' date format" });
      }

      if (to && isNaN(toDate!.getTime())) {
        return res.status(400).json({ error: "Invalid 'to' date format" });
      }

      const topSelling = await ReportService.getTopSellingItems(
        user.businessId,
        itemLimit,
        fromDate,
        toDate
      );

      if (format === "csv") {
        return await ExportService.exportTopSellingCSV(topSelling, res);
      }

      return res.json({
        topSelling,
        count: topSelling.length,
        limit: itemLimit,
        from: fromDate?.toISOString(),
        to: toDate?.toISOString()
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate top selling report" });
    }
  }

  static async getCategoryBreakdown(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const breakdown = await ReportService.getCategoryBreakdown(user.businessId);

      return res.json({
        breakdown,
        count: breakdown.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate category breakdown" });
    }
  }
}
