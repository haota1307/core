"use client";

import { useTranslations } from "next-intl";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export function AccessDenied({
  title,
  description,
  showBackButton = true,
}: AccessDeniedProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {title || t("accessDenied")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            {description || t("noPermission")}
          </p>
        </div>
        {showBackButton && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              {t("goBack") || "Quay lại"}
            </Button>
            <Button onClick={() => router.push(`/${locale}/dashboard`)}>
              {t("goToDashboard") || "Về Dashboard"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
