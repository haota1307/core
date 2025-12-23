import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import { getSecuritySettings } from "@/lib/settings";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

/**
 * Check if account is locked due to too many failed attempts
 */
async function isAccountLocked(
  email: string,
  maxAttempts: number,
  lockoutDuration: number
): Promise<{ locked: boolean; remainingMinutes?: number }> {
  const lockoutTime = new Date();
  lockoutTime.setMinutes(lockoutTime.getMinutes() - lockoutDuration);

  // Count failed attempts in the lockout window
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: lockoutTime },
    },
  });

  if (failedAttempts >= maxAttempts) {
    // Get the most recent failed attempt to calculate remaining time
    const lastAttempt = await prisma.loginAttempt.findFirst({
      where: {
        email,
        success: false,
        createdAt: { gte: lockoutTime },
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastAttempt) {
      const unlockTime = new Date(lastAttempt.createdAt);
      unlockTime.setMinutes(unlockTime.getMinutes() + lockoutDuration);
      const remainingMinutes = Math.ceil(
        (unlockTime.getTime() - Date.now()) / 60000
      );
      return { locked: true, remainingMinutes: Math.max(1, remainingMinutes) };
    }
    return { locked: true, remainingMinutes: lockoutDuration };
  }

  return { locked: false };
}

/**
 * Record login attempt
 */
async function recordLoginAttempt(
  email: string,
  success: boolean,
  request: NextRequest
) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      success,
    },
  });

  // Clean up old attempts (older than 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: { lt: oneDayAgo },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          code: "MISSING_CREDENTIALS",
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Get security settings
    const securitySettings = await getSecuritySettings();

    // Check if account is locked
    const lockStatus = await isAccountLocked(
      email,
      securitySettings.maxLoginAttempts,
      securitySettings.lockoutDuration
    );

    if (lockStatus.locked) {
      await createAuditLog(
        {
          userId: null,
          action: AuditAction.LOGIN,
          entityType: "auth",
          entityName: email,
          status: "error",
          errorMsg: `Account locked for ${lockStatus.remainingMinutes} minutes`,
          metadata: { email, locked: true },
        },
        request
      );

      return NextResponse.json(
        {
          code: "ACCOUNT_LOCKED",
          message: `Account is temporarily locked. Please try again in ${lockStatus.remainingMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    // Find user with role info
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      // Record failed attempt
      await recordLoginAttempt(email, false, request);

      // Log failed login attempt
      await createAuditLog(
        {
          userId: null,
          action: AuditAction.LOGIN,
          entityType: "auth",
          entityName: email,
          status: "error",
          errorMsg: "Invalid email",
          metadata: { email },
        },
        request
      );

      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Record failed attempt
      await recordLoginAttempt(email, false, request);

      // Log failed login attempt
      await createAuditLog(
        {
          userId: user.id,
          action: AuditAction.LOGIN,
          entityType: "auth",
          entityId: user.id,
          entityName: user.email,
          status: "error",
          errorMsg: "Invalid password",
        },
        request
      );

      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Record successful login
    await recordLoginAttempt(email, true, request);

    // Generate tokens with session timeout from settings
    const sessionTimeoutMinutes = securitySettings.sessionTimeout || 60;
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Log successful login
    await createAuditLog(
      {
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: "auth",
        entityId: user.id,
        entityName: user.email,
        status: "success",
      },
      request
    );

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roleId: user.roleId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
