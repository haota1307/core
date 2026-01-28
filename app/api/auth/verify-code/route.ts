import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCode, parseVerificationType, VerificationType } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type: typeString } = body as { 
      email: string; 
      code: string; 
      type: string;
    };

    if (!email || !code || !typeString) {
      return NextResponse.json(
        { code: "MISSING_FIELDS", message: "Email, code, and type are required" },
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

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { code: "INVALID_CODE", message: "Code must be 6 digits" },
        { status: 400 }
      );
    }

    // Verify the code
    const result = await verifyCode(email, code, type);

    if (!result.success) {
      return NextResponse.json(
        { code: "VERIFICATION_FAILED", message: result.error },
        { status: 400 }
      );
    }

    // If email verification and user exists, update emailVerified field
    // (For new registrations, emailVerified is set during user creation)
    if (type === VerificationType.EMAIL_VERIFY) {
      const existingUser = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
      
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: new Date() },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
