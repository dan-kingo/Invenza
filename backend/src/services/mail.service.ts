import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "Invenza <onboarding@resend.dev>", // You can change this later after domain verification
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
      `,
    });

    if (error) {
      console.error("Resend verification email error:", error);
      throw error;
    }

    console.log("Verification email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || "https://invenza-ten.vercel.app";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "Invenza <onboarding@resend.dev>",
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
      `,
    });

    if (error) {
      console.error("Resend password reset email error:", error);
      throw error;
    }

    console.log("Password reset email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

// Optional: Email for successful verification
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Invenza <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Invenza!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Invenza!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your email has been successfully verified and your account is now active!
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You can now access all features of Invenza and start managing your inventory efficiently.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Get Started
              </a>
            </div>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend welcome email error:", error);
      return null;
    }

    console.log("Welcome email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return null;
  }
}