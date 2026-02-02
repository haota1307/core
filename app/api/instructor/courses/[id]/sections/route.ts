import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createSectionSchema } from "@/features/instructor/schemas";
import { createAuditLog } from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/instructor/courses/[id]/sections
 * Lấy danh sách sections của khóa học
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

      // Check course exists and belongs to instructor
      const course = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
      });

      if (!course) {
        return NextResponse.json(
          { code: "COURSE_NOT_FOUND", message: "Course not found" },
          { status: 404 },
        );
      }

      const sections = await prisma.section.findMany({
        where: {
          courseId: id,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return NextResponse.json({ data: sections });
    } catch (error) {
      console.error("Get sections error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/instructor/courses/[id]/sections
 * Tạo section mới cho khóa học
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

      // Check course exists and belongs to instructor
      const course = await prisma.course.findFirst({
        where: {
          id,
          instructorId: user.id,
          deletedAt: null,
        },
      });

      if (!course) {
        return NextResponse.json(
          { code: "COURSE_NOT_FOUND", message: "Course not found" },
          { status: 404 },
        );
      }

      // Check if course is editable
      if (course.status === "PUBLISHED" || course.status === "PENDING_REVIEW") {
        return NextResponse.json(
          {
            code: "COURSE_NOT_EDITABLE",
            message: "Cannot modify sections of a published or pending course",
          },
          { status: 400 },
        );
      }

      // Validate input - override courseId with URL param
      const validatedData = createSectionSchema.parse({
        ...body,
        courseId: id,
      });

      // Get max sortOrder
      const maxOrder = await prisma.section.aggregate({
        where: {
          courseId: id,
          deletedAt: null,
        },
        _max: { sortOrder: true },
      });

      const newSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

      // Create section
      const section = await prisma.section.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          courseId: id,
          sortOrder: validatedData.sortOrder ?? newSortOrder,
        },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entityType: "section",
        entityId: section.id,
        entityName: section.title,
        metadata: {
          courseId: id,
          courseTitle: course.title,
        },
      });

      return NextResponse.json(
        { data: section, message: "Section created successfully" },
        { status: 201 },
      );
    } catch (error) {
      console.error("Create section error:", error);

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
