import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit-log";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/courses/[id]
 * Lấy chi tiết khóa học (Admin)
 */
export const GET = withPermission(
  "courses.manage_all",
  async (request: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const course = await prisma.course.findUnique({
        where: { id, deletedAt: null },
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Course not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: course });
    } catch (error) {
      console.error("Get course error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/admin/courses/[id]
 * Xóa khóa học (Admin - soft delete)
 */
export const DELETE = withPermission(
  "courses.manage_all",
  async (request: NextRequest, context: RouteContext, authContext) => {
    try {
      const { id } = await context.params;
      const user = authContext!.user;

      const course = await prisma.course.findUnique({
        where: { id, deletedAt: null },
      });

      if (!course) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Course not found" },
          { status: 404 }
        );
      }

      // Soft delete
      await prisma.course.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "DELETE",
        entityType: "Course",
        entityId: id,
        entityName: course.title,
        request,
      });

      return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Delete course error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

