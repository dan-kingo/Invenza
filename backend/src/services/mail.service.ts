import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  await mailer.sendMail({
    to: email,
    subject: "Verify your Invenza account",
    html: `
      <h2>Verify Your Email</h2>
      <p>Please click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const link = `http://localhost:5000/api/auth/reset-password?token=${token}`;

  await mailer.sendMail({
    to: email,
    subject: "Reset Your Invenza Password",
    html: `
      <h2>Reset Your Password</h2>
      <p>You requested to reset your Invenza password.</p>
      <a href="${link}">Click here to reset</a>
      <p>This link expires in 15 minutes.</p>
    `
  });
}
