import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { VerificationType } from "@/lib/verification";
import { getSecuritySettings, validatePasswordPolicy } from "@/lib/settings";
import { sendPasswordResetNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { code: "MISSING_FIELDS", message: "Email, code, and new password are required" },
        { status: 400 }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { code: "INVALID_CODE", message: "Code must be 6 digits" },
        { status: 400 }
      );
    }

    // Check if the code was recently verified (within 10 minutes)
    // This allows the verify-code step to happen before reset-password
    const verifiedCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: VerificationType.PASSWORD_RESET,
        usedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Used within 10 mins
      },
    });

    if (!verifiedCode) {
      // If not recently verified, check if there's an unused valid code
      const unusedCode = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          type: VerificationType.PASSWORD_RESET,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!unusedCode) {
        return NextResponse.json(
          { code: "VERIFICATION_FAILED", message: "Code expired or not found" },
          { status: 400 }
        );
      }

      // Mark as used
      await prisma.verificationCode.update({
        where: { id: unusedCode.id },
        data: { usedAt: new Date() },
      });
    }

    // Validate new password against security policy
    const securitySettings = await getSecuritySettings();
    const passwordValidation = validatePasswordPolicy(newPassword, securitySettings);

    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          code: "INVALID_PASSWORD",
          message: passwordValidation.errors[0],
          errors: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Send notification to admins (non-blocking)
    sendPasswordResetNotification({ name: user.name, email: user.email }).catch(() => {
      // Silently ignore notification errors
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

