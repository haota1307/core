"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleDataTable } from "@/features/role/components/role-table/role-data-table";
import { createRoleColumns } from "@/features/role/components/role-table/columns";
import { RoleDialog } from "@/features/role/components/role-dialog";
import { RoleDeleteDialog } from "@/features/role/components/role-delete-dialog";
import { RolePermissionsDialog } from "@/features/role/components/role-permissions-dialog";
import { useRoles, useRole } from "@/features/role/hooks/use-roles";
import { RoleResponse, RoleDetailResponse } from "@/features/role/schemas";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/permission-guard";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import type { SortingState } from "@tanstack/react-table";

const RolesPage = () => {
  const t = useTranslations("roles");
  const tCommon = useTranslations("common");
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("roles.view");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isSystemFilter, setIsSystemFilter] = useState<boolean[]>([]);
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | undefined>();
  const [deletingRole, setDeletingRole] = useState<RoleResponse | undefined>();
  const [managingPermissionsRoleId, setManagingPermissionsRoleId] = useState<
    string | undefined
  >();

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch roles with React Query - chỉ khi có permission
  const { data, isLoading, error } = useRoles(
    {
      page,
      limit: 10,
      search,
      isSystem:
        isSystemFilter.length > 0
          ? isSystemFilter.length === 1
            ? isSystemFilter[0]
            : isSystemFilter
          : undefined,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Fetch role detail when managing permissions
  const { data: roleDetail } = useRole(managingPermissionsRoleId || "");

  // Columns with actions and i18n
  const columns = createRoleColumns({
    onEdit: (role) => setEditingRole(role),
    onDelete: (role) => setDeletingRole(role),
    onManagePermissions: (role) => {
      setManagingPermissionsRoleId(role.id);
    },
    t,
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
        <PermissionGuard permission="roles.create">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Button>
        </PermissionGuard>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load roles"}
        </div>
      )}

      {/* Data Table */}
      <RoleDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        isSystemFilter={isSystemFilter}
        onIsSystemFilterChange={setIsSystemFilter}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Create/Edit Dialog */}
      <RoleDialog
        open={isCreateDialogOpen || !!editingRole}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRole(undefined);
          }
        }}
        role={editingRole}
      />

      {/* Delete Dialog */}
      {deletingRole && (
        <RoleDeleteDialog
          open={!!deletingRole}
          onOpenChange={(open) => {
            if (!open) setDeletingRole(undefined);
          }}
          role={deletingRole}
        />
      )}

      {/* Manage Permissions Dialog */}
      {roleDetail && (
        <RolePermissionsDialog
          open={!!managingPermissionsRoleId}
          onOpenChange={(open) => {
            if (!open) setManagingPermissionsRoleId(undefined);
          }}
          role={roleDetail}
        />
      )}
    </div>
  );
};

export default RolesPage;
