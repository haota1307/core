import { http } from "@/lib/http";
import {
  CreateCourseInput,
  UpdateCourseInput,
  GetCoursesQuery,
  CourseListResponse,
  CourseResponse,
  CreateSectionInput,
  UpdateSectionInput,
  SectionResponse,
  CreateLessonInput,
  UpdateLessonInput,
  LessonResponse,
  GetStudentsQuery,
  StudentListResponse,
  GetEarningsQuery,
  EarningsSummaryResponse,
  InstructorAnalyticsResponse,
} from "../schemas";

// ==================== COURSE ACTIONS ====================

/**
 * Lấy danh sách khóa học của instructor
 */
export async function getInstructorCoursesAction(query: GetCoursesQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.status) {
      if (Array.isArray(query.status)) {
        query.status.forEach((s) => params.append("status", s));
      } else {
        params.append("status", query.status);
      }
    }
    if (query.categoryId) params.append("categoryId", query.categoryId);
    if (query.level) params.append("level", query.level);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<CourseListResponse>(
      `/api/instructor/courses?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch courses";
    return { success: false, error: message };
  }
}

/**
 * Lấy chi tiết khóa học
 */
export async function getCourseAction(id: string) {
  try {
    const response = await http.get<{ data: CourseResponse }>(
      `/api/instructor/courses/${id}`
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch course";
    return { success: false, error: message };
  }
}

/**
 * Tạo khóa học mới
 */
export async function createCourseAction(input: CreateCourseInput) {
  try {
    const response = await http.post<{
      data: CourseResponse;
      message: string;
    }>("/api/instructor/courses", input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create course";
    return { success: false, error: message };
  }
}

/**
 * Cập nhật khóa học
 */
export async function updateCourseAction(id: string, input: UpdateCourseInput) {
  try {
    const response = await http.patch<{
      data: CourseResponse;
      message: string;
    }>(`/api/instructor/courses/${id}`, input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update course";
    return { success: false, error: message };
  }
}

/**
 * Xóa khóa học
 */
export async function deleteCourseAction(id: string) {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/instructor/courses/${id}`
    );
    return { success: true, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete course";
    return { success: false, error: message };
  }
}

/**
 * Gửi khóa học để duyệt
 */
export async function submitCourseForReviewAction(id: string) {
  try {
    const response = await http.post<{
      data: CourseResponse;
      message: string;
    }>(`/api/instructor/courses/${id}/submit`);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit course";
    return { success: false, error: message };
  }
}

// ==================== SECTION ACTIONS ====================

/**
 * Lấy danh sách sections của khóa học
 */
export async function getCourseSectionsAction(courseId: string) {
  try {
    const response = await http.get<{ data: SectionResponse[] }>(
      `/api/instructor/courses/${courseId}/sections`
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch sections";
    return { success: false, error: message };
  }
}

/**
 * Tạo section mới
 */
export async function createSectionAction(input: CreateSectionInput) {
  try {
    const response = await http.post<{
      data: SectionResponse;
      message: string;
    }>(`/api/instructor/courses/${input.courseId}/sections`, input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create section";
    return { success: false, error: message };
  }
}

/**
 * Cập nhật section
 */
export async function updateSectionAction(id: string, input: UpdateSectionInput) {
  try {
    const response = await http.patch<{
      data: SectionResponse;
      message: string;
    }>(`/api/instructor/sections/${id}`, input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update section";
    return { success: false, error: message };
  }
}

/**
 * Xóa section
 */
export async function deleteSectionAction(id: string) {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/instructor/sections/${id}`
    );
    return { success: true, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete section";
    return { success: false, error: message };
  }
}

/**
 * Sắp xếp lại sections
 */
export async function reorderSectionsAction(
  courseId: string,
  sectionIds: string[]
) {
  try {
    const response = await http.post<{ message: string }>(
      `/api/instructor/courses/${courseId}/sections/reorder`,
      { sectionIds }
    );
    return { success: true, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reorder sections";
    return { success: false, error: message };
  }
}

// ==================== LESSON ACTIONS ====================

/**
 * Tạo lesson mới
 */
export async function createLessonAction(input: CreateLessonInput) {
  try {
    const response = await http.post<{
      data: LessonResponse;
      message: string;
    }>(`/api/instructor/sections/${input.sectionId}/lessons`, input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create lesson";
    return { success: false, error: message };
  }
}

/**
 * Cập nhật lesson
 */
export async function updateLessonAction(id: string, input: UpdateLessonInput) {
  try {
    const response = await http.patch<{
      data: LessonResponse;
      message: string;
    }>(`/api/instructor/lessons/${id}`, input);
    return { success: true, data: response.data, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update lesson";
    return { success: false, error: message };
  }
}

/**
 * Xóa lesson
 */
export async function deleteLessonAction(id: string) {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/instructor/lessons/${id}`
    );
    return { success: true, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete lesson";
    return { success: false, error: message };
  }
}

/**
 * Sắp xếp lại lessons
 */
export async function reorderLessonsAction(
  sectionId: string,
  lessonIds: string[]
) {
  try {
    const response = await http.post<{ message: string }>(
      `/api/instructor/sections/${sectionId}/lessons/reorder`,
      { lessonIds }
    );
    return { success: true, message: response.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reorder lessons";
    return { success: false, error: message };
  }
}

// ==================== STUDENT ACTIONS ====================

/**
 * Lấy danh sách học viên của instructor
 */
export async function getInstructorStudentsAction(query: GetStudentsQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.courseId) params.append("courseId", query.courseId);
    if (query.status) params.append("status", query.status);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<StudentListResponse>(
      `/api/instructor/students?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch students";
    return { success: false, error: message };
  }
}

// ==================== EARNINGS ACTIONS ====================

/**
 * Lấy thống kê thu nhập
 */
export async function getInstructorEarningsAction(query: GetEarningsQuery) {
  try {
    const params = new URLSearchParams();
    if (query.year) params.append("year", query.year.toString());
    if (query.month) params.append("month", query.month.toString());

    const response = await http.get<EarningsSummaryResponse>(
      `/api/instructor/earnings?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch earnings";
    return { success: false, error: message };
  }
}

// ==================== ANALYTICS ACTIONS ====================

/**
 * Lấy thống kê tổng quan
 */
export async function getInstructorAnalyticsAction() {
  try {
    const response = await http.get<InstructorAnalyticsResponse>(
      `/api/instructor/analytics`
    );
    return { success: true, data: response };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return { success: false, error: message };
  }
}

