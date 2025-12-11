"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  AudioWaveform,
  BarChart3,
  Command,
  FileText,
  GalleryVerticalEnd,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const teams = [
  {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    logo: Command,
    plan: "Free",
  },
];

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tNavItems = useTranslations("nav.items");

  const navMain = [
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
          url: "/dashboard/users/roles",
        },
        {
          title: tNavItems("permissions"),
          url: "/dashboard/users/permissions",
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
  ];

  const quickLinks = [
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
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={quickLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
