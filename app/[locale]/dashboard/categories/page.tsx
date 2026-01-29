"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CategoryDataTable,
  createCategoryColumns,
  CategoryDialog,
  CategoryResponse,
} from "@/features/admin/categories";
import { useCategories, useDeleteCategory } from "@/features/admin/categories/hooks/use-categories";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
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

const CategoriesPage = () => {
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("categories.manage");
  const tCommon = useTranslations("common");
  const t = useTranslations("admin.categories");
  const tTable = useTranslations("admin.categories.table");

  // State for pagination and search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // State for dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);

  // Fetch categories
  const { data, isLoading } = useCategories(
    {
      page,
      limit: 10,
      search,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Delete mutation
  const deleteMutation = useDeleteCategory();

  // Columns with actions
  const columns = createCategoryColumns(tTable, {
    onEdit: (category) => {
      setEditingCategory(category);
      setIsDialogOpen(true);
    },
    onDelete: (category) => setDeletingCategory(category),
  });

  // Handle delete
  const handleDelete = async () => {
    if (deletingCategory) {
      await deleteMutation.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
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
        <Button onClick={() => {
          setEditingCategory(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addNew")}
        </Button>
      </div>

      {/* Data Table */}
      <CategoryDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Create/Edit Dialog */}
      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: deletingCategory?.name })}
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

export default CategoriesPage;

