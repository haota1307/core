"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { http } from "@/lib/http";

// Query keys
export const folderKeys = {
  all: ["folders"] as const,
  lists: () => [...folderKeys.all, "list"] as const,
  list: (parentId?: string | null) =>
    [...folderKeys.lists(), parentId ?? "all"] as const,
  details: () => [...folderKeys.all, "detail"] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
};

// Get folders list
export function useFolders(query?: { parentId?: string | null }) {
  return useQuery({
    queryKey: folderKeys.list(query?.parentId),
    queryFn: async () => {
      const params = new URLSearchParams();
      // Only add parentId if explicitly provided (not undefined)
      if (query?.parentId !== undefined) {
        if (query.parentId === null) {
          params.append("parentId", "");
        } else {
          params.append("parentId", query.parentId);
        }
      }

      const response = await http.get<{ data: any[] }>(
        `/api/media/folders${params.toString() ? `?${params.toString()}` : ""}`
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

// Get folder detail
export function useFolderDetail(id: string) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: async () => {
      const response = await http.get<{ data: any }>(
        `/api/media/folders/${id}`
      );
      return response;
    },
    enabled: !!id,
  });
}

// Create folder
export function useCreateFolder() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.folder");

  return useMutation({
    mutationFn: async (data: { name: string; parentId?: string }) => {
      const response = await http.post<{ data: any }>(
        "/api/media/folders",
        data
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: folderKeys.list(variables.parentId),
      });
      toast.success(t("createSuccess") || "Folder created successfully");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("createError") || "Failed to create folder"
      );
    },
  });
}

// Update folder
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.folder");

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await http.patch<{ data: any }>(
        `/api/media/folders/${id}`,
        { name }
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: folderKeys.detail(variables.id),
      });
      toast.success(t("updateSuccess") || "Folder updated successfully");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("updateError") || "Failed to update folder"
      );
    },
  });
}

// Delete folder
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.folder");

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await http.delete<{ success: boolean }>(
        `/api/media/folders/${id}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
      // Also invalidate media queries as media might have moved
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success(t("deleteSuccess") || "Folder deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("deleteError") || "Failed to delete folder"
      );
    },
  });
}

// Move folder
export function useMoveFolder() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.folder");

  return useMutation({
    mutationFn: async ({
      id,
      parentId,
    }: {
      id: string;
      parentId: string | null;
    }) => {
      const response = await http.patch<{ data: any }>(
        `/api/media/folders/${id}/move`,
        { parentId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
      toast.success(t("moveSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("moveError"));
    },
  });
}
