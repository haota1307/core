"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getRolesAction,
  getRoleAction,
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  updateRolePermissionsAction,
  getPermissionsAction,
  createPermissionAction,
  updatePermissionAction,
  deletePermissionAction,
} from "../actions";
import {
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  GetRolesQuery,
  GetPermissionsQuery,
} from "../schemas";

// Query keys
export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (query: GetRolesQuery) => [...roleKeys.lists(), query] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  permissions: () => ["permissions"] as const,
  permissionsList: (query: GetPermissionsQuery) =>
    [...roleKeys.permissions(), "list", query] as const,
  permissionDetail: (id: string) =>
    [...roleKeys.permissions(), "detail", id] as const,
};

/**
 * Hook lấy danh sách roles
 */
export function useRoles(
  query: GetRolesQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: roleKeys.list(query),
    queryFn: async () => {
      const result = await getRolesAction(query);
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
 * Hook lấy chi tiết role
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const result = await getRoleAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook tạo role mới
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  const t = useTranslations("roles.messages");

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const result = await createRoleAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success(t("createSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("createError"));
    },
  });
}

/**
 * Hook cập nhật role
 */
export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("roles.messages");

  return useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      const result = await updateRoleAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success(t("updateSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("updateError"));
    },
  });
}

/**
 * Hook xóa role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  const t = useTranslations("roles.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRoleAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success(t("deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("deleteError"));
    },
  });
}

/**
 * Hook cập nhật permissions của role
 */
export function useUpdateRolePermissions(roleId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("roles.messages");

  return useMutation({
    mutationFn: async (input: UpdateRolePermissionsInput) => {
      const result = await updateRolePermissionsAction(roleId, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
      toast.success(t("permissionsUpdateSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("permissionsUpdateError"));
    },
  });
}

/**
 * Hook lấy danh sách permissions
 */
export function usePermissions(
  query: GetPermissionsQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: roleKeys.permissionsList(query),
    queryFn: async () => {
      const result = await getPermissionsAction(query);
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
 * Hook tạo permission mới
 */
export function useCreatePermission() {
  const queryClient = useQueryClient();
  const t = useTranslations("permissions.messages");

  return useMutation({
    mutationFn: async (input: CreatePermissionInput) => {
      const result = await createPermissionAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permissions() });
      toast.success(t("createSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("createError"));
    },
  });
}

/**
 * Hook cập nhật permission
 */
export function useUpdatePermission(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("permissions.messages");

  return useMutation({
    mutationFn: async (input: UpdatePermissionInput) => {
      const result = await updatePermissionAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permissions() });
      toast.success(t("updateSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("updateError"));
    },
  });
}

/**
 * Hook xóa permission
 */
export function useDeletePermission() {
  const queryClient = useQueryClient();
  const t = useTranslations("permissions.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePermissionAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permissions() });
      toast.success(t("deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("deleteError"));
    },
  });
}
