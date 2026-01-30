import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getCertificatesQuerySchema } from "@/features/student/schemas";

/**
 * GET /api/student/certificates
 * Lấy danh sách chứng chỉ của học viên
 * Note: Hiện tại chưa có model Certificate trong schema, sẽ trả về dựa trên enrollments completed
 */
export const GET = withPermission(
  "certificates.view",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

      const searchParams = request.nextUrl.searchParams;
      const query = getCertificatesQuerySchema.parse({
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
        search: searchParams.get("search") || undefined,
        courseId: searchParams.get("courseId") || undefined,
        sortBy: searchParams.get("sortBy") || "completedAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
      });

      const skip = (query.page - 1) * query.limit;

      // Build where clause - only completed enrollments
      const where: Record<string, unknown> = {
        userId: user.id,
        status: "COMPLETED",
        completedAt: { not: null },
        deletedAt: null,
      };

      if (query.courseId) {
        where.courseId = query.courseId;
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
      orderBy[query.sortBy || "completedAt"] = query.sortOrder || "desc";

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
              },
            },
          },
        }),
        prisma.enrollment.count({ where }),
      ]);

      // Transform to certificate format
      const certificates = enrollments.map((enrollment, index) => {
        const course = enrollment.course;
        // Generate certificate number (can be improved with actual certificate system)
        const certificateNumber = `CERT-${course.id.slice(0, 8).toUpperCase()}-${enrollment.id.slice(0, 8).toUpperCase()}`;

        return {
          id: enrollment.id, // Using enrollment ID as certificate ID for now
          courseId: course.id,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          instructorName: course.instructor.name,
          issuedAt: enrollment.completedAt!,
          certificateUrl: null, // Will be generated when certificate system is implemented
          certificateNumber,
        };
      });

      return NextResponse.json({
        data: certificates,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      console.error("Get student certificates error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
