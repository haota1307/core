import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/settings/public
 * Get all public settings (no authentication required)
 * This is used for site-wide settings like site name, logo, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    // Build where clause - only public settings
    const where: any = {
      isPublic: true,
    };

    if (group) {
      where.group = group;
    }

    const settings = await prisma.setting.findMany({
      where,
      select: {
        key: true,
        value: true,
        group: true,
      },
    });

    // Convert to key-value object grouped by group
    const result: Record<string, Record<string, unknown>> = {};

    for (const setting of settings) {
      if (!result[setting.group]) {
        result[setting.group] = {};
      }
      result[setting.group][setting.key] = setting.value;
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error("[PUBLIC_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
