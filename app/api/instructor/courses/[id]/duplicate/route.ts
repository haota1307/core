import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit-log";

/**
 * POST /api/instructor/courses/[id]/duplicate
 * Duplicate a course with all sections and lessons
 */
export const POST = withPermission(
  "courses.create",
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
    authContext,
  ) => {
    try {
      const { id } = await params;

      if (!authContext) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized" },
          { status: 401 },
        );
      }

      const userId = authContext.user.id;

      // Get original course
      const originalCourse = await prisma.course.findFirst({
        where: {
          id,
          instructorId: userId,
          deletedAt: null,
        },
        include: {
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

      if (!originalCourse) {
        return NextResponse.json(
          {
            code: "COURSE_NOT_FOUND",
            message: "Course not found or you don't have permission",
          },
          { status: 404 },
        );
      }

      // Generate unique slug
      const baseSlug = `${originalCourse.slug}-copy`;
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.course.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create duplicated course
      const duplicatedCourse = await prisma.course.create({
        data: {
          title: `${originalCourse.title} (Copy)`,
          slug,
          shortDescription: originalCourse.shortDescription,
          description: originalCourse.description,
          thumbnail: originalCourse.thumbnail,
          previewVideo: originalCourse.previewVideo,
          price: originalCourse.price,
          salePrice: originalCourse.salePrice,
          currency: originalCourse.currency,
          level: originalCourse.level,
          status: "DRAFT", // Always set to draft
          language: originalCourse.language,
          requirements: originalCourse.requirements,
          objectives: originalCourse.objectives,
          targetAudience: originalCourse.targetAudience,
          instructorId: userId,
          categoryId: originalCourse.categoryId,
        },
      });

      // Duplicate sections and lessons
      for (const section of originalCourse.sections) {
        const duplicatedSection = await prisma.section.create({
          data: {
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder,
            courseId: duplicatedCourse.id,
          },
        });

        // Duplicate lessons
        for (const lesson of section.lessons) {
          await prisma.lesson.create({
            data: {
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              sortOrder: lesson.sortOrder,
              isFree: lesson.isFree,
              isPublished: false, // Always set to unpublished
              sectionId: duplicatedSection.id,
            },
          });
        }
      }

      // Create audit log
      await createAuditLog({
        userId,
        action: "CREATE",
        entityType: "course",
        entityId: duplicatedCourse.id,
        entityName: duplicatedCourse.title,
        metadata: {
          message: `Duplicated course from "${originalCourse.title}"`,
          originalCourseId: originalCourse.id,
        },
      });

      return NextResponse.json({
        message: "Course duplicated successfully",
        data: {
          id: duplicatedCourse.id,
          title: duplicatedCourse.title,
          slug: duplicatedCourse.slug,
        },
      });
    } catch (error) {
      console.error("Error duplicating course:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Failed to duplicate course" },
        { status: 500 },
      );
    }
  },
);
