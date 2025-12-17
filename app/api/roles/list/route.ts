import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";

/**
 * GET /api/roles/list
 * Lấy danh sách roles đơn giản (cho dropdown, select)
 * Chỉ cần authenticated, không cần permission cụ thể
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Lấy tất cả roles active (không phân trang)
    const roles = await prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      data: roles,
    });
  } catch (error) {
    console.error("Get roles list error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
});

