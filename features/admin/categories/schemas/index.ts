import { z } from "zod";

// ==================== CATEGORY SCHEMAS ====================

/**
 * Schema cho tạo danh mục
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc").max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  parentId: z.string().optional().nullable(),
});

/**
 * Schema cho cập nhật danh mục
 */
export const updateCategorySchema = createCategorySchema.partial();

/**
 * Schema cho query danh sách danh mục
 */
export const getCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  parentId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== TYPES ====================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

// ==================== RESPONSE TYPES ====================

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  parent?: CategoryResponse | null;
  _count?: {
    courses: number;
    children: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryListResponse {
  data: CategoryResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

