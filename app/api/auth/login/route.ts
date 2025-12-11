import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "15m" }
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

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
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
