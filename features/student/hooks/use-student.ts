"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getEnrollmentsAction,
  getProgressAction,
  getCertificatesAction,
  getWishlistAction,
  toggleWishlistAction,
  removeFromWishlistAction,
} from "../actions";
import {
  GetEnrollmentsQuery,
  GetProgressQuery,
  GetCertificatesQuery,
  GetWishlistQuery,
  ToggleWishlistInput,
} from "../schemas";

// Query keys
export const studentKeys = {
  all: ["student"] as const,
  enrollments: () => [...studentKeys.all, "enrollments"] as const,
  enrollmentsList: (query: GetEnrollmentsQuery) =>
    [...studentKeys.enrollments(), "list", query] as const,
  progress: () => [...studentKeys.all, "progress"] as const,
  progressDetail: (query: GetProgressQuery) =>
    [...studentKeys.progress(), query] as const,
  certificates: () => [...studentKeys.all, "certificates"] as const,
  certificatesList: (query: GetCertificatesQuery) =>
    [...studentKeys.certificates(), "list", query] as const,
  wishlist: () => [...studentKeys.all, "wishlist"] as const,
  wishlistList: (query: GetWishlistQuery) =>
    [...studentKeys.wishlist(), "list", query] as const,
};

/**
 * Hook lấy danh sách khóa học đã đăng ký
 */
export function useEnrollments(
  query: GetEnrollmentsQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: studentKeys.enrollmentsList(query),
    queryFn: async () => {
      const result = await getEnrollmentsAction(query);
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
 * Hook lấy tiến độ học tập
 */
export function useProgress(
  query: GetProgressQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: studentKeys.progressDetail(query),
    queryFn: async () => {
      const result = await getProgressAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: (options?.enabled ?? true) && !!(query.courseId || query.enrollmentId),
  });
}

/**
 * Hook lấy danh sách chứng chỉ
 */
export function useCertificates(
  query: GetCertificatesQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: studentKeys.certificatesList(query),
    queryFn: async () => {
      const result = await getCertificatesAction(query);
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
 * Hook lấy danh sách wishlist
 */
export function useWishlist(
  query: GetWishlistQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: studentKeys.wishlistList(query),
    queryFn: async () => {
      const result = await getWishlistAction(query);
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
 * Hook thêm/xóa khóa học khỏi wishlist
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const t = useTranslations("student.wishlist.messages");

  return useMutation({
    mutationFn: async (input: ToggleWishlistInput) => {
      const result = await toggleWishlistAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.wishlist() });
      toast.success(t("toggleSuccess"));
    },
    onError: () => {
      toast.error(t("toggleError"));
    },
  });
}

/**
 * Hook xóa khóa học khỏi wishlist
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const t = useTranslations("student.wishlist.messages");

  return useMutation({
    mutationFn: async (courseId: string) => {
      const result = await removeFromWishlistAction(courseId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.wishlist() });
      toast.success(t("removeSuccess"));
    },
    onError: () => {
      toast.error(t("removeError"));
    },
  });
}
