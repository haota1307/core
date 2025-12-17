"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionDataTable } from "@/features/role/components/permission-table/permission-data-table";
import { createPermissionColumns } from "@/features/role/components/permission-table/columns";
import { PermissionDialog } from "@/features/role/components/permission-dialog";
import { PermissionDeleteDialog } from "@/features/role/components/permission-delete-dialog";
import { usePermissions } from "@/features/role/hooks/use-roles";
import { PermissionResponse } from "@/features/role/schemas";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/permission-guard";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import type { SortingState } from "@tanstack/react-table";

const PermissionsPage = () => {
  const t = useTranslations("permissions");
  const tCommon = useTranslations("common");
  const hasViewPermission = useHasPermission("permissions.view");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle sorting changes
  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const newSorting =
      typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(newSorting);
  };

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<PermissionResponse | undefined>();
  const [deletingPermission, setDeletingPermission] =
    useState<PermissionResponse | undefined>();

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch permissions with React Query - chỉ khi có permission
  const { data, isLoading, error } = usePermissions(
    {
      page,
      limit: 10,
      search,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Columns with actions and i18n
  const columns = createPermissionColumns({
    onEdit: (permission) => setEditingPermission(permission),
    onDelete: (permission) => setDeletingPermission(permission),
    t,
  });

  // Check permission
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
        <PermissionGuard permission="permissions.manage">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Button>
        </PermissionGuard>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load permissions"}
        </div>
      )}

      {/* Data Table */}
      <PermissionDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Create/Edit Dialog */}
      <PermissionDialog
        open={isCreateDialogOpen || !!editingPermission}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingPermission(undefined);
          }
        }}
        permission={editingPermission}
      />

      {deletingPermission && (
        <PermissionDeleteDialog
          open={!!deletingPermission}
          onOpenChange={(open) => {
            if (!open) setDeletingPermission(undefined);
          }}
          permission={deletingPermission}
        />
      )}
    </div>
  );
};

export default PermissionsPage;
