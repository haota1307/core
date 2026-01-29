"use client";

import * as React from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { LocaleLink } from "@/components/locale-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SiteLogoProps {
  name: string;
  description?: string;
  logoUrl?: string;
}

export function SiteLogo({ name, description, logoUrl }: SiteLogoProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LocaleLink href="/dashboard">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={name}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              {description && (
                <span className="truncate text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          </LocaleLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}


