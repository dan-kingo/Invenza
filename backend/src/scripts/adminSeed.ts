import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db";
import { User } from "../models/User";
import { hashPassword } from "../utils/hash";

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";
  const businessId = process.env.ADMIN_BUSINESS_ID;

  if (!mongoUri) {
    console.error("MONGO_URI is not set in the environment");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("Please set ADMIN_EMAIL and ADMIN_PASSWORD in the environment");
    process.exit(1);
  }

  try {
    await connectDB(mongoUri);

    const existing = await User.findOne({ email }).exec();

    const passwordHash = await hashPassword(password);

    if (existing) {
      // Update role to admin and ensure password is set
      existing.role = "admin" as any;
      existing.passwordHash = passwordHash;
      existing.isVerified = true;
      if (businessId) existing.businessId = businessId as any;
      await existing.save();
      console.log(`Updated existing user as admin: ${email}`);
    } else {
      const user = new User({
        name,
        email,
        passwordHash,
        provider: "local",
        role: "admin",
        isVerified: true,
        refreshTokens: []
      } as any);

      if (businessId) (user as any).businessId = businessId as any;

      await user.save();
      console.log(`Created new admin user: ${email}`);
    }

    // disconnect
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to seed admin user:", err?.message || err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

if (require.main === module) {
  seedAdmin();
}

export default seedAdmin;
