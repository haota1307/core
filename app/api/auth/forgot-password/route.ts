import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createVerificationCode, VerificationType } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { code: "MISSING_EMAIL", message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Create and send verification code
    const result = await createVerificationCode(email, VerificationType.PASSWORD_RESET);

    if (!result.success) {
      return NextResponse.json(
        { code: "SEND_FAILED", message: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

