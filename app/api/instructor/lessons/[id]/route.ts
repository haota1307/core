import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updateLessonSchema } from "@/features/instructor/schemas";
import { createAuditLog } from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * PATCH /api/instructor/lessons/[id]
 * Cập nhật lesson
 */
export const PATCH = withPermission(
  "courses.manage_own",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext,
  ) => {
    try {
      const user = authContext!.user;
      const { id } = await params;
      const body = await request.json();

      // Check lesson exists and belongs to instructor's course
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          id,
          deletedAt: null,
          section: {
            deletedAt: null,
            course: {
              instructorId: user.id,
              deletedAt: null,
            },
          },
        },
        include: {
          section: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!existingLesson) {
        return NextResponse.json(
          { code: "LESSON_NOT_FOUND", message: "Lesson not found" },
          { status: 404 },
        );
      }

      // Check if course is editable
      if (
        existingLesson.section.course.status === "PUBLISHED" ||
        existingLesson.section.course.status === "PENDING_REVIEW"
      ) {
        return NextResponse.json(
          {
            code: "COURSE_NOT_EDITABLE",
            message: "Cannot modify lessons of a published or pending course",
          },
          { status: 400 },
        );
      }

      // Validate input
      const validatedData = updateLessonSchema.parse(body);

      // Update lesson
      const lesson = await prisma.lesson.update({
        where: { id },
        data: {
          ...(validatedData.title !== undefined && {
            title: validatedData.title,
          }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.type !== undefined && { type: validatedData.type }),
          ...(validatedData.videoUrl !== undefined && {
            videoUrl: validatedData.videoUrl,
          }),
          ...(validatedData.videoDuration !== undefined && {
            videoDuration: validatedData.videoDuration,
          }),
          ...(validatedData.videoProvider !== undefined && {
            videoProvider: validatedData.videoProvider,
          }),
          ...(validatedData.content !== undefined && {
            content: validatedData.content,
          }),
          ...(validatedData.isFree !== undefined && {
            isFree: validatedData.isFree,
          }),
          ...(validatedData.isPublished !== undefined && {
            isPublished: validatedData.isPublished,
          }),
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entityType: "lesson",
        entityId: lesson.id,
        entityName: lesson.title,
        metadata: {
          sectionId: existingLesson.section.id,
          sectionTitle: existingLesson.section.title,
          courseId: existingLesson.section.course.id,
          courseTitle: existingLesson.section.course.title,
        },
      });

      return NextResponse.json({
        data: lesson,
        message: "Lesson updated successfully",
      });
    } catch (error) {
      console.error("Update lesson error:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid input data" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/instructor/lessons/[id]
 * Xóa lesson (soft delete)
 */
export const DELETE = withPermission(
  "courses.manage_own",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext,
  ) => {
    try {
      const user = authContext!.user;
      const { id } = await params;

      // Check lesson exists and belongs to instructor's course
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          id,
          deletedAt: null,
          section: {
            deletedAt: null,
            course: {
              instructorId: user.id,
              deletedAt: null,
            },
          },
        },
        include: {
          section: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!existingLesson) {
        return NextResponse.json(
          { code: "LESSON_NOT_FOUND", message: "Lesson not found" },
          { status: 404 },
        );
      }

      // Check if course is editable
      if (
        existingLesson.section.course.status === "PUBLISHED" ||
        existingLesson.section.course.status === "PENDING_REVIEW"
      ) {
        return NextResponse.json(
          {
            code: "COURSE_NOT_EDITABLE",
            message: "Cannot delete lessons of a published or pending course",
          },
          { status: 400 },
        );
      }

      // Soft delete
      await prisma.lesson.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "DELETE",
        entityType: "lesson",
        entityId: id,
        entityName: existingLesson.title,
        metadata: {
          sectionId: existingLesson.section.id,
          sectionTitle: existingLesson.section.title,
          courseId: existingLesson.section.course.id,
          courseTitle: existingLesson.section.course.title,
        },
      });

      return NextResponse.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Delete lesson error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
