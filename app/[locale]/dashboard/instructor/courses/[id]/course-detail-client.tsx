"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CourseForm } from "@/features/instructor/components";
import {
  useCourse,
  useUpdateCourse,
  useSubmitCourseForReview,
  useDuplicateCourse,
} from "@/features/instructor/hooks/use-instructor";
import { UpdateCourseInput } from "@/features/instructor/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  BookOpen,
  Settings,
  BarChart,
  Send,
  Eye,
  Copy,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface CourseDetailClientProps {
  courseId: string;
}

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("instructor.courses");
  const tCommon = useTranslations("common");

  const { data: course, isLoading, error } = useCourse(courseId);
  const updateMutation = useUpdateCourse(courseId);
  const submitMutation = useSubmitCourseForReview();
  const duplicateMutation = useDuplicateCourse();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleSubmit = async (data: UpdateCourseInput) => {
    await updateMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/instructor/courses`);
  };

  const handleSubmitForReview = async () => {
    await submitMutation.mutateAsync(courseId);
    setShowSubmitDialog(false);
  };

  const handleDuplicate = async () => {
    const result = await duplicateMutation.mutateAsync(courseId);
    if (result.data?.id) {
      router.push(`/${locale}/dashboard/instructor/courses/${result.data.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "secondary",
      PENDING_REVIEW: "outline",
      PUBLISHED: "default",
      REJECTED: "destructive",
      ARCHIVED: "secondary",
    };
    const labels: Record<string, string> = {
      DRAFT: t("statuses.draft"),
      PENDING_REVIEW: t("statuses.pendingReview"),
      PUBLISHED: t("statuses.published"),
      REJECTED: t("statuses.rejected"),
      ARCHIVED: t("statuses.archived"),
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const canSubmitForReview =
    course?.status === "DRAFT" || course?.status === "REJECTED";

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
        <Skeleton className="h-[600px] w-full" />
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
            <p className="text-muted-foreground">{t("courseNotFound")}</p>
            <Button className="mt-4" onClick={handleCancel}>
              {t("backToCourses")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {course.title}
              </h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="text-muted-foreground">{t("editDescription")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/preview`}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("previewCourse")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={duplicateMutation.isPending}
          >
            {duplicateMutation.isPending ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {t("duplicateCourse")}
          </Button>
          {course.status === "PUBLISHED" && (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/courses/${course.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                {t("viewPublished")}
              </Link>
            </Button>
          )}
          {canSubmitForReview && (
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              {t("submitForReview")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("tabDetails")}
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
              {t("tabContent")}
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
              {t("tabStudents")}
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2"
            asChild
          >
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/analytics`}
            >
              <BarChart className="h-4 w-4" />
              {t("tabAnalytics")}
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{t("courseDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseForm
                course={course}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit for Review Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("submitForReviewTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("submitForReviewDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitForReview}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {t("submitForReview")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
