"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getCategoriesAction,
  getAllCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "../actions";
import { GetCategoriesQuery, CreateCategoryInput, UpdateCategoryInput } from "../schemas";

// ==================== QUERY KEYS ====================

export const categoryKeys = {
  all: ["admin", "categories"] as const,
  list: (query: GetCategoriesQuery) => [...categoryKeys.all, "list", query] as const,
  allList: () => [...categoryKeys.all, "all"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
};

// ==================== HOOKS ====================

/**
 * Hook lấy danh sách danh mục (có phân trang)
 */
export function useCategories(
  query: GetCategoriesQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: categoryKeys.list(query),
    queryFn: async () => {
      const result = await getCategoriesAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook lấy tất cả danh mục (không phân trang)
 */
export function useAllCategories() {
  return useQuery({
    queryKey: categoryKeys.allList(),
    queryFn: async () => {
      const result = await getAllCategoriesAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook tạo danh mục
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.categories.messages");

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await createCategoryAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(t("created"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("error"));
    },
  });
}

/**
 * Hook cập nhật danh mục
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.categories.messages");

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCategoryInput }) => {
      const result = await updateCategoryAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(t("updated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("error"));
    },
  });
}

/**
 * Hook xóa danh mục
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.categories.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(t("deleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("error"));
    },
  });
}

