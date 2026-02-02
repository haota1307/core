import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createLessonSchema } from "@/features/instructor/schemas";
import { createAuditLog } from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/instructor/sections/[id]/lessons
 * Lấy danh sách lessons của section
 */
export const GET = withPermission(
  "courses.manage_own",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext,
  ) => {
    try {
      const user = authContext!.user;
      const { id } = await params;

      // Check section exists and belongs to instructor's course
      const section = await prisma.section.findFirst({
        where: {
          id,
          deletedAt: null,
          course: {
            instructorId: user.id,
            deletedAt: null,
          },
        },
      });

      if (!section) {
        return NextResponse.json(
          { code: "SECTION_NOT_FOUND", message: "Section not found" },
          { status: 404 },
        );
      }

      const lessons = await prisma.lesson.findMany({
        where: {
          sectionId: id,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
      });

      return NextResponse.json({ data: lessons });
    } catch (error) {
      console.error("Get lessons error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/instructor/sections/[id]/lessons
 * Tạo lesson mới cho section
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
      const body = await request.json();

      // Check section exists and belongs to instructor's course
      const section = await prisma.section.findFirst({
        where: {
          id,
          deletedAt: null,
          course: {
            instructorId: user.id,
            deletedAt: null,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!section) {
        return NextResponse.json(
          { code: "SECTION_NOT_FOUND", message: "Section not found" },
          { status: 404 },
        );
      }

      // Check if course is editable
      if (
        section.course.status === "PUBLISHED" ||
        section.course.status === "PENDING_REVIEW"
      ) {
        return NextResponse.json(
          {
            code: "COURSE_NOT_EDITABLE",
            message: "Cannot modify lessons of a published or pending course",
          },
          { status: 400 },
        );
      }

      // Validate input - override sectionId with URL param
      const validatedData = createLessonSchema.parse({
        ...body,
        sectionId: id,
      });

      // Get max sortOrder
      const maxOrder = await prisma.lesson.aggregate({
        where: {
          sectionId: id,
          deletedAt: null,
        },
        _max: { sortOrder: true },
      });

      const newSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

      // Create lesson
      const lesson = await prisma.lesson.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.type,
          videoUrl: validatedData.videoUrl,
          videoDuration: validatedData.videoDuration,
          videoProvider: validatedData.videoProvider,
          content: validatedData.content,
          isFree: validatedData.isFree,
          isPublished: validatedData.isPublished,
          sectionId: id,
          sortOrder: validatedData.sortOrder ?? newSortOrder,
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entityType: "lesson",
        entityId: lesson.id,
        entityName: lesson.title,
        metadata: {
          sectionId: id,
          sectionTitle: section.title,
          courseId: section.course.id,
          courseTitle: section.course.title,
        },
      });

      return NextResponse.json(
        { data: lesson, message: "Lesson created successfully" },
        { status: 201 },
      );
    } catch (error) {
      console.error("Create lesson error:", error);

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
