import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { subDays, format } from "date-fns";

/**
 * GET /api/instructor/analytics
 * Lấy thống kê tổng quan của instructor
 */
export const GET = withPermission(
  "courses.analytics",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

    // Get instructor's courses
    const courses = await prisma.course.findMany({
      where: {
        instructorId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        rating: true,
        reviewCount: true,
        enrollmentCount: true,
        totalLessons: true,
      },
    });

    const courseIds = courses.map((c) => c.id);
    const publishedCourses = courses.filter((c) => c.status === "PUBLISHED");

    // Get enrollment stats
    const enrollmentStats = await prisma.enrollment.aggregate({
      where: {
        courseId: { in: courseIds },
        deletedAt: null,
      },
      _sum: {
        pricePaid: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate average rating
    const totalRating = courses.reduce(
      (sum, c) => sum + Number(c.rating) * c.reviewCount,
      0
    );
    const totalReviews = courses.reduce((sum, c) => sum + c.reviewCount, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Get course stats with completion rate
    const courseStats = await Promise.all(
      publishedCourses.map(async (course) => {
        const enrollments = await prisma.enrollment.findMany({
          where: {
            courseId: course.id,
            deletedAt: null,
          },
          select: {
            pricePaid: true,
            status: true,
          },
        });

        const revenue = enrollments.reduce(
          (sum, e) => sum + Number(e.pricePaid),
          0
        );
        const completedCount = enrollments.filter(
          (e) => e.status === "COMPLETED"
        ).length;
        const completionRate =
          enrollments.length > 0
            ? Math.round((completedCount / enrollments.length) * 100)
            : 0;

        return {
          courseId: course.id,
          title: course.title,
          enrollmentCount: course.enrollmentCount,
          revenue,
          rating: Number(course.rating),
          completionRate,
        };
      })
    );

    // Get enrollment trend (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const enrollmentsByDay = await prisma.enrollment.groupBy({
      by: ["enrolledAt"],
      where: {
        courseId: { in: courseIds },
        enrolledAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    // Format enrollment trend data
    const enrollmentTrendMap = new Map<string, number>();
    enrollmentsByDay.forEach((item) => {
      const date = format(new Date(item.enrolledAt), "dd/MM");
      enrollmentTrendMap.set(
        date,
        (enrollmentTrendMap.get(date) || 0) + item._count.id
      );
    });

    const enrollmentTrend = Array.from(enrollmentTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-30);

    // Get revenue trend (last 12 months) from monthly earnings
    const monthlyEarnings = await prisma.instructorEarning.findMany({
      where: {
        instructorId: user.id,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    const revenueTrend = monthlyEarnings
      .reverse()
      .map((e) => ({
        date: `${e.month}/${e.year}`,
        amount: Number(e.totalRevenue),
      }));

    return NextResponse.json({
      overview: {
        totalCourses: courses.length,
        totalStudents: enrollmentStats._count.id,
        totalRevenue: Number(enrollmentStats._sum.pricePaid || 0),
        averageRating,
      },
      courseStats: courseStats.sort((a, b) => b.revenue - a.revenue),
      enrollmentTrend,
      revenueTrend,
    });
  } catch (error) {
    console.error("Get instructor analytics error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
});

