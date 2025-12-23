"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";

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
import { buildNavigationData } from "@/lib/navigation";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { useSettings } from "@/lib/settings-context";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tNavItems = useTranslations("nav.items");
  const { navMain, quickLinks } = buildNavigationData(tNavItems);
  const { data: currentUserData, isLoading } = useCurrentUser();
  const { settings } = useSettings();

  // Build team/site info from settings
  const siteInfo = React.useMemo(
    () => [
      {
        name: settings.general.siteName || "My App",
        logo: Building2,
        plan: settings.general.siteDescription || "Dashboard",
      },
    ],
    [settings.general.siteName, settings.general.siteDescription]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={siteInfo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={quickLinks} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : currentUserData ? (
          <NavUser user={currentUserData.user} />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
