import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import bcrypt from "bcryptjs";

/**
 * POST /api/backup/[id]/restore - Restore from a backup
 */
export const POST = withPermission<Promise<{ id: string }>>(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const { id } = await context.params;
      const body = await request.json().catch(() => ({}));
      const { restoreDatabase = true, restoreSettings = true } = body;

      const backup = await prisma.backup.findUnique({
        where: { id },
      });

      if (!backup) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Backup not found" },
          { status: 404 }
        );
      }

      const backupData = backup.data as Record<string, unknown>;
      const results: Record<string, number> = {};

      // Restore settings
      if (restoreSettings && backupData.settings) {
        const settings = backupData.settings as Array<{
          key: string;
          value: unknown;
          group: string;
          type: string;
          label?: string;
          description?: string;
          isPublic?: boolean;
        }>;

        for (const setting of settings) {
          await prisma.setting.upsert({
            where: { key: setting.key },
            create: {
              key: setting.key,
              value: setting.value as any,
              group: setting.group,
              type: setting.type,
              label: setting.label,
              description: setting.description,
              isPublic: setting.isPublic ?? false,
            },
            update: {
              value: setting.value as any,
              group: setting.group,
              type: setting.type,
              label: setting.label,
              description: setting.description,
              isPublic: setting.isPublic ?? false,
            },
          });
        }
        results.settings = settings.length;
      }

      // Restore database (roles, permissions)
      if (restoreDatabase) {
        // Restore permissions first
        if (backupData.permissions) {
          const permissions = backupData.permissions as Array<{
            id: string;
            code: string;
            description?: string;
          }>;

          for (const permission of permissions) {
            await prisma.permission.upsert({
              where: { code: permission.code },
              create: {
                id: permission.id,
                code: permission.code,
                description: permission.description,
              },
              update: {
                description: permission.description,
              },
            });
          }
          results.permissions = permissions.length;
        }

        // Restore roles
        if (backupData.roles) {
          const roles = backupData.roles as Array<{
            id: string;
            name: string;
            description?: string;
            isSystem?: boolean;
          }>;

          for (const role of roles) {
            await prisma.role.upsert({
              where: { name: role.name },
              create: {
                id: role.id,
                name: role.name,
                description: role.description,
                isSystem: role.isSystem ?? false,
              },
              update: {
                description: role.description,
                isSystem: role.isSystem ?? false,
              },
            });
          }
          results.roles = roles.length;
        }

        // Restore role permissions
        if (backupData.rolePermissions) {
          const rolePermissions = backupData.rolePermissions as Array<{
            roleId: string;
            permissionId: string;
          }>;

          for (const rp of rolePermissions) {
            await prisma.rolePermission
              .upsert({
                where: {
                  roleId_permissionId: {
                    roleId: rp.roleId,
                    permissionId: rp.permissionId,
                  },
                },
                create: {
                  roleId: rp.roleId,
                  permissionId: rp.permissionId,
                },
                update: {},
              })
              .catch(() => {
                // Ignore if role or permission doesn't exist
              });
          }
          results.rolePermissions = rolePermissions.length;
        }
      }

      // Log restore action
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.BACKUP_RESTORE,
          entityType: "backup",
          entityId: id,
          entityName: backup.filename,
          metadata: { restoreDatabase, restoreSettings, results },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        message: "Backup restored successfully",
        results,
      });
    } catch (error) {
      console.error("Restore backup error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to restore backup" },
        { status: 500 }
      );
    }
  }
);
