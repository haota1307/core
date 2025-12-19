"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getAuditLogsAction,
  getAuditLogAction,
  getAuditLogStatsAction,
  deleteOldAuditLogsAction,
} from "../actions";
import { GetAuditLogsQuery } from "../schemas";

// Query keys
export const auditLogKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all, "list"] as const,
  list: (query: GetAuditLogsQuery) => [...auditLogKeys.lists(), query] as const,
  details: () => [...auditLogKeys.all, "detail"] as const,
  detail: (id: string) => [...auditLogKeys.details(), id] as const,
  stats: () => [...auditLogKeys.all, "stats"] as const,
};

/**
 * Hook lấy danh sách audit logs với phân trang
 */
export function useAuditLogs(
  query: GetAuditLogsQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: auditLogKeys.list(query),
    queryFn: async () => {
      const result = await getAuditLogsAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook lấy chi tiết audit log
 */
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: async () => {
      const result = await getAuditLogAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook lấy thống kê audit logs
 */
export function useAuditLogStats() {
  return useQuery({
    queryKey: auditLogKeys.stats(),
    queryFn: async () => {
      const result = await getAuditLogStatsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook xóa audit logs cũ
 */
export function useDeleteOldAuditLogs() {
  const queryClient = useQueryClient();
  const t = useTranslations("auditLogs.messages");

  return useMutation({
    mutationFn: async (olderThanDays: number) => {
      const result = await deleteOldAuditLogsAction(olderThanDays);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogKeys.stats() });
      toast.success(t("cleanupSuccess", { count: result.deletedCount }));
    },
    onError: () => {
      toast.error(t("cleanupError"));
    },
  });
}

