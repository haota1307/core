import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getStudentsQuerySchema } from "@/features/instructor/schemas";

/**
 * GET /api/instructor/students
 * Lấy danh sách học viên của instructor
 */
export const GET = withPermission(
  "students.view_own",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

    const searchParams = request.nextUrl.searchParams;
    const query = getStudentsQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || undefined,
      courseId: searchParams.get("courseId") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || "enrolledAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const skip = (query.page - 1) * query.limit;

    // Get instructor's courses
    const instructorCourses = await prisma.course.findMany({
      where: {
        instructorId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    const courseIds = instructorCourses.map((c) => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page: query.page,
          limit: query.limit,
          totalPages: 0,
        },
      });
    }

    // Build where clause for enrollments
    const where: Record<string, unknown> = {
      courseId: query.courseId ? query.courseId : { in: courseIds },
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const orderBy: Record<string, string> = {};
    if (query.sortBy === "name") {
      orderBy.user = { name: query.sortOrder || "asc" };
    } else {
      orderBy[query.sortBy || "enrolledAt"] = query.sortOrder || "desc";
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    // Transform data
    const students = enrollments.map((enrollment) => ({
      id: enrollment.user.id,
      email: enrollment.user.email,
      name: enrollment.user.name,
      image: enrollment.user.image,
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      status: enrollment.status,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      pricePaid: Number(enrollment.pricePaid),
    }));

    return NextResponse.json({
      data: students,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Get instructor students error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
});

