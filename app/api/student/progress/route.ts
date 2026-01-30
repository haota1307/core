import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getProgressQuerySchema } from "@/features/student/schemas";

/**
 * GET /api/student/progress
 * Lấy tiến độ học tập chi tiết
 */
export const GET = withPermission(
  "courses.enrolled",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

      const searchParams = request.nextUrl.searchParams;
      const query = getProgressQuerySchema.parse({
        courseId: searchParams.get("courseId") || undefined,
        enrollmentId: searchParams.get("enrollmentId") || undefined,
      });

      // Build where clause
      const where: Record<string, unknown> = {
        userId: user.id,
        deletedAt: null,
      };

      if (query.enrollmentId) {
        where.id = query.enrollmentId;
      } else if (query.courseId) {
        where.courseId = query.courseId;
      }

      const enrollments = await prisma.enrollment.findMany({
        where,
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
              sections: {
                orderBy: { sortOrder: "asc" },
                include: {
                  lessons: {
                    orderBy: { sortOrder: "asc" },
                    select: {
                      id: true,
                      title: true,
                      type: true,
                      videoDuration: true,
                      isFree: true,
                    },
                  },
                },
              },
            },
          },
          lessonProgress: {
            select: {
              lessonId: true,
              isCompleted: true,
              watchedTime: true,
              completedAt: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      });

      if (enrollments.length === 0) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "No enrollment found" },
          { status: 404 }
        );
      }

      // Transform data for each enrollment
      const progressData = enrollments.map((enrollment) => {
        const course = enrollment.course;
        const progressMap = new Map(
          enrollment.lessonProgress.map((lp) => [
            lp.lessonId,
            {
              isCompleted: lp.isCompleted,
              watchedTime: lp.watchedTime,
              completedAt: lp.completedAt,
            },
          ])
        );

        let totalLessons = 0;
        let completedLessons = 0;
        let totalDuration = 0;
        let watchedDuration = 0;

        const sections = course.sections.map((section) => {
          const lessons = section.lessons.map((lesson) => {
            totalLessons++;
            totalDuration += lesson.videoDuration || 0;

            const progress = progressMap.get(lesson.id);
            if (progress) {
              if (progress.isCompleted) completedLessons++;
              watchedDuration += progress.watchedTime;
            }

            return {
              id: lesson.id,
              title: lesson.title,
              type: lesson.type,
              duration: lesson.videoDuration || 0,
              isFree: lesson.isFree,
              isCompleted: progress?.isCompleted || false,
              watchedTime: progress?.watchedTime || 0,
              completedAt: progress?.completedAt || null,
            };
          });

          return {
            id: section.id,
            title: section.title,
            sortOrder: section.sortOrder,
            lessons,
          };
        });

        const overallProgress =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        return {
          enrollmentId: enrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          overallProgress: Math.round(overallProgress),
          totalLessons,
          completedLessons,
          totalDuration,
          watchedDuration,
          sections,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.updatedAt,
        };
      });

      // If specific enrollment requested, return single item
      if (query.enrollmentId || query.courseId) {
        return NextResponse.json({ data: progressData[0] });
      }

      // Otherwise return all
      return NextResponse.json({ data: progressData });
    } catch (error) {
      console.error("Get student progress error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
