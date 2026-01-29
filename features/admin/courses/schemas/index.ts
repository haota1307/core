import { z } from "zod";

// ==================== ADMIN COURSE SCHEMAS ====================

export const CourseLevel = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
]);

export const CourseStatus = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

/**
 * Schema cho query danh sách khóa học (Admin)
 */
export const getAdminCoursesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.union([CourseStatus, z.array(CourseStatus)]).optional(),
  categoryId: z.string().optional(),
  level: CourseLevel.optional(),
  instructorId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Schema cho duyệt/từ chối khóa học
 */
export const reviewCourseSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// ==================== TYPES ====================

export type GetAdminCoursesQuery = z.infer<typeof getAdminCoursesQuerySchema>;
export type ReviewCourseInput = z.infer<typeof reviewCourseSchema>;

// ==================== RESPONSE TYPES ====================

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  courseCount?: number;
}

export interface InstructorInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface AdminCourseResponse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  level: string;
  status: string;
  language: string;
  instructorId: string;
  instructor: InstructorInfo;
  categoryId: string | null;
  category?: CategoryResponse | null;
  totalDuration: number;
  totalLessons: number;
  totalSections: number;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCourseListResponse {
  data: AdminCourseResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

