import { z } from "zod";

// ==================== ENROLLMENT SCHEMAS ====================

export const EnrollmentStatus = z.enum([
  "ACTIVE",
  "COMPLETED",
  "EXPIRED",
  "REFUNDED",
]);

/**
 * Schema cho query danh sách khóa học đã đăng ký
 */
export const getEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.union([EnrollmentStatus, z.array(EnrollmentStatus)]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== PROGRESS SCHEMAS ====================

/**
 * Schema cho query tiến độ học tập
 */
export const getProgressQuerySchema = z.object({
  courseId: z.string().optional(),
  enrollmentId: z.string().optional(),
});

// ==================== CERTIFICATE SCHEMAS ====================

/**
 * Schema cho query danh sách chứng chỉ
 */
export const getCertificatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  courseId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== WISHLIST SCHEMAS ====================

/**
 * Schema cho thêm/xóa khóa học khỏi wishlist
 */
export const toggleWishlistSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

/**
 * Schema cho query danh sách wishlist
 */
export const getWishlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== TYPES ====================

export type GetEnrollmentsQuery = z.infer<typeof getEnrollmentsQuerySchema>;
export type GetProgressQuery = z.infer<typeof getProgressQuerySchema>;
export type GetCertificatesQuery = z.infer<typeof getCertificatesQuerySchema>;
export type ToggleWishlistInput = z.infer<typeof toggleWishlistSchema>;
export type GetWishlistQuery = z.infer<typeof getWishlistQuerySchema>;

// ==================== RESPONSE TYPES ====================

export interface EnrolledCourseResponse {
  id: string;
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  shortDescription: string | null;
  instructor: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  status: string;
  progress: number; // 0-100
  enrolledAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  pricePaid: number;
  currency: string;
  totalLessons: number;
  completedLessons: number;
  totalDuration: number; // seconds
  watchedDuration: number; // seconds
  rating: number;
  reviewCount: number;
}

export interface EnrollmentsListResponse {
  data: EnrolledCourseResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CourseProgressResponse {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  overallProgress: number; // 0-100
  totalLessons: number;
  completedLessons: number;
  totalDuration: number; // seconds
  watchedDuration: number; // seconds
  sections: {
    id: string;
    title: string;
    sortOrder: number;
    lessons: {
      id: string;
      title: string;
      type: string;
      duration: number;
      isFree: boolean;
      isCompleted: boolean;
      watchedTime: number; // seconds
      completedAt: Date | null;
    }[];
  }[];
  enrolledAt: Date;
  lastAccessedAt: Date | null;
}

export interface CertificateResponse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  instructorName: string | null;
  issuedAt: Date;
  certificateUrl: string | null;
  certificateNumber: string;
}

export interface CertificatesListResponse {
  data: CertificateResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WishlistItemResponse {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  level: string;
  instructor: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  addedAt: Date;
}

export interface WishlistListResponse {
  data: WishlistItemResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
