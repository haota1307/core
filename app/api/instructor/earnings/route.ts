import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";

/**
 * GET /api/instructor/earnings
 * Lấy thống kê thu nhập của instructor
 */
export const GET = withPermission(
  "earnings.view",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

    // Get instructor's courses
    const courses = await prisma.course.findMany({
      where: {
        instructorId: user.id,
        deletedAt: null,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        rating: true,
        reviewCount: true,
      },
    });

    const courseIds = courses.map((c) => c.id);

    // Calculate total earnings from enrollments
    const enrollmentStats = await prisma.enrollment.aggregate({
      where: {
        courseId: { in: courseIds },
        status: { in: ["ACTIVE", "COMPLETED"] },
        deletedAt: null,
      },
      _sum: {
        pricePaid: true,
      },
      _count: {
        id: true,
      },
    });

    // Get monthly earnings
    const monthlyEarnings = await prisma.instructorEarning.findMany({
      where: {
        instructorId: user.id,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        instructorId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get course titles for transactions
    const transactionCourseIds = recentTransactions
      .filter((t) => t.courseId)
      .map((t) => t.courseId as string);

    const transactionCourses = await prisma.course.findMany({
      where: { id: { in: transactionCourseIds } },
      select: { id: true, title: true },
    });

    const courseMap = new Map(transactionCourses.map((c) => [c.id, c.title]));

    // Calculate average rating
    const totalRating = courses.reduce(
      (sum, c) => sum + Number(c.rating) * c.reviewCount,
      0
    );
    const totalReviews = courses.reduce((sum, c) => sum + c.reviewCount, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Calculate total earnings (assuming 70% instructor share)
    const totalRevenue = Number(enrollmentStats._sum.pricePaid || 0);
    const platformFeeRate = 0.3; // 30% platform fee
    const totalEarnings = totalRevenue * (1 - platformFeeRate);

    return NextResponse.json({
      totalEarnings,
      totalEnrollments: enrollmentStats._count.id,
      totalCourses: courses.length,
      averageRating,
      monthlyEarnings: monthlyEarnings.map((e) => ({
        month: e.month,
        year: e.year,
        totalRevenue: Number(e.totalRevenue),
        platformFee: Number(e.platformFee),
        netEarnings: Number(e.netEarnings),
        enrollmentCount: e.enrollmentCount,
        refundCount: e.refundCount,
        refundAmount: Number(e.refundAmount),
        isPaidOut: e.isPaidOut,
        paidOutAt: e.paidOutAt,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        courseTitle: t.courseId ? courseMap.get(t.courseId) || null : null,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get instructor earnings error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
});

