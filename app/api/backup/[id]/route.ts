import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";

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

      // Return backup data as downloadable JSON
      const jsonString = JSON.stringify(backup.data, null, 2);

      return new NextResponse(jsonString, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${backup.filename}"`,
        },
      });
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
