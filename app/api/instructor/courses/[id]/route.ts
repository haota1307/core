import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updateCourseSchema } from "@/features/instructor/schemas";
import { createAuditLog } from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/instructor/courses/[id]
 * Lấy chi tiết khóa học
 */
export const GET = withPermission(
  "courses.manage_own",
  async (request: NextRequest, { params }: { params: RouteParams }, authContext) => {
    try {
      const user = authContext!.user;
      const { id } = await params;

      const course = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          sections: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { deletedAt: null },
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
 * PATCH /api/instructor/courses/[id]
 * Cập nhật khóa học
 */
export const PATCH = withPermission(
  "courses.manage_own",
  async (request: NextRequest, { params }: { params: RouteParams }, authContext) => {
    try {
      const user = authContext!.user;
      const { id } = await params;
      const body = await request.json();
      const validatedData = updateCourseSchema.parse(body);

      // Check course exists and belongs to instructor
      const existing = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Course not found" },
          { status: 404 }
        );
      }

      // Don't allow editing published courses directly (should unpublish first)
      if (existing.status === "PUBLISHED" && validatedData.status !== "DRAFT") {
        // Allow some fields to be edited even when published
        const allowedFields = ["shortDescription", "description", "thumbnail", "previewVideo"];
        const editingRestrictedFields = Object.keys(validatedData).some(
          (key) => !allowedFields.includes(key) && key !== "status"
        );
        
        if (editingRestrictedFields) {
          return NextResponse.json(
            { 
              code: "CANNOT_EDIT_PUBLISHED", 
              message: "Cannot edit published course. Please unpublish first." 
            },
            { status: 400 }
          );
        }
      }

      const course = await prisma.course.update({
        where: { id },
        data: validatedData,
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

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entityType: "Course",
        entityId: course.id,
        entityName: course.title,
        changes: validatedData,
        request,
      });

      return NextResponse.json({
        data: course,
        message: "Course updated successfully",
      });
    } catch (error) {
      console.error("Update course error:", error);
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

/**
 * DELETE /api/instructor/courses/[id]
 * Xóa khóa học (soft delete)
 */
export const DELETE = withPermission(
  "courses.manage_own",
  async (request: NextRequest, { params }: { params: RouteParams }, authContext) => {
    try {
      const user = authContext!.user;
      const { id } = await params;

      // Check course exists and belongs to instructor
      const existing = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Course not found" },
          { status: 404 }
        );
      }

      // Don't allow deleting published courses with enrollments
      if (existing.status === "PUBLISHED" && existing.enrollmentCount > 0) {
        return NextResponse.json(
          { 
            code: "CANNOT_DELETE", 
            message: "Cannot delete published course with enrolled students" 
          },
          { status: 400 }
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
        entityName: existing.title,
        request,
      });

      return NextResponse.json({
        message: "Course deleted successfully",
      });
    } catch (error) {
      console.error("Delete course error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
