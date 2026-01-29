"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getAdminCoursesAction,
  getPendingCoursesAction,
  reviewCourseAction,
  deleteAdminCourseAction,
} from "../actions";
import { GetAdminCoursesQuery, ReviewCourseInput } from "../schemas";

// ==================== QUERY KEYS ====================

export const adminCourseKeys = {
  all: ["admin", "courses"] as const,
  list: (query: GetAdminCoursesQuery) => [...adminCourseKeys.all, "list", query] as const,
  pending: (query: Omit<GetAdminCoursesQuery, "status">) => [...adminCourseKeys.all, "pending", query] as const,
  detail: (id: string) => [...adminCourseKeys.all, "detail", id] as const,
};

// ==================== HOOKS ====================

/**
 * Hook lấy danh sách tất cả khóa học (Admin)
 */
export function useAdminCourses(
  query: GetAdminCoursesQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: adminCourseKeys.list(query),
    queryFn: async () => {
      const result = await getAdminCoursesAction(query);
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
 * Hook lấy danh sách khóa học chờ duyệt
 */
export function usePendingCourses(
  query: Omit<GetAdminCoursesQuery, "status">,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: adminCourseKeys.pending(query),
    queryFn: async () => {
      const result = await getPendingCoursesAction(query);
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
 * Hook duyệt/từ chối khóa học
 */
export function useReviewCourse() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.courses.messages");

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReviewCourseInput }) => {
      const result = await reviewCourseAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, { input }) => {
      queryClient.invalidateQueries({ queryKey: adminCourseKeys.all });
      toast.success(
        input.action === "approve" ? t("courseApproved") : t("courseRejected")
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || t("reviewError"));
    },
  });
}

/**
 * Hook xóa khóa học (Admin)
 */
export function useDeleteAdminCourse() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.courses.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAdminCourseAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCourseKeys.all });
      toast.success(t("courseDeleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("deleteError"));
    },
  });
}

