import {
  BarChart3,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Settings2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type Translate = (key: string) => string;

export type NavigationItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  permission?: string; // Required permission to show this item
  items?: {
    title: string;
    url: string;
    permission?: string; // Required permission to show this item
  }[];
};

export type NavigationQuickLink = {
  name: string;
  url: string;
  icon: LucideIcon;
};

export type NavigationData = {
  navMain: NavigationItem[];
  quickLinks: NavigationQuickLink[];
};

export const buildNavigationData = (tNavItems: Translate): NavigationData => ({
  navMain: [
    {
      title: tNavItems("dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: tNavItems("overview"),
          url: "/dashboard",
        },
        {
          title: tNavItems("analytics"),
          url: "/dashboard/analytics",
        },
        {
          title: tNavItems("reports"),
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: tNavItems("users"),
      url: "/dashboard/users",
      icon: Users,
      items: [
        {
          title: tNavItems("usersList"),
          url: "/dashboard/users",
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
    {
      title: tNavItems("content"),
      url: "/dashboard/content",
      icon: FileText,
      items: [
        {
          title: tNavItems("posts"),
          url: "/dashboard/content/posts",
        },
        {
          title: tNavItems("pages"),
          url: "/dashboard/content/pages",
        },
        {
          title: tNavItems("media"),
          url: "/dashboard/content/media",
        },
        {
          title: tNavItems("categories"),
          url: "/dashboard/content/categories",
        },
      ],
    },
    {
      title: tNavItems("analytics"),
      url: "/dashboard/analytics",
      icon: BarChart3,
      items: [
        {
          title: tNavItems("traffic"),
          url: "/dashboard/analytics/traffic",
        },
        {
          title: tNavItems("events"),
          url: "/dashboard/analytics/events",
        },
        {
          title: tNavItems("conversions"),
          url: "/dashboard/analytics/conversions",
        },
      ],
    },
    {
      title: tNavItems("settings"),
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: tNavItems("general"),
          url: "/dashboard/settings/general",
        },
        {
          title: tNavItems("appearance"),
          url: "/dashboard/settings/appearance",
        },
        {
          title: tNavItems("integrations"),
          url: "/dashboard/settings/integrations",
        },
        {
          title: tNavItems("security"),
          url: "/dashboard/settings/security",
        },
      ],
    },
  ],
  quickLinks: [
    {
      name: tNavItems("auditLogs"),
      url: "/dashboard/audit-logs",
      icon: ShieldCheck,
    },
    {
      name: tNavItems("apiKeys"),
      url: "/dashboard/api-keys",
      icon: KeyRound,
    },
    {
      name: tNavItems("support"),
      url: "/dashboard/support",
      icon: LifeBuoy,
    },
  ],
});


