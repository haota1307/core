import { http } from "@/lib/http";
import {
  GetEnrollmentsQuery,
  GetProgressQuery,
  GetCertificatesQuery,
  GetWishlistQuery,
  ToggleWishlistInput,
  EnrollmentsListResponse,
  CourseProgressResponse,
  CertificatesListResponse,
  WishlistListResponse,
} from "../schemas";

/**
 * Lấy danh sách khóa học đã đăng ký
 */
export async function getEnrollmentsAction(query: GetEnrollmentsQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.status) {
      if (Array.isArray(query.status)) {
        query.status.forEach((s) => params.append("status", s));
      } else {
        params.append("status", query.status);
      }
    }
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<EnrollmentsListResponse>(
      `/api/student/enrollments?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch enrollments",
    };
  }
}

/**
 * Lấy tiến độ học tập
 */
export async function getProgressAction(query: GetProgressQuery) {
  try {
    const params = new URLSearchParams();
    if (query.courseId) params.append("courseId", query.courseId);
    if (query.enrollmentId) params.append("enrollmentId", query.enrollmentId);

    const response = await http.get<{ data: CourseProgressResponse }>(
      `/api/student/progress?${params.toString()}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch progress",
    };
  }
}

/**
 * Lấy danh sách chứng chỉ
 */
export async function getCertificatesAction(query: GetCertificatesQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.courseId) params.append("courseId", query.courseId);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<CertificatesListResponse>(
      `/api/student/certificates?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch certificates",
    };
  }
}

/**
 * Lấy danh sách wishlist
 */
export async function getWishlistAction(query: GetWishlistQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.categoryId) params.append("categoryId", query.categoryId);
    if (query.level) params.append("level", query.level);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<WishlistListResponse>(
      `/api/student/wishlist?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch wishlist",
    };
  }
}

/**
 * Thêm/xóa khóa học khỏi wishlist
 */
export async function toggleWishlistAction(input: ToggleWishlistInput) {
  try {
    // Check if already in wishlist (would need GET first in real implementation)
    // For now, just try to add
    const response = await http.post<{ message: string }>(
      "/api/student/wishlist",
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to toggle wishlist",
    };
  }
}

/**
 * Xóa khóa học khỏi wishlist
 */
export async function removeFromWishlistAction(courseId: string) {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/student/wishlist?courseId=${courseId}`
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to remove from wishlist",
    };
  }
}
