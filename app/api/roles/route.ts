import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";

/**
 * GET /api/roles
 * Lấy danh sách roles (cho dropdown selection)
 */
export const GET = withPermission(
  "roles.view",
  async (request: NextRequest) => {
    try {
      const roles = await prisma.role.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ data: roles });
    } catch (error) {
      console.error("Get roles error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

