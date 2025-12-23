import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import {
  SettingGroup,
  generalSettingsSchema,
  emailSettingsSchema,
  mediaSettingsSchema,
  securitySettingsSchema,
  notificationSettingsSchema,
  seoSettingsSchema,
  localizationSettingsSchema,
  backupSettingsSchema,
} from "@/features/settings/schemas";

// Schema map for validation
const schemaMap: Record<string, any> = {
  [SettingGroup.GENERAL]: generalSettingsSchema,
  [SettingGroup.EMAIL]: emailSettingsSchema,
  [SettingGroup.MEDIA]: mediaSettingsSchema,
  [SettingGroup.SECURITY]: securitySettingsSchema,
  [SettingGroup.NOTIFICATION]: notificationSettingsSchema,
  [SettingGroup.SEO]: seoSettingsSchema,
  [SettingGroup.LOCALIZATION]: localizationSettingsSchema,
  [SettingGroup.BACKUP]: backupSettingsSchema,
};

// Type map for settings
const typeMap: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  object: "json",
};

function getValueType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  return typeMap[typeof value] || "string";
}

// Define which settings should be publicly accessible (no auth required)
const publicSettings: Record<string, string[]> = {
  [SettingGroup.GENERAL]: [
    "siteName",
    "siteDescription",
    "siteLogo",
    "favicon",
    "contactEmail",
    "contactPhone",
    "address",
    "timezone",
    "dateFormat",
    "maintenanceMode",
  ],
  [SettingGroup.SEO]: [
    "defaultMetaTitle",
    "defaultMetaDescription",
    "defaultMetaKeywords",
    "googleAnalyticsId",
    "googleTagManagerId",
    "facebookPixelId",
    "enableSitemap",
  ],
  [SettingGroup.LOCALIZATION]: [
    "defaultLocale",
    "availableLocales",
    "currencyCode",
    "currencySymbol",
    "currencyPosition",
    "thousandSeparator",
    "decimalSeparator",
  ],
};

function isPublicSetting(group: string, key: string): boolean {
  return publicSettings[group]?.includes(key) ?? false;
}

type Params = Promise<{ group: string }>;

/**
 * GET /api/settings/group/[group]
 * Get all settings for a specific group as key-value object
 */
export const GET = withPermission(
  "settings.view",
  async (request: NextRequest, context, authContext) => {
    try {
      const { group } = await (context.params as unknown as Params);

      // Validate group
      const validGroups = Object.values(SettingGroup);
      if (!validGroups.includes(group as any)) {
        return NextResponse.json(
          { error: `Invalid group. Valid groups: ${validGroups.join(", ")}` },
          { status: 400 }
        );
      }

      const settingsRecords = await prisma.setting.findMany({
        where: { group },
      });

      // Convert to key-value object
      const settings: Record<string, unknown> = {};
      for (const record of settingsRecords) {
        settings[record.key] = record.value;
      }

      return NextResponse.json({
        group,
        settings,
      });
    } catch (error: any) {
      console.error("[SETTINGS_GROUP_GET]", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch settings" },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/settings/group/[group]
 * Update all settings for a specific group
 */
export const PUT = withPermission(
  "settings.edit",
  async (request: NextRequest, context, authContext) => {
    try {
      const { group } = await (context.params as unknown as Params);
      const body = await request.json();

      // Validate group
      const validGroups = Object.values(SettingGroup);
      if (!validGroups.includes(group as any)) {
        return NextResponse.json(
          { error: `Invalid group. Valid groups: ${validGroups.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate with appropriate schema
      const schema = schemaMap[group];
      if (schema) {
        const result = schema.safeParse(body);
        if (!result.success) {
          return NextResponse.json(
            { error: "Validation failed", details: result.error.issues },
            { status: 400 }
          );
        }
      }

      // Get existing settings for comparison
      const existingSettings = await prisma.setting.findMany({
        where: { group },
      });
      const existingMap = new Map(
        existingSettings.map((s) => [s.key, s.value])
      );

      // Upsert each setting
      const operations = Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: {
            key,
            value: value as any,
            group,
            type: getValueType(value),
            isPublic: isPublicSetting(group, key),
          },
          update: {
            value: value as any,
            type: getValueType(value),
            isPublic: isPublicSetting(group, key),
          },
        })
      );

      await prisma.$transaction(operations);

      // Build changes object for audit
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const [key, value] of Object.entries(body)) {
        const oldValue = existingMap.get(key);
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          // Don't log sensitive values
          if (
            key.toLowerCase().includes("password") ||
            key.toLowerCase().includes("secret")
          ) {
            changes[key] = { old: "***", new: "***" };
          } else {
            changes[key] = { old: oldValue, new: value };
          }
        }
      }

      // Audit log
      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          {
            userId: authContext!.user.id,
            action: AuditAction.SETTING_UPDATE,
            entityType: "setting",
            entityId: group,
            entityName: `Settings: ${group}`,
            changes,
          },
          request
        );
      }

      return NextResponse.json({
        message: "Settings updated successfully",
      });
    } catch (error: any) {
      console.error("[SETTINGS_GROUP_PUT]", error);
      return NextResponse.json(
        { error: error.message || "Failed to update settings" },
        { status: 500 }
      );
    }
  }
);
