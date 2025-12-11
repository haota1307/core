import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { code: "MISSING_TOKEN", message: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify access token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { code: "INVALID_TOKEN", message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId },
    });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

