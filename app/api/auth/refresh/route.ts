import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { code: "MISSING_TOKEN", message: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return NextResponse.json(
        { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken, deletedAt: null },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    if (storedToken.user.deletedAt) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND", message: "User not found" },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: storedToken.user.id, email: storedToken.user.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: storedToken.user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Delete old refresh token and create new one (use deleteMany to avoid error if not found)
    await prisma.refreshToken.deleteMany({
      where: { id: storedToken.id },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        image: storedToken.user.image,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
