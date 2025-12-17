import { z } from "zod";

/**
 * Schema cho tạo role mới
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

/**
 * Schema cho cập nhật role
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

/**
 * Schema cho cập nhật permissions của role
 */
export const updateRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string())
    .min(0, "At least one permission is required"),
});

/**
 * Schema cho tạo permission mới
 */
export const createPermissionSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
});

/**
 * Schema cho cập nhật permission
 */
export const updatePermissionSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  description: z.string().optional(),
});

// Types
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

// Response types
export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDetailResponse extends RoleResponse {
  rolePermissions: Array<{
    id: string;
    permission: {
      id: string;
      code: string;
      description: string | null;
    };
  }>;
}

export interface PermissionResponse {
  id: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema cho search/filter roles
 */
export const getRolesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  isSystem: z.union([z.boolean(), z.array(z.boolean())]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Schema cho search/filter permissions
 */
export const getPermissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;
export type GetPermissionsQuery = z.infer<typeof getPermissionsQuerySchema>;

export interface RolesListResponse {
  data: RoleResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PermissionsListResponse {
  data: PermissionResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
