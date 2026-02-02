"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCourse,
  useInstructorStudents,
} from "@/features/instructor/hooks/use-instructor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Users,
  Settings,
  BookOpen,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface CourseStudentsClientProps {
  courseId: string;
  locale: string;
}

export function CourseStudentsClient({
  courseId,
  locale,
}: CourseStudentsClientProps) {
  const router = useRouter();
  const t = useTranslations("instructor.courseStudents");
  const tCourses = useTranslations("instructor.courses");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "ACTIVE" | "COMPLETED" | "EXPIRED" | "REFUNDED" | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: studentsData, isLoading: studentsLoading } =
    useInstructorStudents({
      page,
      limit,
      search: search || undefined,
      courseId,
      status: status || undefined,
      sortBy: "enrolledAt",
      sortOrder: "desc",
    });

  const handleBack = () => {
    router.push(`/${locale}/dashboard/instructor/courses`);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
      EXPIRED: "outline",
    };
    const labels: Record<string, string> = {
      ACTIVE: t("statuses.active"),
      COMPLETED: t("statuses.completed"),
      CANCELLED: t("statuses.cancelled"),
      EXPIRED: t("statuses.expired"),
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const isLoading = courseLoading || studentsLoading;
  const students = studentsData?.data || [];
  const meta = studentsData?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  if (courseLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
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
            <p className="text-muted-foreground">
              {tCourses("courseNotFound")}
            </p>
            <Button className="mt-4" onClick={handleBack}>
              {tCourses("backToCourses")}
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
          <Button variant="ghost" size="icon" onClick={handleBack}>
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
      <Tabs defaultValue="students" className="space-y-6">
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
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("tabStudents")}
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
              {tCourses("tabAnalytics")}
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{meta.total}</div>
                <p className="text-sm text-muted-foreground">
                  {t("totalStudents")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {students.filter((s) => s.status === "ACTIVE").length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("activeStudents")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {students.filter((s) => s.status === "COMPLETED").length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("completedStudents")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {Math.round(
                    students.reduce((acc, s) => acc + (s.progress || 0), 0) /
                      (students.length || 1),
                  )}
                  %
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("averageProgress")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("studentsList")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={status || "all"}
                  onValueChange={(v) => {
                    setStatus(
                      v === "all"
                        ? undefined
                        : (v as
                            | "ACTIVE"
                            | "COMPLETED"
                            | "EXPIRED"
                            | "REFUNDED"),
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="ACTIVE">
                      {t("statuses.active")}
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      {t("statuses.completed")}
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      {t("statuses.cancelled")}
                    </SelectItem>
                    <SelectItem value="EXPIRED">
                      {t("statuses.expired")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {studentsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("noStudents")}</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("student")}</TableHead>
                        <TableHead>{t("enrolledAt")}</TableHead>
                        <TableHead>{t("progress")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={student.image || undefined}
                                  alt={student.name || "Student"}
                                />
                                <AvatarFallback>
                                  {student.name?.charAt(0).toUpperCase() || "S"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {student.name || t("unknownStudent")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(student.enrolledAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${student.progress || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm">
                                {student.progress || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <DataTablePagination
                    currentPage={page}
                    totalPages={meta.totalPages}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
