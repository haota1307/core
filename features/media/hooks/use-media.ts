"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { http } from "@/lib/http";
import {
  getMediaAction,
  getMediaDetailAction,
  updateMediaAction,
  deleteMediaAction,
} from "../actions";
import { GetMediaQuery, MediaResponse, UpdateMediaInput } from "../schemas";
import { folderKeys } from "./use-folders";

// Query keys
export const mediaKeys = {
  all: ["media"] as const,
  lists: () => [...mediaKeys.all, "list"] as const,
  list: (query: GetMediaQuery) => [...mediaKeys.lists(), query] as const,
  details: () => [...mediaKeys.all, "detail"] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

// Get media list
export function useMedia(
  query: GetMediaQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: mediaKeys.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", query.page.toString());
      params.append("limit", query.limit.toString());
      if (query.search) params.append("search", query.search);
      if (query.mimeType) {
        if (Array.isArray(query.mimeType)) {
          query.mimeType.forEach((type) => params.append("mimeType", type));
        } else {
          params.append("mimeType", query.mimeType);
        }
      }
      if (query.folderId !== undefined) {
        params.append("folderId", query.folderId || "");
      }
      params.append("sortBy", query.sortBy);
      params.append("sortOrder", query.sortOrder);

      const response = await http.get<{
        data: MediaResponse[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/api/media?${params.toString()}`);
      return response;
    },
    staleTime: 5 * 1000,
    enabled: options?.enabled ?? true,
  });
}

// Get media detail
export function useMediaDetail(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: async () => {
      const result = await getMediaDetailAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

// Upload media
export function useUploadMedia() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.messages");

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await http.post<{ data: any }>(
        "/api/media/upload",
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch all media queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success(t("uploadSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("uploadError"));
    },
  });
}

// Update media
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.messages");

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMediaInput;
    }) => {
      const response = await http.patch<{ data: MediaResponse }>(
        `/api/media/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: mediaKeys.detail(variables.id),
      });
      toast.success(t("updateSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("updateError"));
    },
  });
}

// Delete media
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
      toast.success(t("deleteSuccess"));
    },
    onError: (error: Error) => {
      if (error.message.includes("in use")) {
        toast.error(t("deleteErrorInUse"));
      } else {
        toast.error(t("deleteError"));
      }
    },
  });
}

// Move media
export function useMoveMedia() {
  const queryClient = useQueryClient();
  const t = useTranslations("media.messages");

  return useMutation({
    mutationFn: async ({
      id,
      folderId,
    }: {
      id: string;
      folderId: string | null;
    }) => {
      await http.patch(`/api/media/${id}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
      toast.success(t("moveSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("moveError"));
    },
  });
}
