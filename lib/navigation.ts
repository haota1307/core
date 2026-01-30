import {
  ArrowLeftIcon,
  Award,
  BarChart3,
  BookOpen,
  DollarSign,
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  Settings2,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

type Translate = (key: string) => string;

export type NavigationSubItem = {
  title: string;
  url: string;
  permission?: string; // Required permission to show this item
  permissions?: string[]; // OR logic
};

export type NavigationItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  permission?: string; // Required permission to show this group
  permissions?: string[]; // OR logic - show if has any of these
  items?: NavigationSubItem[];
};

export type NavigationQuickLink = {
  name: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
  permissions?: string[]; // OR logic
};

export type NavigationData = {
  navMain: NavigationItem[];
  quickLinks: NavigationQuickLink[];
};

export const buildNavigationData = (tNavItems: Translate): NavigationData => ({
  navMain: [
    // Dashboard - everyone can see
    {
      title: tNavItems("dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      permission: "dashboard.view",
      items: [
        {
          title: tNavItems("overview"),
          url: "/dashboard",
        },
        {
          title: tNavItems("analytics"),
          url: "/dashboard/analytics",
          permission: "dashboard.analytics",
        },
      ],
    },

    // My Learning - for students
    {
      title: tNavItems("myLearning"),
      url: "/dashboard/my-courses",
      icon: BookOpen,
      permission: "courses.enrolled",
      items: [
        {
          title: tNavItems("enrolledCourses"),
          url: "/dashboard/my-courses",
        },
        {
          title: tNavItems("learningProgress"),
          url: "/dashboard/my-courses/progress",
        },
        {
          title: tNavItems("certificates"),
          url: "/dashboard/certificates",
          permission: "certificates.view",
        },
        {
          title: tNavItems("wishlist"),
          url: "/dashboard/wishlist",
        },
      ],
    },

    // Instructor Dashboard - for instructors
    {
      title: tNavItems("instructorDashboard"),
      url: "/dashboard/instructor",
      icon: GraduationCap,
      permissions: ["courses.create", "courses.manage_own"],
      items: [
        {
          title: tNavItems("myCoursesList"),
          url: "/dashboard/instructor/courses",
        },
        {
          title: tNavItems("createCourse"),
          url: "/dashboard/instructor/courses/create",
          permission: "courses.create",
        },
        {
          title: tNavItems("myStudents"),
          url: "/dashboard/instructor/students",
          permission: "students.view_own",
        },
        {
          title: tNavItems("courseAnalytics"),
          url: "/dashboard/instructor/analytics",
          permission: "courses.analytics",
        },
        {
          title: tNavItems("earnings"),
          url: "/dashboard/instructor/earnings",
          permission: "earnings.view",
        },
      ],
    },

    // Admin - Course Management
    {
      title: tNavItems("courseManagement"),
      url: "/dashboard/courses",
      icon: PlayCircle,
      permission: "courses.manage_all",
      items: [
        {
          title: tNavItems("allCourses"),
          url: "/dashboard/courses",
        },
        {
          title: tNavItems("pendingApproval"),
          url: "/dashboard/courses/pending",
          permission: "courses.approve",
        },
        {
          title: tNavItems("categories"),
          url: "/dashboard/categories",
          permission: "categories.manage",
        },
      ],
    },

    // Users Management - Admin only
    {
      title: tNavItems("users"),
      url: "/dashboard/users",
      icon: Users,
      permission: "users.view",
      items: [
        {
          title: tNavItems("allUsers"),
          url: "/dashboard/users",
        },
        {
          title: tNavItems("instructors"),
          url: "/dashboard/users/instructors",
          permission: "instructors.manage",
        },
        {
          title: tNavItems("roles"),
          url: "/dashboard/roles",
          permission: "roles.view",
        },
        {
          title: tNavItems("permissions"),
          url: "/dashboard/permissions",
          permission: "permissions.view",
        },
      ],
    },

    // Content Management - Admin only
    {
      title: tNavItems("content"),
      url: "/dashboard/content",
      icon: FileText,
      permission: "content.manage", // Chỉ admin mới có permission này
      items: [
        {
          title: tNavItems("posts"),
          url: "/dashboard/content/posts",
          permission: "content.view",
        },
        {
          title: tNavItems("pages"),
          url: "/dashboard/content/pages",
          permission: "content.view",
        },
        {
          title: tNavItems("media"),
          url: "/dashboard/media",
          permission: "media.manage", // Chỉ admin mới có permission này
        },
      ],
    },

    // Reviews & Ratings - Admin only
    {
      title: tNavItems("reviews"),
      url: "/dashboard/reviews",
      icon: Star,
      permission: "reviews.manage",
      items: [
        {
          title: tNavItems("allReviews"),
          url: "/dashboard/reviews",
        },
        {
          title: tNavItems("pendingReviews"),
          url: "/dashboard/reviews/pending",
        },
        {
          title: tNavItems("reportedReviews"),
          url: "/dashboard/reviews/reported",
        },
      ],
    },

    // Payments & Transactions - Admin only
    {
      title: tNavItems("payments"),
      url: "/dashboard/payments",
      icon: DollarSign,
      permission: "payments.view",
      items: [
        {
          title: tNavItems("transactions"),
          url: "/dashboard/payments/transactions",
        },
        {
          title: tNavItems("payouts"),
          url: "/dashboard/payments/payouts",
          permission: "payouts.manage",
        },
        {
          title: tNavItems("refunds"),
          url: "/dashboard/payments/refunds",
          permission: "refunds.manage",
        },
      ],
    },

    // Settings - Admin only
    {
      title: tNavItems("settings"),
      url: "/dashboard/settings",
      icon: Settings2,
      permission: "settings.view",
      items: [
        {
          title: tNavItems("general"),
          url: "/dashboard/settings",
        },
        {
          title: tNavItems("email"),
          url: "/dashboard/settings/email",
        },
        {
          title: tNavItems("mediaSettings"),
          url: "/dashboard/settings/media",
        },
        {
          title: tNavItems("security"),
          url: "/dashboard/settings/security",
        },
        {
          title: tNavItems("backup"),
          url: "/dashboard/settings/backup",
          permission: "settings.backup",
        },
      ],
    },
  ],
  quickLinks: [
    {
      name: tNavItems("browseCourses"),
      url: "/courses",
      icon: BookOpen,
      permission: "courses.browse",
    },
    {
      name: tNavItems("messages"),
      url: "/dashboard/messages",
      icon: MessageSquare,
      permission: "messages.view",
    },
    {
      name: tNavItems("auditLogs"),
      url: "/dashboard/audit-logs",
      icon: History,
      permission: "audit_logs.view",
    },
  ],
});
