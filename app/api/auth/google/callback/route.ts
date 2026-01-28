import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import { getSecuritySettings } from "@/lib/settings";
import { sendNewUserNotification } from "@/lib/email";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // Parse state to get locale
    let locale = "vi";
    try {
      if (stateParam) {
        const state = JSON.parse(stateParam);
        locale = state.locale || "vi";
      }
    } catch {
      // Ignore parse errors
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginUrl = `${baseUrl}/${locale}/auth/login`;
    const dashboardUrl = `${baseUrl}/${locale}/dashboard`;

    // Handle error from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${loginUrl}?error=google_auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${loginUrl}?error=missing_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth not configured");
      return NextResponse.redirect(`${loginUrl}?error=oauth_not_configured`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(`${loginUrl}?error=token_exchange_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to get user info");
      return NextResponse.redirect(`${loginUrl}?error=user_info_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        email: googleUser.email,
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user with random password
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Get default "User" role
      const defaultRole = await prisma.role.findUnique({
        where: { name: "User" },
      });

      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          password: hashedPassword,
          image: googleUser.picture,
          emailVerified: new Date(), // Google already verified the email
          roleId: defaultRole?.id,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Send notification to admins (non-blocking)
      sendNewUserNotification({ 
        name: user.name, 
        email: user.email,
      }).catch(() => {
        // Silently ignore notification errors
      });
    } else {
      // Update user's image if changed
      if (googleUser.picture && googleUser.picture !== user.image) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: googleUser.picture },
        });
      }

      // Mark email as verified if not already
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    }

    // Get security settings for session timeout
    const securitySettings = await getSecuritySettings();
    const sessionTimeoutMinutes = securitySettings.sessionTimeout || 60;

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

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
        action: isNewUser ? AuditAction.REGISTER : AuditAction.LOGIN,
        entityType: "auth",
        entityId: user.id,
        entityName: user.email,
        metadata: {
          provider: "google",
          email: user.email,
          name: user.name,
          isNewUser,
        },
        status: "success",
      },
      request
    );

    // Redirect to auth callback page with tokens
    // This allows client-side to properly store tokens in cookies
    const callbackPageUrl = new URL(`${baseUrl}/${locale}/auth/callback`);
    callbackPageUrl.searchParams.set("accessToken", accessToken);
    callbackPageUrl.searchParams.set("refreshToken", refreshToken);

    return NextResponse.redirect(callbackPageUrl.toString());
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/vi/auth/login?error=callback_failed`);
  }
}

