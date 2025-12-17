"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getUsersAction,
  getUserAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  getRolesAction,
} from "../actions";
import {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
} from "../schemas";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (query: GetUsersQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  roles: () => ["roles"] as const,
};

/**
 * Hook lấy danh sách users với phân trang
 */
export function useUsers(
  query: GetUsersQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const result = await getUsersAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 1000, // 5 seconds - refetch on filter/sort changes
    enabled: options?.enabled ?? true, // Default true để không break existing code
  });
}

/**
 * Hook lấy chi tiết user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const result = await getUserAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook tạo user mới
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users.messages");

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const result = await createUserAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(data.message || t("createSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("createError"));
    },
  });
}

/**
 * Hook cập nhật user
 */
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("users.messages");

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const result = await updateUserAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      // Invalidate users list and detail
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success(data.message || t("updateSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("updateError"));
    },
  });
}

/**
 * Hook xóa user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteUserAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(data.message || t("deleteSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("deleteError"));
    },
  });
}

/**
 * Hook lấy danh sách roles (cho dropdown)
 */
export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: async () => {
      const result = await getRolesAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

