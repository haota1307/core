"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCourse } from "@/features/instructor/hooks/use-instructor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  BarChart3,
  Settings,
  BookOpen,
  BarChart,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface CourseAnalyticsClientProps {
  courseId: string;
}

export function CourseAnalyticsClient({
  courseId,
}: CourseAnalyticsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("instructor.analytics");
  const tCourses = useTranslations("instructor.courses");
  const tCommon = useTranslations("common");

  const { data: course, isLoading, error } = useCourse(courseId);

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/instructor/courses`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {tCommon("error")}
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {tCourses("courseNotFound")}
            </p>
            <Button className="mt-4" onClick={handleCancel}>
              {tCourses("backToCourses")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration - in real app, fetch from API
  const analyticsData = {
    totalEnrollments: course.enrollmentCount || 0,
    totalRevenue: (course.enrollmentCount || 0) * (course.price || 0),
    averageRating: Number(course.rating) || 0,
    completionRate: 45, // Mock
    recentEnrollments: [
      { date: "2026-01-25", count: 5 },
      { date: "2026-01-26", count: 8 },
      { date: "2026-01-27", count: 3 },
      { date: "2026-01-28", count: 12 },
      { date: "2026-01-29", count: 7 },
      { date: "2026-01-30", count: 10 },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: course.currency || "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="details"
            className="flex items-center gap-2"
            asChild
          >
            <Link href={`/${locale}/dashboard/instructor/courses/${courseId}`}>
              <Settings className="h-4 w-4" />
              {tCourses("tabDetails")}
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="flex items-center gap-2"
            asChild
          >
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/content`}
            >
              <BookOpen className="h-4 w-4" />
              {tCourses("tabContent")}
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="flex items-center gap-2"
            asChild
          >
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/students`}
            >
              <Users className="h-4 w-4" />
              {tCourses("tabStudents")}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            {tCourses("tabAnalytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalStudents")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.totalEnrollments}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% {t("fromLastMonth")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalRevenue")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8% {t("fromLastMonth")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("averageRating")}
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.averageRating
                    ? analyticsData.averageRating.toFixed(1)
                    : "0.0"}{" "}
                  / 5
                </div>
                <p className="text-xs text-muted-foreground">
                  {course.reviewCount || 0} {t("reviews")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("completionRate")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.completionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +5% {t("fromLastMonth")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("enrollmentTrend")}
              </CardTitle>
              <CardDescription>
                {t("enrollmentTrendDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {analyticsData.recentEnrollments.map((item, index) => {
                  const maxCount = Math.max(
                    ...analyticsData.recentEnrollments.map((e) => e.count),
                  );
                  const height =
                    maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="w-full flex flex-col items-center">
                        <span className="text-sm font-medium mb-1">
                          {item.count}
                        </span>
                        <div
                          className="w-full bg-primary rounded-t-md transition-all duration-300"
                          style={{
                            height: `${Math.max(height, 10)}%`,
                            minHeight: "20px",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString(
                          locale === "vi" ? "vi-VN" : "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Course Performance Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("coursePerformance")}</CardTitle>
                <CardDescription>
                  {t("coursePerformanceDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("totalLessons")}
                    </span>
                    <span className="font-medium">
                      {course.totalLessons || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("totalSections")}
                    </span>
                    <span className="font-medium">
                      {course.totalSections || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("totalDuration")}
                    </span>
                    <span className="font-medium">
                      {Math.round((course.totalDuration || 0) / 60)}{" "}
                      {t("minutes")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("courseStatus")}
                    </span>
                    <span className="font-medium capitalize">
                      {course.status?.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("recentActivity")}</CardTitle>
                <CardDescription>
                  {t("recentActivityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.totalEnrollments > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">
                        {t("newEnrollmentToday", { count: 3 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm">
                        {t("lessonsCompletedToday", { count: 15 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-sm">
                        {t("newReviewsThisWeek", { count: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>{t("noData")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
