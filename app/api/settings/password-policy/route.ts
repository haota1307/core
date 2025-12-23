import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Public API to get password policy settings for client-side validation
 * No authentication required
 */
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        group: "security",
        key: {
          in: [
            "passwordMinLength",
            "passwordRequireUppercase",
            "passwordRequireLowercase",
            "passwordRequireNumber",
            "passwordRequireSpecial",
          ],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Build policy object with defaults
    const policy = {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: false,
    };

    for (const setting of settings) {
      (policy as any)[setting.key] = setting.value;
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to fetch password policy:", error);
    // Return defaults on error
    return NextResponse.json({
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: false,
    });
  }
}
