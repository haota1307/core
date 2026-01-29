"use client";

import { useState } from "react";
import {
  AdminCourseDataTable,
  createAdminCourseColumns,
  AdminCourseResponse,
} from "@/features/admin/courses";
import { usePendingCourses, useReviewCourse } from "@/features/admin/courses/hooks/use-admin-courses";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PendingCoursesPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.approve");
  const tCommon = useTranslations("common");
  const t = useTranslations("admin.courses");
  const tTable = useTranslations("admin.courses.table");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // State for review dialog
  const [reviewingCourse, setReviewingCourse] = useState<AdminCourseResponse | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [rejectReason, setRejectReason] = useState("");

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

  // Fetch pending courses
  const { data, isLoading } = usePendingCourses(
    {
      page,
      limit: 10,
      search,
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

  // Review mutation
  const reviewMutation = useReviewCourse();

  // Columns with actions
  const columns = createAdminCourseColumns(tTable, {
    onView: (course) =>
      router.push(`/${locale}/dashboard/courses/${course.id}`),
    onApprove: (course) => {
      setReviewingCourse(course);
      setReviewAction("approve");
    },
    onReject: (course) => {
      setReviewingCourse(course);
      setReviewAction("reject");
      setRejectReason("");
    },
  });

  // Handle review submit
  const handleReviewSubmit = async () => {
    if (reviewingCourse) {
      await reviewMutation.mutateAsync({
        id: reviewingCourse.id,
        input: {
          action: reviewAction,
          reason: reviewAction === "reject" ? rejectReason : undefined,
        },
      });
      setReviewingCourse(null);
      setRejectReason("");
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
          <h1 className="text-3xl font-bold tracking-tight">{t("pendingTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pendingDescription")}
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
        statusFilter={[]}
        onStatusFilterChange={() => {}}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Review Dialog */}
      <Dialog open={!!reviewingCourse} onOpenChange={(open) => !open && setReviewingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? t("approveDialog.title") : t("rejectDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? t("approveDialog.description", { title: reviewingCourse?.title })
                : t("rejectDialog.description", { title: reviewingCourse?.title })}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">{t("rejectDialog.reasonLabel")}</Label>
              <Textarea
                id="reason"
                placeholder={t("rejectDialog.reasonPlaceholder")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingCourse(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewMutation.isPending}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {reviewAction === "approve" ? t("table.approve") : t("table.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingCoursesPage;

