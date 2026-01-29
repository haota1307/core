import { http } from "@/lib/http";
import {
  GetCategoriesQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryListResponse,
  CategoryResponse,
} from "../schemas";

// ==================== CATEGORY ACTIONS ====================

/**
 * Lấy danh sách danh mục
 */
export async function getCategoriesAction(query: GetCategoriesQuery) {
  try {
    const params = new URLSearchParams();
    
    if (query.page) params.set("page", query.page.toString());
    if (query.limit) params.set("limit", query.limit.toString());
    if (query.search) params.set("search", query.search);
    if (query.parentId) params.set("parentId", query.parentId);
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.sortOrder) params.set("sortOrder", query.sortOrder);

    const response = await http.get<CategoryListResponse>(
      `/api/admin/categories?${params.toString()}`
    );
    return { success: true as const, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return { success: false as const, error: message };
  }
}

/**
 * Lấy tất cả danh mục (không phân trang)
 */
export async function getAllCategoriesAction() {
  try {
    const response = await http.get<{ data: CategoryResponse[] }>(
      `/api/admin/categories?all=true`
    );
    return { success: true as const, data: response.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return { success: false as const, error: message };
  }
}

/**
 * Tạo danh mục mới
 */
export async function createCategoryAction(input: CreateCategoryInput) {
  try {
    const response = await http.post<{ data: CategoryResponse; message: string }>(
      "/api/admin/categories",
      input
    );
    return { success: true as const, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return { success: false as const, error: message };
  }
}

/**
 * Cập nhật danh mục
 */
export async function updateCategoryAction(id: string, input: UpdateCategoryInput) {
  try {
    const response = await http.patch<{ data: CategoryResponse; message: string }>(
      `/api/admin/categories/${id}`,
      input
    );
    return { success: true as const, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return { success: false as const, error: message };
  }
}

/**
 * Xóa danh mục
 */
export async function deleteCategoryAction(id: string) {
  try {
    await http.delete(`/api/admin/categories/${id}`);
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false as const, error: message };
  }
}
