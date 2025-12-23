import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";

/**
 * GET /api/backup/export-settings - Export all settings as JSON
 */
export const GET = withPermission(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const settings = await prisma.setting.findMany({
        orderBy: { group: "asc" },
      });

      // Format settings by group
      const exportData: Record<string, Record<string, unknown>> = {
        _meta: {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          exportedBy: auth!.user.email,
        },
      };

      for (const setting of settings) {
        if (!exportData[setting.group]) {
          exportData[setting.group] = {};
        }
        exportData[setting.group][setting.key] = setting.value;
      }

      // Log export action
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.SETTINGS_EXPORT,
          entityType: "settings",
          entityName: "all-settings",
          metadata: { settingsCount: settings.length },
          status: "success",
        },
        request
      );

      const jsonString = JSON.stringify(exportData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      return new NextResponse(jsonString, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="settings-${timestamp}.json"`,
        },
      });
    } catch (error) {
      console.error("Export settings error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to export settings" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/backup/export-settings - Import settings from JSON
 */
export const POST = withPermission(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const body = await request.json();

      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { code: "INVALID_DATA", message: "Invalid settings data" },
          { status: 400 }
        );
      }

      let importedCount = 0;
      const errors: string[] = [];

      // Process each group
      for (const [group, settings] of Object.entries(body)) {
        // Skip metadata
        if (group === "_meta") continue;

        if (typeof settings !== "object" || settings === null) continue;

        for (const [key, value] of Object.entries(settings)) {
          try {
            // Check if setting exists
            const existingSetting = await prisma.setting.findUnique({
              where: { key },
            });

            if (existingSetting) {
              // Update existing setting
              await prisma.setting.update({
                where: { key },
                data: { value: value as any },
              });
            } else {
              // Create new setting with inferred type
              let type = "string";
              if (typeof value === "boolean") type = "boolean";
              else if (typeof value === "number") type = "number";
              else if (Array.isArray(value)) type = "array";
              else if (typeof value === "object") type = "json";

              await prisma.setting.create({
                data: {
                  key,
                  value: value as any,
                  group,
                  type,
                  isPublic: false,
                },
              });
            }
            importedCount++;
          } catch (err) {
            errors.push(`Failed to import ${key}: ${(err as Error).message}`);
          }
        }
      }

      // Log import action
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.SETTINGS_IMPORT,
          entityType: "settings",
          entityName: "imported-settings",
          metadata: { importedCount, errors: errors.length },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        message: `Successfully imported ${importedCount} settings`,
        importedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Import settings error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to import settings" },
        { status: 500 }
      );
    }
  }
);
