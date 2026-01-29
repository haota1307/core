import { http } from "@/lib/http";
import {
  GetAdminCoursesQuery,
  ReviewCourseInput,
  AdminCourseListResponse,
  AdminCourseResponse,
} from "../schemas";

// ==================== ADMIN COURSE ACTIONS ====================

/**
 * Lấy danh sách tất cả khóa học (Admin)
 */
export async function getAdminCoursesAction(query: GetAdminCoursesQuery) {
  try {
    const params = new URLSearchParams();
    
    if (query.page) params.set("page", query.page.toString());
    if (query.limit) params.set("limit", query.limit.toString());
    if (query.search) params.set("search", query.search);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.level) params.set("level", query.level);
    if (query.instructorId) params.set("instructorId", query.instructorId);
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.sortOrder) params.set("sortOrder", query.sortOrder);
    
    // Handle status (can be array)
    if (query.status) {
      if (Array.isArray(query.status)) {
        query.status.forEach((s) => params.append("status", s));
      } else {
        params.set("status", query.status);
      }
    }

    const response = await http.get<AdminCourseListResponse>(
      `/api/admin/courses?${params.toString()}`
    );
    return { success: true as const, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch courses";
    return { success: false as const, error: message };
  }
}

/**
 * Lấy danh sách khóa học chờ duyệt
 */
export async function getPendingCoursesAction(query: Omit<GetAdminCoursesQuery, "status">) {
  return getAdminCoursesAction({ ...query, status: "PENDING_REVIEW" });
}

/**
 * Duyệt hoặc từ chối khóa học
 */
export async function reviewCourseAction(id: string, input: ReviewCourseInput) {
  try {
    const response = await http.post<{ data: AdminCourseResponse; message: string }>(
      `/api/admin/courses/${id}/review`,
      input
    );
    return { success: true as const, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review course";
    return { success: false as const, error: message };
  }
}

/**
 * Xóa khóa học (Admin)
 */
export async function deleteAdminCourseAction(id: string) {
  try {
    await http.delete(`/api/admin/courses/${id}`);
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete course";
    return { success: false as const, error: message };
  }
}
