import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createVerificationCode, parseVerificationType, VerificationType } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type: typeString } = body as { email: string; type: string };

    if (!email || !typeString) {
      return NextResponse.json(
        { code: "MISSING_FIELDS", message: "Email and type are required" },
        { status: 400 }
      );
    }

    // Parse and validate type
    const type = parseVerificationType(typeString);
    if (!type) {
      return NextResponse.json(
        { code: "INVALID_TYPE", message: "Invalid verification type" },
        { status: 400 }
      );
    }

    // For password reset, check if user exists
    if (type === VerificationType.PASSWORD_RESET) {
      const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });

      if (!user) {
        // Don't reveal if user exists - return success anyway
        return NextResponse.json({ success: true });
      }
    }

    // Create and send verification code
    const result = await createVerificationCode(email, type);

    if (!result.success) {
      return NextResponse.json(
        { code: "SEND_FAILED", message: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
