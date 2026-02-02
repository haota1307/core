import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * POST /api/instructor/courses/[id]/submit
 * Gửi khóa học để duyệt
 */
export const POST = withPermission(
  "courses.manage_own",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext,
  ) => {
    try {
      const user = authContext!.user;
      const { id } = await params;

      // Check course exists and belongs to instructor
      const course = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
        include: {
          sections: {
            where: { deletedAt: null },
            include: {
              lessons: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { code: "COURSE_NOT_FOUND", message: "Course not found" },
          { status: 404 },
        );
      }

      // Check if course is in DRAFT or REJECTED status
      if (course.status !== "DRAFT" && course.status !== "REJECTED") {
        return NextResponse.json(
          {
            code: "INVALID_STATUS",
            message:
              "Only draft or rejected courses can be submitted for review",
          },
          { status: 400 },
        );
      }

      // Validate course has required content
      const errorCodes: string[] = [];

      if (!course.title || course.title.trim() === "") {
        errorCodes.push("MISSING_TITLE");
      }

      if (!course.description || course.description.trim() === "") {
        errorCodes.push("MISSING_DESCRIPTION");
      }

      if (!course.thumbnail) {
        errorCodes.push("MISSING_THUMBNAIL");
      }

      if (course.sections.length === 0) {
        errorCodes.push("MISSING_SECTION");
      }

      const totalLessons = course.sections.reduce(
        (acc, section) => acc + section.lessons.length,
        0,
      );
      if (totalLessons === 0) {
        errorCodes.push("MISSING_LESSON");
      }

      if (errorCodes.length > 0) {
        return NextResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Course is not ready for review",
            errors: errorCodes,
          },
          { status: 400 },
        );
      }

      // Update course status
      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          status: "PENDING_REVIEW",
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Create audit log
      await createAuditLog({
        userId: user.id,
        action: "course.submit_review",
        entityType: "Course",
        entityId: course.id,
        entityName: course.title,
        metadata: {
          previousStatus: course.status,
          newStatus: "PENDING_REVIEW",
        },
      });

      return NextResponse.json({
        data: updatedCourse,
        message: "Course submitted for review successfully",
      });
    } catch (error) {
      console.error("Submit course error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
