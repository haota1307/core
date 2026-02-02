"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCourse,
  useCourseSections,
} from "@/features/instructor/hooks/use-instructor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Users,
  Star,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Radio,
  Lock,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CoursePreviewClientProps {
  courseId: string;
  locale: string;
}

const lessonTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-4 w-4" />,
  TEXT: <FileText className="h-4 w-4" />,
  QUIZ: <HelpCircle className="h-4 w-4" />,
  ASSIGNMENT: <ClipboardList className="h-4 w-4" />,
  LIVE: <Radio className="h-4 w-4" />,
};

export function CoursePreviewClient({
  courseId,
  locale,
}: CoursePreviewClientProps) {
  const router = useRouter();
  const t = useTranslations("instructor.preview");
  const tCommon = useTranslations("common");

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } =
    useCourseSections(courseId);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleBack = () => {
    router.push(`/${locale}/dashboard/instructor/courses/${courseId}`);
  };

  const isLoading = courseLoading || sectionsLoading;

  // Calculate course stats
  const totalLessons = sections.reduce(
    (acc, s) => acc + (s.lessons?.length || 0),
    0,
  );
  const totalDuration = sections.reduce(
    (acc, s) =>
      acc + (s.lessons?.reduce((a, l) => a + l.videoDuration, 0) || 0),
    0,
  );
  const durationInHours = Math.floor(totalDuration / 3600);
  const durationInMinutes = Math.floor((totalDuration % 3600) / 60);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {tCommon("error")}
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("courseNotFound")}</p>
            <Button className="mt-4" onClick={handleBack}>
              {t("backToEdit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-200 font-medium">
            {t("previewMode")}
          </span>
          <span className="text-amber-600 dark:text-amber-400 text-sm">
            {t("previewModeDescription")}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToEdit")}
        </Button>
      </div>

      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-lg text-muted-foreground">
                  {course.shortDescription}
                </p>
              </div>
              <Badge variant="secondary">{course.level}</Badge>
            </div>

            {/* Instructor - placeholder since we don't have instructor data in CourseResponse */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>I</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{t("instructor")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("instructor")}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {durationInHours > 0 && `${durationInHours}h `}
                  {durationInMinutes}m
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>
                  {totalLessons} {t("lessons")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {course.enrollmentCount || 0} {t("students")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.8 (preview)</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("aboutCourse")}</h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description || "" }}
            />
          </div>

          <Separator />

          {/* Curriculum */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("curriculum")}</h2>
            <p className="text-sm text-muted-foreground">
              {sections.length} {t("sections")} • {totalLessons} {t("lessons")}{" "}
              •{" "}
              {durationInHours > 0
                ? `${durationInHours}h ${durationInMinutes}m`
                : `${durationInMinutes} ${t("minutesTotal")}`}
            </p>

            <div className="space-y-3">
              {sections.map((section, sectionIndex) => (
                <Collapsible
                  key={section.id}
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {t("section")} {sectionIndex + 1}: {section.title}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {section.lessons?.length || 0} {t("lessons")}
                      </span>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t">
                        {section.lessons?.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              {lessonTypeIcons[lesson.type]}
                              <span>
                                {sectionIndex + 1}.{lessonIndex + 1}{" "}
                                {lesson.title}
                              </span>
                              {lesson.isFree ? (
                                <Badge variant="secondary">{t("free")}</Badge>
                              ) : (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            {lesson.videoDuration > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {Math.floor(lesson.videoDuration / 60)}:
                                {(lesson.videoDuration % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Purchase Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-6">
              {/* Price */}
              <div className="space-y-2">
                {course.price === 0 ? (
                  <div className="text-3xl font-bold text-green-600">
                    {t("free")}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      ${(course.salePrice ?? course.price).toFixed(2)}
                    </span>
                    {course.salePrice && course.salePrice < course.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${course.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button className="w-full" size="lg" disabled>
                  {course.price === 0 ? t("enrollNow") : t("buyNow")}
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  {t("addToCart")}
                </Button>
              </div>

              <Separator />

              {/* Course Includes */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t("courseIncludes")}</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    {durationInHours > 0 && `${durationInHours} ${t("hours")} `}
                    {durationInMinutes} {t("minutesOfVideo")}
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {totalLessons} {t("lessons")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {t("lifetimeAccess")}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
