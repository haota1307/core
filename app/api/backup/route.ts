import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";

/**
 * GET /api/backup - List all backups
 */
export const GET = withPermission(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const backups = await prisma.backup.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ backups });
    } catch (error) {
      console.error("List backups error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to list backups" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/backup - Create a new backup
 */
export const POST = withPermission(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const body = await request.json().catch(() => ({}));
      const {
        includeDatabase = true,
        includeMedia = false,
        includeSettings = true,
      } = body;

      // Get all data to backup
      const backupData: Record<string, unknown> = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        type: "full",
      };

      // Backup database tables
      if (includeDatabase) {
        const [users, roles, permissions, rolePermissions] = await Promise.all([
          prisma.user.findMany({
            where: { deletedAt: null },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              emailVerified: true,
              image: true,
              roleId: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          prisma.role.findMany({ where: { deletedAt: null } }),
          prisma.permission.findMany({ where: { deletedAt: null } }),
          prisma.rolePermission.findMany({ where: { deletedAt: null } }),
        ]);

        backupData.users = users;
        backupData.roles = roles;
        backupData.permissions = permissions;
        backupData.rolePermissions = rolePermissions;
      }

      // Backup settings
      if (includeSettings) {
        const settings = await prisma.setting.findMany();
        backupData.settings = settings;
      }

      // Backup media metadata (not files)
      if (includeMedia) {
        const [media, mediaFolders] = await Promise.all([
          prisma.media.findMany({ where: { deletedAt: null } }),
          prisma.mediaFolder.findMany({ where: { deletedAt: null } }),
        ]);
        backupData.media = media;
        backupData.mediaFolders = mediaFolders;
      }

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.json`;

      // Calculate size
      const jsonString = JSON.stringify(backupData);
      const sizeBytes = new TextEncoder().encode(jsonString).length;

      // Save backup record to database
      const backup = await prisma.backup.create({
        data: {
          filename,
          size: sizeBytes,
          type: "manual",
          status: "completed",
          includeDatabase,
          includeMedia,
          includeSettings,
          data: JSON.parse(JSON.stringify(backupData)),
        },
      });

      // Log backup creation
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.BACKUP_CREATE,
          entityType: "backup",
          entityId: backup.id,
          entityName: filename,
          metadata: {
            includeDatabase,
            includeMedia,
            includeSettings,
            size: sizeBytes,
          },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        backup: {
          id: backup.id,
          filename: backup.filename,
          size: backup.size,
          createdAt: backup.createdAt,
        },
        message: "Backup created successfully",
      });
    } catch (error) {
      console.error("Create backup error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to create backup" },
        { status: 500 }
      );
    }
  }
);
