"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { LocaleLink } from "@/components/locale-link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface QuickLink {
  name: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
  permissions?: string[]; // OR logic
}

export function NavProjects({ projects }: { projects: QuickLink[] }) {
  const t = useTranslations("nav");
  const { permissions, loading } = usePermissions();

  // Helper to check if user has permission
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  // Helper to check if user has any of the permissions (OR logic)
  const hasAnyPermission = (perms?: string[]) => {
    if (!perms || perms.length === 0) return true;
    return perms.some((p) => permissions.includes(p));
  };

  // Filter projects based on permissions
  const filteredProjects = projects.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.permissions && !hasAnyPermission(item.permissions)) return false;
    return true;
  });

  // Don't render if no items or loading
  if (loading || filteredProjects.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("quickLinks")}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredProjects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <LocaleLink href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </LocaleLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
