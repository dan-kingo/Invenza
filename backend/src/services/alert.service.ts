import mongoose from "mongoose";
import { Alert, IAlert } from "../models/Alert.js";
import { Item } from "../models/Item.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { NotificationService } from "./notification.service.js";

export class AlertService {
  static async checkItemThreshold(
    itemId: mongoose.Types.ObjectId,
    businessId: mongoose.Types.ObjectId,
    currentQuantity: number
  ): Promise<void> {
    const item = await Item.findById(itemId);

    if (!item) return;

  const threshold = item.minThreshold ?? 0;
  const isLowStock = currentQuantity <= threshold;
  const isOutOfStock = currentQuantity === 0;

    const existingAlert = await Alert.findOne({
      itemId,
      businessId,
      isResolved: false
    });

    if (isOutOfStock) {
      if (existingAlert && existingAlert.type !== "out_of_stock") {
        existingAlert.type = "out_of_stock";
        existingAlert.severity = "critical";
        existingAlert.message = `${item.name} is out of stock`;
        existingAlert.currentQuantity = currentQuantity;
        await existingAlert.save();
      } else if (!existingAlert) {
        const alert = await this.createAlert(
          businessId,
          itemId,
          "out_of_stock",
          "critical",
          `${item.name} is out of stock`,
          currentQuantity,
          threshold
        );

        await this.sendAlertNotifications(alert);
      }
    } else if (isLowStock) {
      if (!existingAlert) {
        const alert = await this.createAlert(
          businessId,
          itemId,
          "low_stock",
          "warning",
          `${item.name} is running low (${currentQuantity} ${item.unit} remaining)`,
          currentQuantity,
          threshold
        );

        await this.sendAlertNotifications(alert);
      }
    } else {
      if (existingAlert) {
        existingAlert.isResolved = true;
        existingAlert.resolvedAt = new Date();
        await existingAlert.save();
      }
    }
  }

  static async createAlert(
    businessId: mongoose.Types.ObjectId,
    itemId: mongoose.Types.ObjectId,
    type: "low_stock" | "out_of_stock" | "expiry_warning" | "critical",
    severity: "info" | "warning" | "critical",
    message: string,
    currentQuantity: number,
    threshold: number
  ): Promise<IAlert> {
    const alert = await Alert.create({
      businessId,
      itemId,
      type,
      severity,
      message,
      currentQuantity,
      threshold,
      isResolved: false
    });

    return alert;
  }

  static async sendAlertNotifications(alert: IAlert): Promise<void> {
    const users = await User.find({
      businessId: alert.businessId,
      role: { $in: ["owner", "admin"] }
    });

    const item = await Item.findById(alert.itemId);

    if (!item) return;

    for (const user of users) {
      const channels: ("push" | "email" | "in_app")[] = ["in_app", "push"];

      if (alert.severity === "critical") {
        channels.push("email");
      }

      const notification = await Notification.create({
        userId: user._id,
        businessId: alert.businessId,
        alertId: alert._id,
        type: alert.type,
        title: alert.severity === "critical" ? "Critical Alert" : "Inventory Alert",
        message: alert.message,
        data: {
          itemId: item._id,
          itemName: item.name,
          currentQuantity: alert.currentQuantity,
          threshold: alert.threshold,
          unit: item.unit
        },
        channels,
        sentVia: ["in_app"]
      });

      if (channels.includes("push")) {
        await NotificationService.sendPushNotification(user._id, notification);
      }

      if (channels.includes("email")) {
        await NotificationService.sendEmailNotification(user, notification);
      }
    }
  }

  static async checkAllThresholds(): Promise<void> {
    const items = await Item.find({});

    for (const item of items) {
      try {
        await this.checkItemThreshold(
          item._id,
          item.businessId,
          item.quantity
        );
      } catch (err) {
        console.error(`Failed to check threshold for item ${item._id}:`, err);
      }
    }
  }

  static async checkExpiringItems(): Promise<void> {
    const warningDays = 7;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    const expiringItems = await Item.find({
      expiryDate: {
        $lte: warningDate,
        $gte: new Date()
      }
    });

    for (const item of expiringItems) {
      const existingAlert = await Alert.findOne({
        itemId: item._id,
        type: "expiry_warning",
        isResolved: false
      });

      if (!existingAlert) {
        const daysUntilExpiry = Math.ceil(
          (item.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const alert = await this.createAlert(
          item.businessId,
          item._id,
          "expiry_warning",
          daysUntilExpiry <= 2 ? "critical" : "warning",
          `${item.name} expires in ${daysUntilExpiry} day(s)`,
          item.quantity,
          0
        );

        await this.sendAlertNotifications(alert);
      }
    }
  }

  static async getBusinessAlerts(
    businessId: mongoose.Types.ObjectId,
    includeResolved: boolean = false
  ): Promise<IAlert[]> {
    const filter: any = { businessId };

    if (!includeResolved) {
      filter.isResolved = false;
    }

    const alerts = await Alert.find(filter)
      .populate("itemId", "name sku quantity unit")
      .sort({ createdAt: -1 });

    return alerts;
  }

  static async resolveAlert(alertId: mongoose.Types.ObjectId): Promise<IAlert | null> {
    const alert = await Alert.findById(alertId);

    if (!alert) return null;

    alert.isResolved = true;
    alert.resolvedAt = new Date();
    await alert.save();

    return alert;
  }
}
