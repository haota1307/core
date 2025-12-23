import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import fs from "fs/promises";
import { createReadStream } from "fs";

/**
 * GET /api/backup/[id] - Download a specific backup
 */
export const GET = withPermission<Promise<{ id: string }>>(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const { id } = await context.params;

      const backup = await prisma.backup.findUnique({
        where: { id },
      });

      if (!backup) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Backup not found" },
          { status: 404 }
        );
      }

      // Check if backup has file path (new ZIP format)
      if (backup.filePath) {
        try {
          // Check if file exists
          await fs.access(backup.filePath);

          // Read file and return as response
          const fileBuffer = await fs.readFile(backup.filePath);

          return new NextResponse(fileBuffer, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="${backup.filename}"`,
              "Content-Length": backup.size.toString(),
            },
          });
        } catch {
          return NextResponse.json(
            {
              code: "FILE_NOT_FOUND",
              message: "Backup file not found on server",
            },
            { status: 404 }
          );
        }
      }

      // Fallback for legacy backups stored in database
      if (backup.data) {
        const jsonString = JSON.stringify(backup.data, null, 2);

        return new NextResponse(jsonString, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${backup.filename}"`,
          },
        });
      }

      return NextResponse.json(
        { code: "NO_DATA", message: "Backup has no data" },
        { status: 404 }
      );
    } catch (error) {
      console.error("Download backup error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to download backup" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/backup/[id] - Delete a backup
 */
export const DELETE = withPermission<Promise<{ id: string }>>(
  "settings:manage",
  async (request, context, auth) => {
    try {
      const { id } = await context.params;

      const backup = await prisma.backup.findUnique({
        where: { id },
      });

      if (!backup) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Backup not found" },
          { status: 404 }
        );
      }

      // Delete file from server if exists
      if (backup.filePath) {
        try {
          await fs.unlink(backup.filePath);
        } catch (err) {
          // File might not exist, continue with database deletion
          console.warn("Could not delete backup file:", err);
        }
      }

      await prisma.backup.delete({
        where: { id },
      });

      // Log backup deletion
      await createAuditLog(
        {
          userId: auth!.user.id,
          action: AuditAction.BACKUP_DELETE,
          entityType: "backup",
          entityId: id,
          entityName: backup.filename,
          status: "success",
        },
        request
      );

      return NextResponse.json({
        message: "Backup deleted successfully",
      });
    } catch (error) {
      console.error("Delete backup error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to delete backup" },
        { status: 500 }
      );
    }
  }
);
