import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getEnrollmentsQuerySchema } from "@/features/student/schemas";

/**
 * GET /api/student/enrollments
 * Lấy danh sách khóa học đã đăng ký của học viên
 */
export const GET = withPermission(
  "courses.enrolled",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

      const searchParams = request.nextUrl.searchParams;
      const query = getEnrollmentsQuerySchema.parse({
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
        search: searchParams.get("search") || undefined,
        status: searchParams.get("status") || undefined,
        sortBy: searchParams.get("sortBy") || "enrolledAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
      });

      const skip = (query.page - 1) * query.limit;

      // Build where clause
      const where: Record<string, unknown> = {
        userId: user.id,
        deletedAt: null,
      };

      if (query.status) {
        where.status = Array.isArray(query.status)
          ? { in: query.status }
          : query.status;
      }

      if (query.search) {
        where.course = {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { shortDescription: { contains: query.search, mode: "insensitive" } },
          ],
          deletedAt: null,
        };
      }

      const orderBy: Record<string, string> = {};
      orderBy[query.sortBy || "enrolledAt"] = query.sortOrder || "desc";

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          skip,
          take: query.limit,
          orderBy,
          include: {
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                sections: {
                  include: {
                    lessons: {
                      select: {
                        id: true,
                        videoDuration: true,
                      },
                    },
                  },
                },
                reviews: {
                  select: {
                    rating: true,
                  },
                },
              },
            },
            lessonProgress: {
              select: {
                lessonId: true,
                isCompleted: true,
                watchedTime: true,
              },
            },
          },
        }),
        prisma.enrollment.count({ where }),
      ]);

      // Transform data
      const enrolledCourses = enrollments.map((enrollment) => {
        const course = enrollment.course;
        const totalLessons = course.sections.reduce(
          (sum, section) => sum + section.lessons.length,
          0
        );
        const completedLessons = enrollment.lessonProgress.filter(
          (lp) => lp.isCompleted
        ).length;
        const totalDuration = course.sections.reduce(
          (sum, section) =>
            sum +
            section.lessons.reduce(
              (lessonSum, lesson) => lessonSum + (lesson.videoDuration || 0),
              0
            ),
          0
        );
        const watchedDuration = enrollment.lessonProgress.reduce(
          (sum, lp) => sum + lp.watchedTime,
          0
        );

        const ratings = course.reviews.map((r) => r.rating);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        return {
          id: course.id,
          enrollmentId: enrollment.id,
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          shortDescription: course.shortDescription,
          instructor: {
            id: course.instructor.id,
            name: course.instructor.name,
            email: course.instructor.email,
          },
          category: course.category
            ? {
                id: course.category.id,
                name: course.category.name,
                slug: course.category.slug,
              }
            : null,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          expiresAt: enrollment.expiresAt,
          pricePaid: Number(enrollment.pricePaid),
          currency: enrollment.currency,
          totalLessons,
          completedLessons,
          totalDuration,
          watchedDuration,
          rating: averageRating,
          reviewCount: course.reviews.length,
        };
      });

      return NextResponse.json({
        data: enrolledCourses,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      console.error("Get student enrollments error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
