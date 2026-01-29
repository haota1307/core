import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit-log";
import { reviewCourseSchema } from "@/features/admin/courses/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/courses/[id]/review
 * Duyệt hoặc từ chối khóa học
 */
export const POST = withPermission(
  "courses.approve",
  async (request: NextRequest, context: RouteContext, authContext) => {
    try {
      const { id } = await context.params;
      const user = authContext!.user;
      const body = await request.json();

      const { action, reason } = reviewCourseSchema.parse(body);

      const course = await prisma.course.findUnique({
        where: { id, deletedAt: null },
      });

      if (!course) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Course not found" },
          { status: 404 }
        );
      }

      if (course.status !== "PENDING_REVIEW") {
        return NextResponse.json(
          { code: "INVALID_STATUS", message: "Course is not pending review" },
          { status: 400 }
        );
      }

      const newStatus = action === "approve" ? "PUBLISHED" : "REJECTED";

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt: action === "approve" ? new Date() : undefined,
          rejectionReason: action === "reject" ? reason : null,
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: action === "approve" ? "APPROVE" : "REJECT",
        entityType: "Course",
        entityId: id,
        entityName: course.title,
        details: reason ? { reason } : undefined,
        request,
      });

      // TODO: Send notification to instructor

      return NextResponse.json({
        data: updatedCourse,
        message: action === "approve" 
          ? "Course approved and published" 
          : "Course rejected",
      });
    } catch (error) {
      console.error("Review course error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid input data" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

