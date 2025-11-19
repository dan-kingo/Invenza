import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import mongoose from "mongoose";
import { DeviceToken } from "../models/DeviceToken";
import { Notification, INotification } from "../models/Notification";
import { IUser } from "../models/User";
import { mailer } from "./mail.service";

const expo = new Expo();

export class NotificationService {
  static async registerDeviceToken(
    userId: mongoose.Types.ObjectId | string,
    token: string,
    platform: "ios" | "android" | "web",
    deviceId?: string
  ): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error("Invalid Expo push token");
    }

    const existing = await DeviceToken.findOne({ token });

    if (existing) {
      existing.userId = userId as any;
      existing.platform = platform;
      existing.deviceId = deviceId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      await existing.save();
    } else {
      await DeviceToken.create({
        userId: userId as any,
        token,
        platform,
        deviceId,
        isActive: true,
        lastUsedAt: new Date()
      });
    }
  }

  static async sendPushNotification(
    userId: mongoose.Types.ObjectId | string,
    notification: INotification
  ): Promise<void> {
    const deviceTokens = await DeviceToken.find({
      userId,
      isActive: true
    });

    if (deviceTokens.length === 0) {
      return;
    }

    const messages: ExpoPushMessage[] = [];

    for (const deviceToken of deviceTokens) {
      if (!Expo.isExpoPushToken(deviceToken.token)) {
        console.warn(`Invalid token for device ${deviceToken._id}`);
        continue;
      }

      messages.push({
        to: deviceToken.token,
        sound: "default",
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...notification.data
        },
        priority: notification.type === "critical" ? "high" : "default"
      });
    }

    if (messages.length === 0) {
      return;
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const deviceToken = deviceTokens[i];

      if (ticket.status === "error") {
        console.error(`Push notification error for device ${deviceToken._id}:`, ticket.message);

        if (ticket.details?.error === "DeviceNotRegistered") {
          deviceToken.isActive = false;
          await deviceToken.save();
        }
      }
    }

    if (tickets.some(t => t.status === "ok")) {
      if (!notification.sentVia.includes("push")) {
        notification.sentVia.push("push");
        await notification.save();
      }
    }
  }

  static async sendEmailNotification(
    user: IUser,
    notification: INotification
  ): Promise<void> {
    if (!user.email) {
      return;
    }

    try {
      await mailer.sendMail({
        to: user.email,
        subject: notification.title,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.data ? `
            <hr>
            <h3>Details:</h3>
            <ul>
              ${notification.data.itemName ? `<li><strong>Item:</strong> ${notification.data.itemName}</li>` : ""}
              ${notification.data.currentQuantity !== undefined ? `<li><strong>Current Quantity:</strong> ${notification.data.currentQuantity} ${notification.data.unit || ""}</li>` : ""}
              ${notification.data.threshold !== undefined ? `<li><strong>Threshold:</strong> ${notification.data.threshold} ${notification.data.unit || ""}</li>` : ""}
            </ul>
          ` : ""}
          <p style="margin-top: 20px; color: #666;">
            This is an automated alert from your Invenza inventory management system.
          </p>
        `
      });

      if (!notification.sentVia.includes("email")) {
        notification.sentVia.push("email");
        await notification.save();
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  }

  static async getUserNotifications(
    userId: mongoose.Types.ObjectId | string,
    limit: number = 50,
    includeRead: boolean = false
  ): Promise<INotification[]> {
    const filter: any = { userId };

    if (!includeRead) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("alertId");

    return notifications;
  }

  static async markAsRead(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId | string
  ): Promise<INotification | null> {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) return null;

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  static async markAllAsRead(userId: mongoose.Types.ObjectId | string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.modifiedCount || 0;
  }

  static async deleteNotification(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId | string
  ): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId
    });

    return result.deletedCount === 1;
  }

  static async getUnreadCount(userId: mongoose.Types.ObjectId | string): Promise<number> {
    return await Notification.countDocuments({
      userId,
      isRead: false
    });
  }
}
