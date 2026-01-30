"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessDenied } from "@/components/access-denied";

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const tCommon = useTranslations("common");
  const { hasPermission, loading: permissionsLoading } =
    useHasPermission("settings.view");

  // Loading state
  if (permissionsLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  // Permission denied
  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}

// Skeleton for loading settings forms
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
