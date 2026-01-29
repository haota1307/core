import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getAdminCoursesQuerySchema } from "@/features/admin/courses/schemas";

/**
 * GET /api/admin/courses
 * Lấy danh sách tất cả khóa học (Admin)
 */
export const GET = withPermission(
  "courses.manage_all",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = getAdminCoursesQuerySchema.parse({
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
        search: searchParams.get("search") || undefined,
        status: searchParams.getAll("status").length > 0
          ? searchParams.getAll("status")
          : undefined,
        categoryId: searchParams.get("categoryId") || undefined,
        level: searchParams.get("level") || undefined,
        instructorId: searchParams.get("instructorId") || undefined,
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
      });

      const skip = (query.page - 1) * query.limit;

      // Build where clause
      const where: Record<string, unknown> = {
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

      if (query.instructorId) {
        where.instructorId = query.instructorId;
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
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
      console.error("Get admin courses error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

