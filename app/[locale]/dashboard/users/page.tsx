"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDataTable } from "@/features/user/components/user-table/user-data-table";
import { createColumns } from "@/features/user/components/user-table/columns";
import { UserDialog } from "@/features/user/components/user-dialog";
import { UserDeleteDialog } from "@/features/user/components/user-delete-dialog";
import { useUsers } from "@/features/user/hooks/use-users";
import { UserResponse } from "@/features/user/schemas";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import type { SortingState } from "@tanstack/react-table";

const UsersPage = () => {
  const { hasPermission: hasViewPermission, loading: permissionsLoading } = useHasPermission("users.view");
  const tCommon = useTranslations("common");
  const t = useTranslations("users");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
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
  const [editingUser, setEditingUser] = useState<UserResponse | undefined>();
  const [deletingUser, setDeletingUser] = useState<UserResponse | undefined>();

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch users with React Query - chỉ khi có permission
  const { data, isLoading } = useUsers(
    {
      page,
      limit: 10,
      search,
      // Send all selected filters (support multiple values)
      status:
        statusFilter.length > 0
          ? ((statusFilter.length === 1
              ? statusFilter[0]
              : statusFilter) as any)
          : undefined,
      roleId:
        roleFilter.length > 0
          ? roleFilter.length === 1
            ? roleFilter[0]
            : roleFilter
          : undefined,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission, // Chỉ fetch khi có permission
    }
  );

  // Columns with actions and i18n
  const columns = createColumns({
    onEdit: (user) => setEditingUser(user),
    onDelete: (user) => setDeletingUser(user),
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addNew")}
        </Button>
      </div>

      {/* Data Table - No Card wrapper */}
      <UserDataTable
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
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Create/Edit Dialog */}
      <UserDialog
        open={isCreateDialogOpen || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingUser(undefined);
          }
        }}
        user={editingUser}
      />

      {/* Delete Dialog */}
      {deletingUser && (
        <UserDeleteDialog
          open={!!deletingUser}
          onOpenChange={(open) => {
            if (!open) setDeletingUser(undefined);
          }}
          user={deletingUser}
        />
      )}
    </div>
  );
};

export default UsersPage;
