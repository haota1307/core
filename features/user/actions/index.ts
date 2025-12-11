import { http } from "@/lib/http";
import {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
  UsersListResponse,
  UserResponse,
  RoleResponse,
} from "../schemas";

/**
 * Lấy danh sách users
 */
export async function getUsersAction(query: GetUsersQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.roleId) params.append("roleId", query.roleId);
    if (query.status) params.append("status", query.status);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<UsersListResponse>(
      `/api/users?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Get users error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch users",
    };
  }
}

/**
 * Lấy chi tiết user
 */
export async function getUserAction(id: string) {
  try {
    const response = await http.get<{ data: UserResponse }>(`/api/users/${id}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Get user error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user",
    };
  }
}

/**
 * Tạo user mới
 */
export async function createUserAction(input: CreateUserInput) {
  try {
    const response = await http.post<{ data: UserResponse; message: string }>(
      "/api/users",
      input
    );
    return { success: true, data: response.data, message: response.message };
  } catch (error: any) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: error.message || "Failed to create user",
    };
  }
}

/**
 * Cập nhật user
 */
export async function updateUserAction(id: string, input: UpdateUserInput) {
  try {
    const response = await http.patch<{ data: UserResponse; message: string }>(
      `/api/users/${id}`,
      input
    );
    return { success: true, data: response.data, message: response.message };
  } catch (error: any) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: error.message || "Failed to update user",
    };
  }
}

/**
 * Xóa user
 */
export async function deleteUserAction(id: string) {
  try {
    const response = await http.delete<{ message: string }>(`/api/users/${id}`);
    return { success: true, message: response.message };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete user",
    };
  }
}

/**
 * Lấy danh sách roles (cho dropdown)
 */
export async function getRolesAction() {
  try {
    const response = await http.get<{ data: RoleResponse[] }>("/api/roles");
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Get roles error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch roles",
    };
  }
}
