import prisma from "./prisma";
import { sendEmail } from "./email";
import { VerificationType } from "@/app/generated/prisma/enums";

// Re-export the enum for convenience
export { VerificationType };

// Map string to enum
const TYPE_MAP: Record<string, VerificationType> = {
  email_verify: VerificationType.EMAIL_VERIFY,
  password_reset: VerificationType.PASSWORD_RESET,
};

/**
 * Convert string type to VerificationType enum
 */
export function parseVerificationType(type: string): VerificationType | null {
  return TYPE_MAP[type] || null;
}

// Code expiration times (in minutes)
const CODE_EXPIRATION: Record<VerificationType, number> = {
  [VerificationType.EMAIL_VERIFY]: 15,
  [VerificationType.PASSWORD_RESET]: 15,
};

// Rate limiting (max codes per hour)
const MAX_CODES_PER_HOUR = 5;

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if rate limit exceeded
 */
async function isRateLimited(email: string, type: VerificationType): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const count = await prisma.verificationCode.count({
    where: {
      email,
      type,
      createdAt: { gte: oneHourAgo },
    },
  });

  return count >= MAX_CODES_PER_HOUR;
}

/**
 * Create and send a verification code
 */
export async function createVerificationCode(
  email: string,
  type: VerificationType
): Promise<{ success: boolean; error?: string }> {
  // Check rate limit
  if (await isRateLimited(email, type)) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  // Invalidate any existing codes for this email and type
  await prisma.verificationCode.updateMany({
    where: {
      email,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Generate new code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION[type] * 60 * 1000);

  // Save to database
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  });

  // Send email
  try {
    await sendVerificationEmail(email, code, type);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

/**
 * Verify a code
 */
export async function verifyCode(
  email: string,
  code: string,
  type: VerificationType
): Promise<{ success: boolean; error?: string }> {
  // Find the most recent valid code
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verificationCode) {
    return { success: false, error: "Code expired or not found" };
  }

  // Check max attempts
  if (verificationCode.attempts >= verificationCode.maxAttempts) {
    return { success: false, error: "Too many attempts. Please request a new code." };
  }

  // Verify code
  if (verificationCode.code !== code) {
    // Increment attempts
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Invalid verification code" };
  }

  // Mark as used
  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}

/**
 * Send verification email based on type
 */
async function sendVerificationEmail(
  email: string,
  code: string,
  type: VerificationType
): Promise<void> {
  const subject = type === VerificationType.EMAIL_VERIFY 
    ? "Xác thực tài khoản - Mã xác nhận"
    : "Đặt lại mật khẩu - Mã xác nhận";

  const title = type === VerificationType.EMAIL_VERIFY
    ? "Xác thực tài khoản"
    : "Đặt lại mật khẩu";

  const description = type === VerificationType.EMAIL_VERIFY
    ? "Vui lòng sử dụng mã bên dưới để xác thực tài khoản của bạn."
    : "Vui lòng sử dụng mã bên dưới để đặt lại mật khẩu.";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 20px; text-align: center;">${title}</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
          ${description}
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px 0;">Mã xác nhận của bạn</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">
          Mã này sẽ hết hạn sau <strong>${CODE_EXPIRATION[type]} phút</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: `Mã xác nhận của bạn là: ${code}. Mã này sẽ hết hạn sau ${CODE_EXPIRATION[type]} phút.`,
  });
}

/**
 * Clean up expired verification codes (can be called periodically)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.verificationCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
    },
  });

  return result.count;
}

