"use client";

import { useHasPermission } from "@/lib/hooks/use-permissions";
import { useTranslations } from "next-intl";

export default function Page() {
  const { hasPermission: hasViewPermission, loading: permissionsLoading } = useHasPermission("dashboard.view");
  const t = useTranslations("common");

  if (permissionsLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("accessDenied")}</h2>
          <p className="text-muted-foreground mt-2">
            {t("noPermission")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-2xl font-bold">Dashboard</div>
    </>
  );
}
