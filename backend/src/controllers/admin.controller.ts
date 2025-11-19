import { Request, Response } from "express";
import { Business } from "../models/Business";
import { User } from "../models/User";
import { Item } from "../models/Item";
import { Tag } from "../models/Tag";
import { Alert } from "../models/Alert";

export class AdminController {
  static async getBusinesses(req: Request, res: Response) {
    try {
      const { status } = req.query;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      const businesses = await Business.find(filter)
        .sort({ createdAt: -1 })
        .populate("approvedBy", "name email");

      return res.json({
        businesses,
        count: businesses.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch businesses" });
    }
  }

  static async approveBusiness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      const business = await Business.findById(id);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      if (business.status === "approved") {
        return res.status(400).json({ error: "Business already approved" });
      }

      business.status = "approved";
      business.approvedBy = adminId as any;
      business.approvedAt = new Date();
      await business.save();

      return res.json({
        message: "Business approved successfully",
        business
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to approve business" });
    }
  }

  static async rejectBusiness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const business = await Business.findById(id);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      business.status = "rejected";
      business.rejectionReason = reason || "Does not meet requirements";
      await business.save();

      return res.json({
        message: "Business rejected",
        business
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to reject business" });
    }
  }

  static async suspendBusiness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const business = await Business.findById(id);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      business.status = "suspended";
      business.rejectionReason = reason || "Suspended by admin";
      await business.save();

      return res.json({
        message: "Business suspended",
        business
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to suspend business" });
    }
  }

  static async suspendUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({ error: "Cannot suspend admin users" });
      }

      if (user.isSuspended) {
        return res.status(400).json({ error: "User already suspended" });
      }

      user.isSuspended = true;
      user.suspensionReason = reason || "Suspended by admin";
      user.suspendedBy = adminId as any;
      user.suspendedAt = new Date();
      await user.save();

      return res.json({
        message: "User suspended successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isSuspended: user.isSuspended,
          suspensionReason: user.suspensionReason,
          suspendedAt: user.suspendedAt
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to suspend user" });
    }
  }

  static async unsuspendUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isSuspended) {
        return res.status(400).json({ error: "User is not suspended" });
      }

      user.isSuspended = false;
      user.suspensionReason = undefined;
      user.suspendedBy = undefined;
      user.suspendedAt = undefined;
      await user.save();

      return res.json({
        message: "User unsuspended successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isSuspended: user.isSuspended
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to unsuspend user" });
    }
  }

  static async getMetrics(req: Request, res: Response) {
    try {
      const totalBusinesses = await Business.countDocuments();
      const activeBusinesses = await Business.countDocuments({ status: "approved" });
      const pendingBusinesses = await Business.countDocuments({ status: "pending" });
      const suspendedBusinesses = await Business.countDocuments({ status: "suspended" });

      const totalUsers = await User.countDocuments();
      const suspendedUsers = await User.countDocuments({ isSuspended: true });
      const activeUsers = totalUsers - suspendedUsers;

      const totalItems = await Item.countDocuments();
      const taggedItems = await Item.countDocuments({ tags: { $ne: [] } });

      const totalTags = await Tag.countDocuments();

      const totalAlerts = await Alert.countDocuments();
      const unresolvedAlerts = await Alert.countDocuments({ isResolved: false });
      const criticalAlerts = await Alert.countDocuments({
        isResolved: false,
        severity: "critical"
      });

      const lowStockItems = await Item.countDocuments({
        $expr: { $lte: ["$quantity", "$minThreshold"] }
      });

      return res.json({
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses,
          pending: pendingBusinesses,
          suspended: suspendedBusinesses
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers
        },
        inventory: {
          totalItems,
          taggedItems,
          totalTags,
          lowStockItems
        },
        alerts: {
          total: totalAlerts,
          unresolved: unresolvedAlerts,
          critical: criticalAlerts
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch metrics" });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const { suspended, role } = req.query;

      const filter: any = {};

      if (suspended !== undefined) {
        filter.isSuspended = suspended === "true";
      }

      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select("-passwordHash -refreshTokens -verificationToken")
        .populate("businessId", "name status")
        .populate("suspendedBy", "name email")
        .sort({ createdAt: -1 });

      return res.json({
        users,
        count: users.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
}
