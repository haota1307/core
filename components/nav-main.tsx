"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleLink } from "@/components/locale-link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { NavigationItem, NavigationSubItem } from "@/lib/navigation";

export function NavMain({ items }: { items: NavigationItem[] }) {
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

  // Check sub-item permission (supports both single and multiple permissions)
  const canViewSubItem = (subItem: NavigationSubItem) => {
    if (subItem.permissions && subItem.permissions.length > 0) {
      return hasAnyPermission(subItem.permissions);
    }
    return hasPermission(subItem.permission);
  };

  // Filter items based on permissions
  const filteredItems = items
    .filter((item) => {
      // Check parent permission (AND logic for single, OR logic for array)
      if (item.permission && !hasPermission(item.permission)) return false;
      if (item.permissions && !hasAnyPermission(item.permissions)) return false;
      return true;
    })
    .map((item) => ({
      ...item,
      // Filter sub-items based on permissions
      items: item.items?.filter((subItem) => canViewSubItem(subItem)),
    }))
    // Remove items with no visible sub-items
    .filter((item) => !item.items || item.items.length > 0);

  // Show nothing while loading to prevent flash
  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
        <SidebarMenu>
          {[1, 2, 3].map((i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuButton className="animate-pulse">
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <LocaleLink href={subItem.url}>
                          <span>{subItem.title}</span>
                        </LocaleLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
