import { z } from "zod";

// ==================== COURSE SCHEMAS ====================

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
 * Schema cho tạo khóa học mới
 */
export const createCourseSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().nullable(),
  previewVideo: z.string().url().optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default("VND"),
  level: CourseLevel.default("ALL_LEVELS"),
  language: z.string().default("vi"),
  categoryId: z.string().optional().nullable(),
  requirements: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),
});

/**
 * Schema cho cập nhật khóa học
 */
export const updateCourseSchema = createCourseSchema.partial().extend({
  status: CourseStatus.optional(),
});

/**
 * Schema cho query danh sách khóa học
 */
export const getCoursesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.union([CourseStatus, z.array(CourseStatus)]).optional(),
  categoryId: z.string().optional(),
  level: CourseLevel.optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== SECTION SCHEMAS ====================

export const createSectionSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(200),
  description: z.string().optional(),
  courseId: z.string(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateSectionSchema = createSectionSchema.partial().omit({
  courseId: true,
});

// ==================== LESSON SCHEMAS ====================

export const LessonType = z.enum(["VIDEO", "TEXT", "QUIZ", "ASSIGNMENT", "LIVE"]);

export const createLessonSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(200),
  description: z.string().optional(),
  type: LessonType.default("VIDEO"),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.coerce.number().int().default(0),
  videoProvider: z.string().optional().nullable(),
  content: z.string().optional(),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  sectionId: z.string(),
});

export const updateLessonSchema = createLessonSchema.partial().omit({
  sectionId: true,
});

// ==================== STUDENT QUERY SCHEMAS ====================

export const getStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "EXPIRED", "REFUNDED"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==================== EARNINGS QUERY SCHEMAS ====================

export const getEarningsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

// ==================== TYPES ====================

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type GetCoursesQuery = z.infer<typeof getCoursesQuerySchema>;

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export type GetStudentsQuery = z.infer<typeof getStudentsQuerySchema>;
export type GetEarningsQuery = z.infer<typeof getEarningsQuerySchema>;

// ==================== RESPONSE TYPES ====================

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
}

export interface CourseResponse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnail: string | null;
  previewVideo: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  level: string;
  status: string;
  language: string;
  requirements: string[];
  objectives: string[];
  targetAudience: string[];
  instructorId: string;
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

export interface CourseListResponse {
  data: CourseResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SectionResponse {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  sortOrder: number;
  lessons: LessonResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonResponse {
  id: string;
  title: string;
  description: string | null;
  type: string;
  videoUrl: string | null;
  videoDuration: number;
  videoProvider: string | null;
  content: string | null;
  isFree: boolean;
  isPublished: boolean;
  sortOrder: number;
  sectionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  progress: number;
  enrolledAt: Date;
  completedAt: Date | null;
  pricePaid: number;
}

export interface StudentListResponse {
  data: StudentResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EarningResponse {
  month: number;
  year: number;
  totalRevenue: number;
  platformFee: number;
  netEarnings: number;
  enrollmentCount: number;
  refundCount: number;
  refundAmount: number;
  isPaidOut: boolean;
  paidOutAt: Date | null;
}

export interface EarningsSummaryResponse {
  totalEarnings: number;
  totalEnrollments: number;
  totalCourses: number;
  averageRating: number;
  monthlyEarnings: EarningResponse[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    status: string;
    courseTitle: string | null;
    createdAt: Date;
  }[];
}

export interface InstructorAnalyticsResponse {
  overview: {
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
  };
  courseStats: {
    courseId: string;
    title: string;
    enrollmentCount: number;
    revenue: number;
    rating: number;
    completionRate: number;
  }[];
  enrollmentTrend: {
    date: string;
    count: number;
  }[];
  revenueTrend: {
    date: string;
    amount: number;
  }[];
}

