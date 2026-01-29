"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseDataTable } from "@/features/instructor/components/course-table/course-data-table";
import { createColumns } from "@/features/instructor/components/course-table/columns";
import { CourseDeleteDialog } from "@/features/instructor/components/course-delete-dialog";
import { useInstructorCourses } from "@/features/instructor/hooks/use-instructor";
import { CourseResponse } from "@/features/instructor/schemas";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";

const InstructorCoursesPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.manage_own");
  const tCommon = useTranslations("common");
  const t = useTranslations("instructor.courses");
  const tTable = useTranslations("instructor.courseTable");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle sorting changes
  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  // State for dialogs
  const [deletingCourse, setDeletingCourse] = useState<CourseResponse | null>(
    null
  );

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch courses with React Query
  const { data, isLoading } = useInstructorCourses(
    {
      page,
      limit: 10,
      search,
      status:
        statusFilter.length > 0
          ? statusFilter.length === 1
            ? (statusFilter[0] as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED")
            : (statusFilter as ("DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED")[])
          : undefined,
      level:
        levelFilter.length === 1
          ? (levelFilter[0] as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS")
          : undefined,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Columns with actions
  const columns = createColumns(tTable, {
    onEdit: (course) =>
      router.push(`/${locale}/dashboard/instructor/courses/${course.id}/edit`),
    onDelete: (course) => setDeletingCourse(course),
    onView: (course) =>
      router.push(`/${locale}/dashboard/instructor/courses/${course.id}`),
    onManageCurriculum: (course) =>
      router.push(
        `/${locale}/dashboard/instructor/courses/${course.id}/curriculum`
      ),
  });

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
        <Button
          onClick={() =>
            router.push(`/${locale}/dashboard/instructor/courses/create`)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createTitle")}
        </Button>
      </div>

      {/* Data Table */}
      <CourseDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Delete Dialog */}
      <CourseDeleteDialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
        course={deletingCourse}
      />
    </div>
  );
};

export default InstructorCoursesPage;
