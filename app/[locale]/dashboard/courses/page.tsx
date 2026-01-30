"use client";

import { useState } from "react";
import {
  AdminCourseDataTable,
  createAdminCourseColumns,
  AdminCourseResponse,
} from "@/features/admin/courses";
import { useAdminCourses, useDeleteAdminCourse } from "@/features/admin/courses/hooks/use-admin-courses";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";
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

const AdminCoursesPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.manage_all");
  const tCommon = useTranslations("common");
  const t = useTranslations("admin.courses");
  const tTable = useTranslations("admin.courses.table");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // State for delete dialog
  const [deletingCourse, setDeletingCourse] = useState<AdminCourseResponse | null>(null);

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

  // Fetch courses
  const { data, isLoading } = useAdminCourses(
    {
      page,
      limit: 10,
      search,
      status:
        statusFilter.length > 0
          ? statusFilter.length === 1
            ? (statusFilter[0] as any)
            : (statusFilter as any)
          : undefined,
      level:
        levelFilter.length === 1
          ? (levelFilter[0] as any)
          : undefined,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Delete mutation
  const deleteMutation = useDeleteAdminCourse();

  // Columns with actions
  const columns = createAdminCourseColumns(tTable, {
    onView: (course) =>
      router.push(`/${locale}/dashboard/courses/${course.id}`),
    onDelete: (course) => setDeletingCourse(course),
  });

  // Handle delete
  const handleDelete = async () => {
    if (deletingCourse) {
      await deleteMutation.mutateAsync(deletingCourse.id);
      setDeletingCourse(null);
    }
  };

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
      <AdminCourseDataTable
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
      <AlertDialog open={!!deletingCourse} onOpenChange={(open) => !open && setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { title: deletingCourse?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCoursesPage;

