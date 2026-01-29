# Instructor Feature

Feature module quản lý chức năng giảng viên trong hệ thống LMS.

## 📋 Tính năng

| Tính năng | Route | Mô tả |
|-----------|-------|-------|
| Khóa học của tôi | `/dashboard/instructor/courses` | CRUD khóa học |
| Tạo khóa học | `/dashboard/instructor/courses/create` | Form tạo khóa học mới |
| Học viên của tôi | `/dashboard/instructor/students` | Danh sách học viên đã đăng ký |
| Thống kê khóa học | `/dashboard/instructor/analytics` | Dashboard analytics |
| Thu nhập | `/dashboard/instructor/earnings` | Báo cáo thu nhập |

## 📂 Cấu trúc

```
features/instructor/
├── actions/
│   └── index.ts              # API calls
├── components/
│   ├── course-form.tsx       # Form tạo/sửa khóa học
│   ├── course-delete-dialog.tsx
│   ├── course-table/         # Table components
│   │   ├── columns.tsx
│   │   ├── course-data-table.tsx
│   │   └── course-table-toolbar.tsx
│   ├── student-table/        # Student list
│   │   ├── columns.tsx
│   │   └── student-data-table.tsx
│   ├── earnings-dashboard.tsx
│   ├── analytics-dashboard.tsx
│   └── index.ts              # Exports
├── hooks/
│   └── use-instructor.ts     # React Query hooks
├── schemas/
│   └── index.ts              # Zod schemas & types
└── README.md
```

## 🔐 Permissions

| Permission | Mô tả |
|------------|-------|
| `courses.create` | Tạo khóa học mới |
| `courses.manage_own` | Quản lý khóa học của mình |
| `courses.analytics` | Xem thống kê khóa học |
| `students.view_own` | Xem học viên của mình |
| `earnings.view` | Xem thu nhập |

## 🗄️ Database Models

### Course
- Thông tin khóa học (title, description, price, etc.)
- Trạng thái: DRAFT → PENDING_REVIEW → PUBLISHED
- Quan hệ: Instructor, Category, Sections, Enrollments

### Section
- Chương trong khóa học
- Chứa nhiều Lessons
- Có thể sắp xếp thứ tự

### Lesson
- Bài học trong Section
- Types: VIDEO, TEXT, QUIZ, ASSIGNMENT, LIVE
- Hỗ trợ video từ nhiều nguồn

### Enrollment
- Quan hệ User-Course
- Tracking tiến độ học tập
- Trạng thái: ACTIVE, COMPLETED, EXPIRED, REFUNDED

### InstructorEarning
- Thống kê thu nhập theo tháng
- Platform fee và net earnings
- Trạng thái thanh toán

## 🚀 API Endpoints

### Courses
```
GET    /api/instructor/courses          # Danh sách khóa học
POST   /api/instructor/courses          # Tạo khóa học
GET    /api/instructor/courses/:id      # Chi tiết khóa học
PATCH  /api/instructor/courses/:id      # Cập nhật
DELETE /api/instructor/courses/:id      # Xóa (soft delete)
POST   /api/instructor/courses/:id/submit # Gửi duyệt
```

### Students
```
GET    /api/instructor/students         # Danh sách học viên
```

### Analytics & Earnings
```
GET    /api/instructor/analytics        # Thống kê tổng quan
GET    /api/instructor/earnings         # Thu nhập
```

## 📝 Usage

### Hooks

```tsx
import {
  useInstructorCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useInstructorStudents,
  useInstructorEarnings,
  useInstructorAnalytics,
} from "@/features/instructor/hooks/use-instructor";

// Lấy danh sách khóa học
const { data, isLoading } = useInstructorCourses({ page: 1, limit: 10 });

// Tạo khóa học
const createMutation = useCreateCourse();
await createMutation.mutateAsync({ title: "My Course", ... });
```

### Components

```tsx
import {
  CourseForm,
  CourseDataTable,
  EarningsDashboard,
  AnalyticsDashboard,
} from "@/features/instructor/components";

// Form tạo khóa học
<CourseForm
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>

// Dashboard earnings
<EarningsDashboard />
```

## 🌐 Translations

Translations nằm trong:
- `messages/vi.json` → `instructor.*`
- `messages/en.json` → `instructor.*`

## ✅ Checklist

- [x] Prisma models (Course, Section, Lesson, Enrollment, etc.)
- [x] Schemas & Types
- [x] Actions (API calls)
- [x] Hooks (React Query)
- [x] Components (Form, Table, Dashboard)
- [x] API Routes
- [x] Pages
- [x] Translations (vi, en)
- [x] Permissions trong seed.ts
- [ ] Curriculum management (sections & lessons CRUD)
- [ ] Course preview
- [ ] Video upload integration
- [ ] Quiz builder

