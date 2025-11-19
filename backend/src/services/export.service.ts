import { Response } from "express";
import { format as stringify } from "fast-csv";
import PDFDocument from "pdfkit";
import {
  StockSummaryItem,
  LowStockItem,
  UsageTrendItem,
  TopSellingItem
} from "./report.service";

export class ExportService {
  static async exportStockSummaryCSV(
    data: StockSummaryItem[],
    res: Response
  ): Promise<void> {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="stock-summary-${Date.now()}.csv"`
    );

    const csvStream = stringify({
      headers: true,
      columns: [
        { key: "itemId", header: "Item ID" },
        { key: "name", header: "Item Name" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "currentQuantity", header: "Current Quantity" },
        { key: "unit", header: "Unit" },
        { key: "minThreshold", header: "Min Threshold" },
        { key: "totalAdded", header: "Total Added" },
        { key: "totalRemoved", header: "Total Removed" },
        { key: "netChange", header: "Net Change" }
      ]
    });

    csvStream.pipe(res);

    data.forEach((item) => {
      csvStream.write(item);
    });

    csvStream.end();
  }

  static async exportLowStockCSV(
    data: LowStockItem[],
    res: Response
  ): Promise<void> {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="low-stock-${Date.now()}.csv"`
    );

    const csvStream = stringify({
      headers: true,
      columns: [
        { key: "itemId", header: "Item ID" },
        { key: "name", header: "Item Name" },
        { key: "sku", header: "SKU" },
        { key: "category", header: "Category" },
        { key: "currentQuantity", header: "Current Quantity" },
        { key: "minThreshold", header: "Min Threshold" },
        { key: "unit", header: "Unit" },
        { key: "percentageRemaining", header: "Percentage Remaining (%)" }
      ]
    });

    csvStream.pipe(res);

    data.forEach((item) => {
      csvStream.write(item);
    });

