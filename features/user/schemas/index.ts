import { z } from "zod";

/**
 * Schema cho tạo user mới
 */
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number"
    ),
  roleId: z.string().optional(),
});

/**
 * Schema cho cập nhật user
 */
export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number"
    )
    .optional(),
  roleId: z.string().nullable().optional(),
  image: z.string().url("Invalid image URL").nullable().optional(),
});

/**
 * Schema cho search/filter users
 */
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  roleId: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([
    z.enum(["active", "pending", "inactive"]),
    z.array(z.enum(["active", "pending", "inactive"])),
  ]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// Response types
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  roleId: string | null;
  role?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersListResponse {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}
