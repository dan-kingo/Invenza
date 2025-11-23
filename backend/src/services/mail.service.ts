import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter with better configuration for Render
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Enhanced configuration for cloud deployment
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 30000,
  socketTimeout: 30000,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Verify connection configuration
mailer.verify(function(error, success) {
  if (error) {
    console.log("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to take our messages");
  }
});

export async function sendVerificationEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: {
      name: "Invenza",
      address: process.env.SMTP_USER || "noreply@invenza.com"
    },
    to: email,
    subject: "Verify your Invenza account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Invenza!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up! Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #667eea; word-break: break-all; font-size: 14px; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
            ${verifyUrl}
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 25px;">
            If you didn't create an account with Invenza, please ignore this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: {
      name: "Invenza",
      address: process.env.SMTP_USER || "noreply@invenza.com"
    },
    to: email,
    subject: "Reset Your Invenza Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            You requested to reset your password for your Invenza account. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #f5576c; word-break: break-all; font-size: 14px; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
            ${resetUrl}
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Note:</strong> This link will expire in 15 minutes for security reasons.
            </p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 25px;">
            If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    throw error;
  }
}

// Export for notification service
export async function sendEmailNotification(email: string, subject: string, html: string) {
  const mailOptions = {
    from: {
      name: "Invenza",
      address: process.env.SMTP_USER || "noreply@invenza.com"
    },
    to: email,
    subject: subject,
    html: html
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`✅ Notification email sent to: ${email}`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send notification email:", error);
    throw error;
  }
}