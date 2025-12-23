import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/settings/maintenance
 * Check if maintenance mode is enabled (no auth required, for middleware)
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "maintenanceMode" },
      select: { value: true },
    });

    const isMaintenanceMode = setting?.value === true;

    return NextResponse.json({
      maintenanceMode: isMaintenanceMode,
    });
  } catch (error) {
    console.error("[MAINTENANCE_CHECK]", error);
    // Default to false if there's an error
    return NextResponse.json({ maintenanceMode: false });
  }
}
