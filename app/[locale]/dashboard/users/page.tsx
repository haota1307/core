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
import type { SortingState } from "@tanstack/react-table";

const UsersPage = () => {
  const t = useTranslations("users");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle sorting changes
  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(newSorting);
  };

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | undefined>();
  const [deletingUser, setDeletingUser] = useState<UserResponse | undefined>();

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch users with React Query
  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search,
    status: statusFilter[0] as any, // Take first selected status
    roleId: roleFilter[0], // Take first selected role
    sortBy,
    sortOrder,
  });

  // Columns with actions and i18n
  const columns = createColumns({
    onEdit: (user) => setEditingUser(user),
    onDelete: (user) => setDeletingUser(user),
    t,
  });

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