    csvStream.end();
  }

  static async exportUsageTrendsCSV(
    data: UsageTrendItem[],
    res: Response,
    period: string
  ): Promise<void> {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="usage-trends-${period}-${Date.now()}.csv"`
    );

    const csvStream = stringify({
      headers: true,
      columns: [
        { key: "itemId", header: "Item ID" },
        { key: "itemName", header: "Item Name" },
        { key: "period", header: "Period" },
        { key: "totalAdded", header: "Total Added" },
        { key: "totalSold", header: "Total Sold" },
        { key: "totalUsed", header: "Total Used" },
        { key: "totalAdjusted", header: "Total Adjusted" },
        { key: "netChange", header: "Net Change" }
      ]
    });

    csvStream.pipe(res);

    data.forEach((item) => {
      csvStream.write(item);
    });

    csvStream.end();
  }

  static async exportTopSellingCSV(
    data: TopSellingItem[],
    res: Response
  ): Promise<void> {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="top-selling-${Date.now()}.csv"`
    );

    const csvStream = stringify({
      headers: true,
      columns: [
        { key: "itemId", header: "Item ID" },
        { key: "itemName", header: "Item Name" },
        { key: "totalSold", header: "Total Sold" },
        { key: "unit", header: "Unit" }
      ]
    });

    csvStream.pipe(res);

    data.forEach((item) => {
      csvStream.write(item);
    });

    csvStream.end();
  }

  static async exportStockSummaryPDF(
    data: StockSummaryItem[],
    res: Response,
    businessName: string
  ): Promise<void> {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="stock-summary-${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).text("Stock Summary Report", { align: "center" });
    doc.fontSize(12).text(businessName, { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, {
      align: "center"
    });
    doc.moveDown(2);

    const tableTop = doc.y;
    const colWidths = {
      name: 120,
      sku: 70,
      quantity: 60,
      unit: 40,
      added: 60,
      removed: 60,
      net: 50
    };

    doc.fontSize(9).font("Helvetica-Bold");
    let x = 50;
    doc.text("Item", x, tableTop, { width: colWidths.name, continued: false });
    x += colWidths.name;
    doc.text("SKU", x, tableTop, { width: colWidths.sku, continued: false });
    x += colWidths.sku;
    doc.text("Qty", x, tableTop, { width: colWidths.quantity, continued: false });
    x += colWidths.quantity;
    doc.text("Unit", x, tableTop, { width: colWidths.unit, continued: false });
    x += colWidths.unit;
    doc.text("Added", x, tableTop, { width: colWidths.added, continued: false });
    x += colWidths.added;
    doc.text("Removed", x, tableTop, { width: colWidths.removed, continued: false });
    x += colWidths.removed;
    doc.text("Net", x, tableTop, { width: colWidths.net, continued: false });

    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica");

    for (const item of data) {
      if (doc.y > 700) {
        doc.addPage();
        doc.moveDown(2);
      }

      const y = doc.y;
      let x = 50;

      doc.fontSize(8);
      doc.text(item.name.substring(0, 30), x, y, {
        width: colWidths.name,
        continued: false
      });
      x += colWidths.name;
      doc.text(item.sku || "-", x, y, {
        width: colWidths.sku,
        continued: false
      });
      x += colWidths.sku;
      doc.text(item.currentQuantity.toString(), x, y, {
        width: colWidths.quantity,
        continued: false
      });
      x += colWidths.quantity;
      doc.text(item.unit, x, y, { width: colWidths.unit, continued: false });
      x += colWidths.unit;
      doc.text(item.totalAdded.toString(), x, y, {
        width: colWidths.added,
        continued: false
      });
      x += colWidths.added;
      doc.text(item.totalRemoved.toString(), x, y, {
        width: colWidths.removed,
        continued: false
      });
      x += colWidths.removed;
      doc.text(item.netChange.toString(), x, y, {
        width: colWidths.net,
        continued: false
      });

      doc.moveDown(0.8);
    }

    doc.end();
  }

  static async exportLowStockPDF(
    data: LowStockItem[],
    res: Response,
    businessName: string
  ): Promise<void> {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="low-stock-${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).text("Low Stock Alert Report", { align: "center" });
    doc.fontSize(12).text(businessName, { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, {
      align: "center"
    });
    doc.moveDown(2);

    const tableTop = doc.y;
    const colWidths = {
      name: 150,
      sku: 80,
      quantity: 70,
      threshold: 70,
      unit: 50,
      percent: 60
    };

    doc.fontSize(9).font("Helvetica-Bold");
    let x = 50;
    doc.text("Item", x, tableTop, { width: colWidths.name, continued: false });
    x += colWidths.name;
    doc.text("SKU", x, tableTop, { width: colWidths.sku, continued: false });
    x += colWidths.sku;
    doc.text("Current", x, tableTop, { width: colWidths.quantity, continued: false });
    x += colWidths.quantity;
    doc.text("Threshold", x, tableTop, { width: colWidths.threshold, continued: false });
    x += colWidths.threshold;
    doc.text("Unit", x, tableTop, { width: colWidths.unit, continued: false });
    x += colWidths.unit;
    doc.text("% Left", x, tableTop, { width: colWidths.percent, continued: false });

    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica");

    for (const item of data) {
      if (doc.y > 700) {
        doc.addPage();
        doc.moveDown(2);
      }

      const y = doc.y;
      let x = 50;

      doc.fontSize(8);
      doc.text(item.name.substring(0, 35), x, y, {
        width: colWidths.name,
        continued: false
      });
      x += colWidths.name;
      doc.text(item.sku || "-", x, y, {
        width: colWidths.sku,
        continued: false
      });
      x += colWidths.sku;
      doc.text(item.currentQuantity.toString(), x, y, {
        width: colWidths.quantity,
        continued: false
      });
      x += colWidths.quantity;
      doc.text(item.minThreshold.toString(), x, y, {
        width: colWidths.threshold,
        continued: false
      });
      x += colWidths.threshold;
      doc.text(item.unit, x, y, { width: colWidths.unit, continued: false });
      x += colWidths.unit;
      doc.text(`${item.percentageRemaining}%`, x, y, {
        width: colWidths.percent,
        continued: false
      });

      doc.moveDown(0.8);
    }

    doc.end();
  }

  static async exportUsageTrendsPDF(
    data: UsageTrendItem[],
    res: Response,
    businessName: string,
    period: string
  ): Promise<void> {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="usage-trends-${period}-${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
    doc.pipe(res);

    doc.fontSize(20).text(`Usage Trends Report (${period})`, { align: "center" });
    doc.fontSize(12).text(businessName, { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, {
      align: "center"
    });
    doc.moveDown(2);

    const tableTop = doc.y;
    const colWidths = {
      item: 120,
      period: 80,
      added: 60,
      sold: 60,
      used: 60,
      adjusted: 60,
      net: 60
    };

    doc.fontSize(9).font("Helvetica-Bold");
    let x = 50;
    doc.text("Item", x, tableTop, { width: colWidths.item, continued: false });
    x += colWidths.item;
    doc.text("Period", x, tableTop, { width: colWidths.period, continued: false });
    x += colWidths.period;
    doc.text("Added", x, tableTop, { width: colWidths.added, continued: false });
    x += colWidths.added;
    doc.text("Sold", x, tableTop, { width: colWidths.sold, continued: false });
    x += colWidths.sold;
    doc.text("Used", x, tableTop, { width: colWidths.used, continued: false });
    x += colWidths.used;
    doc.text("Adjusted", x, tableTop, { width: colWidths.adjusted, continued: false });
    x += colWidths.adjusted;
    doc.text("Net", x, tableTop, { width: colWidths.net, continued: false });

    doc.moveTo(50, doc.y + 5).lineTo(750, doc.y + 5).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica");

    for (const item of data) {
      if (doc.y > 500) {
        doc.addPage();
        doc.moveDown(2);
      }

      const y = doc.y;
      let x = 50;

      doc.fontSize(8);
      doc.text(item.itemName.substring(0, 30), x, y, {
        width: colWidths.item,
        continued: false
      });
      x += colWidths.item;
      doc.text(item.period, x, y, {
        width: colWidths.period,
        continued: false
      });
      x += colWidths.period;
      doc.text(item.totalAdded.toString(), x, y, {
        width: colWidths.added,
        continued: false
      });
      x += colWidths.added;
      doc.text(item.totalSold.toString(), x, y, {
        width: colWidths.sold,
        continued: false
      });
      x += colWidths.sold;
      doc.text(item.totalUsed.toString(), x, y, {
        width: colWidths.used,
        continued: false
      });
      x += colWidths.used;
      doc.text(item.totalAdjusted.toString(), x, y, {
        width: colWidths.adjusted,
        continued: false
      });
      x += colWidths.adjusted;
      doc.text(item.netChange.toString(), x, y, {
        width: colWidths.net,
        continued: false
      });

      doc.moveDown(0.8);
    }

    doc.end();
  }
}
