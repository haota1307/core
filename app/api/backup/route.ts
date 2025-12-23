import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";

// Backup directory path
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

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
        select: {
          id: true,
          filename: true,
          filePath: true,
          size: true,
          type: true,
          status: true,
          includeDatabase: true,
          includeMedia: true,
          includeSettings: true,
          createdAt: true,
        },
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

      // Ensure backup directory exists
      await ensureBackupDir();

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
      const jsonFilename = `backup-${timestamp}.json`;
      const zipFilename = `backup-${timestamp}.zip`;
      const zipFilePath = path.join(BACKUP_DIR, zipFilename);

      // Create ZIP file with backup data
      const sizeBytes = await new Promise<number>((resolve, reject) => {
        const output = createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
          resolve(archive.pointer());
        });

        archive.on("error", (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add JSON data to the archive
        const jsonString = JSON.stringify(backupData, null, 2);
        archive.append(jsonString, { name: jsonFilename });

        archive.finalize();
      });

      // Save backup record to database
      const backup = await prisma.backup.create({
        data: {
          filename: zipFilename,
          filePath: zipFilePath,
          size: sizeBytes,
          type: "manual",
          status: "completed",
          includeDatabase,
          includeMedia,
          includeSettings,
        },
      });

      // Log backup creation
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.BACKUP_CREATE,
          entityType: "backup",
          entityId: backup.id,
          entityName: zipFilename,
          metadata: {
            includeDatabase,
            includeMedia,
            includeSettings,
            size: sizeBytes,
            filePath: zipFilePath,
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
