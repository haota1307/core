"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { useEnrollments, useProgress } from "@/features/student/hooks/use-student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LearningProgressPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.enrolled");
  const tCommon = useTranslations("common");
  const t = useTranslations("student.progress");

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");

  // Fetch enrollments for dropdown
  const { data: enrollmentsData } = useEnrollments(
    {
      page: 1,
      limit: 100,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Fetch progress for selected enrollment
  const { data: progressData, isLoading: progressLoading } = useProgress(
    {
      enrollmentId: selectedEnrollmentId,
    },
    {
      enabled: hasViewPermission && !!selectedEnrollmentId,
    }
  );

  // Check permission
  if (permissionsLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{tCommon("accessDenied")}</h2>
          <p className="text-muted-foreground mt-2">
            {tCommon("noPermission")}
          </p>
        </div>
      </div>
    );
  }

  const enrollments = enrollmentsData?.data || [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Course Selector */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectCourse")}</CardTitle>
            <CardDescription>{t("selectCourseDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedEnrollmentId}
              onValueChange={setSelectedEnrollmentId}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder={t("selectCoursePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {enrollments.map((enrollment) => (
                  <SelectItem key={enrollment.enrollmentId} value={enrollment.enrollmentId}>
                    {enrollment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Progress Details */}
      {selectedEnrollmentId && (
        <>
          {progressLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : progressData ? (
            <>
              {/* Overall Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{progressData.courseTitle}</CardTitle>
                  <CardDescription>
                    {t("overallProgress")}: {progressData.overallProgress}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{t("progress")}</span>
                      <span className="font-medium">
                        {progressData.completedLessons} / {progressData.totalLessons}{" "}
                        {t("lessons")}
                      </span>
                    </div>
                    <Progress value={progressData.overallProgress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("totalDuration")}:</span>
                      <span className="ml-2 font-medium">
                        {Math.floor(progressData.totalDuration / 60)} {t("minutes")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("watchedDuration")}:</span>
                      <span className="ml-2 font-medium">
                        {Math.floor(progressData.watchedDuration / 60)} {t("minutes")}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      router.push(`/${locale}/courses/${progressData.courseId}/learn`)
                    }
                    className="w-full"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t("continueLearning")}
                  </Button>
                </CardContent>
              </Card>

              {/* Sections and Lessons */}
              <div className="space-y-4">
                {progressData.sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {section.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                  lesson.isCompleted
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {lesson.isCompleted ? (
                                  <span className="text-sm">✓</span>
                                ) : (
                                  <BookOpen className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {t("lessonTypes." + lesson.type.toLowerCase())} •{" "}
                                  {Math.floor(lesson.duration / 60)} {t("minutes")}
                                  {lesson.isFree && (
                                    <span className="ml-2 text-primary">
                                      • {t("free")}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/${locale}/courses/${progressData.courseId}/learn/${lesson.id}`
                                )
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {lesson.isCompleted ? t("review") : t("start")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t("noProgress")}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedEnrollmentId && enrollments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noEnrollments")}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LearningProgressPage;
