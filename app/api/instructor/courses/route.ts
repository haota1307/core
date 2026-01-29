import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createCourseSchema, getCoursesQuerySchema } from "@/features/instructor/schemas";
import { createAuditLog } from "@/lib/audit-log";

/**
 * GET /api/instructor/courses
 * Lấy danh sách khóa học của instructor hiện tại
 */
export const GET = withPermission(
  "courses.manage_own",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

    const searchParams = request.nextUrl.searchParams;
    const query = getCoursesQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || undefined,
      status: searchParams.getAll("status").length > 0
        ? searchParams.getAll("status")
        : undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      level: searchParams.get("level") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const skip = (query.page - 1) * query.limit;

    // Build where clause
    const where: Record<string, unknown> = {
      instructorId: user.id,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { shortDescription: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { in: query.status }
        : query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.level) {
      where.level = query.level;
    }

    const orderBy = { [query.sortBy || "createdAt"]: query.sortOrder || "desc" };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      data: courses,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/instructor/courses
 * Tạo khóa học mới
 */
export const POST = withPermission(
  "courses.create",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

      const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Generate slug from title
    const baseSlug = validatedData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug exists and append number if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        slug,
        instructorId: user.id,
        price: validatedData.price,
        salePrice: validatedData.salePrice || null,
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

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Course",
      entityId: course.id,
      entityName: course.title,
      request,
    });

    return NextResponse.json(
      { data: course, message: "Course created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create course error:", error);
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
});

