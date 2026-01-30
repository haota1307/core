"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";
import { EnrolledCoursesDataTable } from "@/features/student/components/enrolled-courses-table/enrolled-courses-data-table";
import { createColumns } from "@/features/student/components/enrolled-courses-table/columns";
import { useEnrollments } from "@/features/student/hooks/use-student";
import { EnrolledCourseResponse } from "@/features/student/schemas";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";

const MyCoursesPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.enrolled");
  const tCommon = useTranslations("common");
  const t = useTranslations("student.enrolledCourses");
  const tTable = useTranslations("student.enrolledCourses.table");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
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

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch enrollments with React Query
  const { data, isLoading } = useEnrollments(
    {
      page,
      limit: 10,
      search,
      status:
        statusFilter.length > 0
          ? statusFilter.length === 1
            ? (statusFilter[0] as "ACTIVE" | "COMPLETED" | "EXPIRED" | "REFUNDED")
            : (statusFilter as ("ACTIVE" | "COMPLETED" | "EXPIRED" | "REFUNDED")[])
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
    onView: (course) =>
      router.push(`/${locale}/courses/${course.slug}`),
    onContinue: (course) =>
      router.push(`/${locale}/courses/${course.slug}/learn`),
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
      </div>

      {/* Data Table */}
      <EnrolledCoursesDataTable
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
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
};

export default MyCoursesPage;
