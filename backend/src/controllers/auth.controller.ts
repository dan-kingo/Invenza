import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import { Business } from "../models/Business";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken
} from "../services/jwt.service";
import { sendVerificationEmail } from "../services/mail.service";

export class AuthController {
  // REGISTER
  static async register(req: Request, res: Response) {
    try {
      const { name, email, phone, password, businessName, language } = req.body;

      if (!email && !phone)
        return res.status(400).json({ error: "Email or phone required" });

      const exists = await User.findOne({ $or: [{ email }, { phone }] });
      if (exists) return res.status(400).json({ error: "User already exists" });

      const business = await Business.create({
        name: businessName,
        language,
        contactPhone: phone
      });

      const passwordHash = password ? await hashPassword(password) : undefined;

      const verificationToken = crypto.randomBytes(30).toString("hex");

      const user = await User.create({
        name,
        email,
        phone,
        passwordHash,
        provider: "local",
        role: "owner",
        businessId: business._id,
        verificationToken
      });

      if (email) await sendVerificationEmail(email, verificationToken);

      return res.status(201).json({
        message: "User registered. Please verify your email.",
        userId: user._id
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Registration failed" });
    }
  }

  // LOGIN
  static async login(req: Request, res: Response) {
    try {
      const { email, phone, password } = req.body;

      const user = await User.findOne({
        $or: [{ email }, { phone }]
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.passwordHash)
        return res.status(400).json({ error: "Use social login instead" });

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      user.refreshTokens.push(refreshToken);
      await user.save();

      return res.json({ accessToken, refreshToken, user });
    } catch (err) {
      return res.status(500).json({ error: "Login failed" });
    }
  }

  // EMAIL VERIFY
  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: "Invalid token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  }

  // REFRESH TOKEN
  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(400).json({ error: "Missing refresh token" });

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccess = generateAccessToken(user._id.toString());
    const newRefresh = generateRefreshToken(user._id.toString());

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  }

  // LOGOUT
  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
    }

    return res.json({ message: "Logged out" });
  }
}
