"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getInstructorCoursesAction,
  getCourseAction,
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
  submitCourseForReviewAction,
  getCourseSectionsAction,
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  getInstructorStudentsAction,
  getInstructorEarningsAction,
  getInstructorAnalyticsAction,
} from "../actions";
import {
  CreateCourseInput,
  UpdateCourseInput,
  GetCoursesQuery,
  CreateSectionInput,
  UpdateSectionInput,
  CreateLessonInput,
  UpdateLessonInput,
  GetStudentsQuery,
  GetEarningsQuery,
} from "../schemas";

// ==================== QUERY KEYS ====================

export const instructorKeys = {
  all: ["instructor"] as const,
  
  // Courses
  courses: () => [...instructorKeys.all, "courses"] as const,
  courseList: (query: GetCoursesQuery) => [...instructorKeys.courses(), "list", query] as const,
  courseDetail: (id: string) => [...instructorKeys.courses(), "detail", id] as const,
  courseSections: (courseId: string) => [...instructorKeys.courses(), courseId, "sections"] as const,
  
  // Students
  students: () => [...instructorKeys.all, "students"] as const,
  studentList: (query: GetStudentsQuery) => [...instructorKeys.students(), "list", query] as const,
  
  // Earnings
  earnings: () => [...instructorKeys.all, "earnings"] as const,
  earningsSummary: (query: GetEarningsQuery) => [...instructorKeys.earnings(), "summary", query] as const,
  
  // Analytics
  analytics: () => [...instructorKeys.all, "analytics"] as const,
};

// ==================== COURSE HOOKS ====================

/**
 * Hook lấy danh sách khóa học của instructor
 */
export function useInstructorCourses(
  query: GetCoursesQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: instructorKeys.courseList(query),
    queryFn: async () => {
      const result = await getInstructorCoursesAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook lấy chi tiết khóa học
 */
export function useCourse(id: string) {
  return useQuery({
    queryKey: instructorKeys.courseDetail(id),
    queryFn: async () => {
      const result = await getCourseAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook tạo khóa học mới
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const result = await createCourseAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.courses() });
      toast.success(t("courseCreated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("courseCreateError"));
    },
  });
}

/**
 * Hook cập nhật khóa học
 */
export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (input: UpdateCourseInput) => {
      const result = await updateCourseAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.courses() });
      queryClient.invalidateQueries({ queryKey: instructorKeys.courseDetail(id) });
      toast.success(t("courseUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("courseUpdateError"));
    },
  });
}

/**
 * Hook xóa khóa học
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCourseAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.courses() });
      toast.success(t("courseDeleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("courseDeleteError"));
    },
  });
}

/**
 * Hook gửi khóa học để duyệt
 */
export function useSubmitCourseForReview() {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await submitCourseForReviewAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.courses() });
      queryClient.invalidateQueries({ queryKey: instructorKeys.courseDetail(id) });
      toast.success(t("courseSubmitted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("courseSubmitError"));
    },
  });
}

// ==================== SECTION HOOKS ====================

/**
 * Hook lấy danh sách sections của khóa học
 */
export function useCourseSections(courseId: string) {
  return useQuery({
    queryKey: instructorKeys.courseSections(courseId),
    queryFn: async () => {
      const result = await getCourseSectionsAction(courseId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!courseId,
  });
}

/**
 * Hook tạo section mới
 */
export function useCreateSection() {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (input: CreateSectionInput) => {
      const result = await createSectionAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(variables.courseId),
      });
      toast.success(t("sectionCreated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("sectionCreateError"));
    },
  });
}

/**
 * Hook cập nhật section
 */
export function useUpdateSection(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateSectionInput }) => {
      const result = await updateSectionAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
      toast.success(t("sectionUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("sectionUpdateError"));
    },
  });
}

/**
 * Hook xóa section
 */
export function useDeleteSection(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteSectionAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
      toast.success(t("sectionDeleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("sectionDeleteError"));
    },
  });
}

/**
 * Hook sắp xếp lại sections
 */
export function useReorderSections(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (sectionIds: string[]) => {
      const result = await reorderSectionsAction(courseId, sectionIds);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("reorderError"));
    },
  });
}

// ==================== LESSON HOOKS ====================

/**
 * Hook tạo lesson mới
 */
export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (input: CreateLessonInput) => {
      const result = await createLessonAction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
      toast.success(t("lessonCreated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("lessonCreateError"));
    },
  });
}

/**
 * Hook cập nhật lesson
 */
export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLessonInput }) => {
      const result = await updateLessonAction(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
      toast.success(t("lessonUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("lessonUpdateError"));
    },
  });
}

/**
 * Hook xóa lesson
 */
export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLessonAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
      toast.success(t("lessonDeleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("lessonDeleteError"));
    },
  });
}

/**
 * Hook sắp xếp lại lessons
 */
export function useReorderLessons(courseId: string, sectionId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.messages");

  return useMutation({
    mutationFn: async (lessonIds: string[]) => {
      const result = await reorderLessonsAction(sectionId, lessonIds);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: instructorKeys.courseSections(courseId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("reorderError"));
    },
  });
}

// ==================== STUDENT HOOKS ====================

/**
 * Hook lấy danh sách học viên
 */
export function useInstructorStudents(
  query: GetStudentsQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: instructorKeys.studentList(query),
    queryFn: async () => {
      const result = await getInstructorStudentsAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 1000,
    enabled: options?.enabled ?? true,
  });
}

// ==================== EARNINGS HOOKS ====================

/**
 * Hook lấy thống kê thu nhập
 */
export function useInstructorEarnings(query: GetEarningsQuery = {}) {
  return useQuery({
    queryKey: instructorKeys.earningsSummary(query),
    queryFn: async () => {
      const result = await getInstructorEarningsAction(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== ANALYTICS HOOKS ====================

/**
 * Hook lấy thống kê tổng quan
 */
export function useInstructorAnalytics() {
  return useQuery({
    queryKey: instructorKeys.analytics(),
    queryFn: async () => {
      const result = await getInstructorAnalyticsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

