import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";

/**
 * DELETE /api/audit-logs/cleanup?olderThanDays=90
 * Xóa audit logs cũ hơn số ngày được chỉ định
 * Chỉ admin mới có quyền
 */
export const DELETE = withPermission(
  "audit_logs.delete",
  async (request: NextRequest, context: any, authContext: any) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const olderThanDays = parseInt(
        searchParams.get("olderThanDays") || "90"
      );

      if (olderThanDays < 1) {
        return NextResponse.json(
          {
            code: "INVALID_PARAMETER",
            message: "olderThanDays must be at least 1",
          },
          { status: 400 }
        );
      }

      // Tính ngày cắt
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Đếm số logs sẽ bị xóa
      const countToDelete = await prisma.auditLog.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Xóa logs cũ
      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Ghi audit log cho hành động này
      await createAuditLog(
        {
          userId: authContext.user.id,
          action: AuditAction.USER_DELETE, // hoặc tạo action mới cho cleanup
          entityType: "audit_log",
          entityName: `Cleanup logs older than ${olderThanDays} days`,
          metadata: {
            olderThanDays,
            deletedCount: result.count,
            cutoffDate: cutoffDate.toISOString(),
          },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        message: `Successfully deleted ${result.count} audit logs`,
        deletedCount: result.count,
      });
    } catch (error) {
      console.error("Cleanup audit logs error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

