import { http } from "@/lib/http";
import {
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  GetRolesQuery,
  GetPermissionsQuery,
  RoleResponse,
  RoleDetailResponse,
  PermissionResponse,
  RolesListResponse,
  PermissionsListResponse,
} from "../schemas";

export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

/**
 * Roles Actions
 */
export async function getRolesAction(
  query: GetRolesQuery
): Promise<ActionResult<RolesListResponse>> {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);

    // Support multiple isSystem values
    if (query.isSystem !== undefined) {
      if (Array.isArray(query.isSystem)) {
        query.isSystem.forEach((value) =>
          params.append("isSystem", value.toString())
        );
      } else {
        params.append("isSystem", query.isSystem.toString());
      }
    }

    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<RolesListResponse>(
      `/api/roles?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch roles",
    };
  }
}

export async function getRoleAction(
  id: string
): Promise<ActionResult<{ data: RoleDetailResponse }>> {
  try {
    const response = await http.get<{ data: RoleDetailResponse }>(
      `/api/roles/${id}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch role",
    };
  }
}

export async function createRoleAction(
  input: CreateRoleInput
): Promise<ActionResult<{ data: RoleResponse; message: string }>> {
  try {
    const response = await http.post<{ data: RoleResponse; message: string }>(
      "/api/roles",
      input
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create role",
    };
  }
}

export async function updateRoleAction(
  id: string,
  input: UpdateRoleInput
): Promise<ActionResult<{ data: RoleResponse; message: string }>> {
  try {
    const response = await http.patch<{ data: RoleResponse; message: string }>(
      `/api/roles/${id}`,
      input
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update role",
    };
  }
}

export async function deleteRoleAction(
  id: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const response = await http.delete<{ message: string }>(`/api/roles/${id}`);
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete role",
    };
  }
}

export async function updateRolePermissionsAction(
  id: string,
  input: UpdateRolePermissionsInput
): Promise<ActionResult<{ data: RoleDetailResponse; message: string }>> {
  try {
    const response = await http.patch<{
      data: RoleDetailResponse;
      message: string;
    }>(`/api/roles/${id}/permissions`, input);
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update role permissions",
    };
  }
}

/**
 * Permissions Actions
 */
export async function getPermissionsAction(
  query: GetPermissionsQuery
): Promise<ActionResult<PermissionsListResponse>> {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<PermissionsListResponse>(
      `/api/permissions?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch permissions",
    };
  }
}

export async function createPermissionAction(
  input: CreatePermissionInput
): Promise<ActionResult<{ data: PermissionResponse; message: string }>> {
  try {
    const response = await http.post<{
      data: PermissionResponse;
      message: string;
    }>("/api/permissions", input);
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create permission",
    };
  }
}

export async function updatePermissionAction(
  id: string,
  input: UpdatePermissionInput
): Promise<ActionResult<{ data: PermissionResponse; message: string }>> {
  try {
    const response = await http.patch<{
      data: PermissionResponse;
      message: string;
    }>(`/api/permissions/${id}`, input);
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update permission",
    };
  }
}

export async function deletePermissionAction(
  id: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/permissions/${id}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete permission",
    };
  }
}
