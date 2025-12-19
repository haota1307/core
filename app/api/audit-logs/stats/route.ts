import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";

/**
 * GET /api/audit-logs/stats
 * Lấy thống kê audit logs
 */
export const GET = withPermission(
  "audit_logs.view",
  async (request: NextRequest) => {
    try {
      // Lấy tổng số logs
      const totalLogs = await prisma.auditLog.count();

      // Đếm số logs thành công và thất bại
      const [successCount, errorCount] = await Promise.all([
        prisma.auditLog.count({ where: { status: "success" } }),
        prisma.auditLog.count({ where: { status: "error" } }),
      ]);

      // Lấy top 10 actions
      const topActionsRaw = await prisma.auditLog.groupBy({
        by: ["action"],
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: "desc",
          },
        },
        take: 10,
      });

      const topActions = topActionsRaw.map((item) => ({
        action: item.action,
        count: item._count.action,
      }));

      // Lấy top 10 users
      const topUsersRaw = await prisma.auditLog.groupBy({
        by: ["userId"],
        _count: {
          userId: true,
        },
        where: {
          userId: { not: null },
        },
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 10,
      });

      // Lấy thông tin chi tiết users
      const userIds = topUsersRaw
        .map((item) => item.userId)
        .filter((id): id is string => id !== null);

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const topUsers = topUsersRaw
        .map((item) => {
          const user = item.userId ? userMap.get(item.userId) : null;
          return {
            userId: item.userId || "",
            userName: user?.name || null,
            userEmail: user?.email || "",
            count: item._count.userId,
          };
        })
        .filter((item) => item.userId);

      // Lấy 10 hoạt động gần nhất
      const recentActivities = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          action: true,
          entityType: true,
          entityId: true,
          entityName: true,
          changes: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          status: true,
          errorMsg: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        data: {
          totalLogs,
          successCount,
          errorCount,
          topActions,
          topUsers,
          recentActivities,
        },
      });
    } catch (error) {
      console.error("Get audit logs stats error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

