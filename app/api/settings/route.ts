import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getSettingsQuerySchema } from "@/features/settings/schemas";
import { createAuditLog, AuditAction } from "@/lib/audit-log";

/**
 * GET /api/settings
 * Get all settings or filter by group/key
 */
export const GET = withPermission(
  "settings.view",
  async (request: NextRequest, context, authContext) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse query params
      const query = getSettingsQuerySchema.parse({
        group: searchParams.get("group") || undefined,
        key: searchParams.get("key") || undefined,
        isPublic: searchParams.get("isPublic") || undefined,
      });

      // Build where clause
      const where: any = {};

      if (query.group) {
        where.group = query.group;
      }

      if (query.key) {
        where.key = query.key;
      }

      // If not authenticated or requesting public settings only
      if (query.isPublic !== undefined) {
        where.isPublic = query.isPublic;
      }

      const settings = await prisma.setting.findMany({
        where,
        orderBy: [{ group: "asc" }, { key: "asc" }],
      });

      return NextResponse.json({ data: settings });
    } catch (error: any) {
      console.error("[SETTINGS_GET]", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch settings" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/settings
 * Create or update a single setting
 */
export const POST = withPermission(
  "settings.edit",
  async (request: NextRequest, context, authContext) => {
    try {
      const body = await request.json();
      const { key, value, group, type, label, description, isPublic } = body;

      if (!key || !group) {
        return NextResponse.json(
          { error: "Key and group are required" },
          { status: 400 }
        );
      }

      const setting = await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value,
          group,
          type: type || "string",
          label,
          description,
          isPublic: isPublic || false,
        },
        update: {
          value,
          group,
          type,
          label,
          description,
          isPublic,
        },
      });

      // Audit log
      await createAuditLog(
        {
          userId: authContext!.user.id,
          action: AuditAction.SETTING_UPDATE,
          entityType: "setting",
          entityId: setting.id,
          entityName: setting.key,
          changes: { key, value },
        },
        request
      );

      return NextResponse.json({
        data: setting,
        message: "Setting saved successfully",
      });
    } catch (error: any) {
      console.error("[SETTINGS_POST]", error);
      return NextResponse.json(
        { error: error.message || "Failed to save setting" },
        { status: 500 }
      );
    }
  }
);
