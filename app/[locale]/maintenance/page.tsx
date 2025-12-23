import { Construction } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function MaintenancePage() {
  // Check if maintenance mode is actually enabled
  const settings = await getSiteSettings();
  const t = await getTranslations("maintenance");

  // If not in maintenance mode, redirect to home
  if (!settings.general.maintenanceMode) {
    redirect("/");
  }

  const siteName = settings.general.siteName || "Our Website";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight mb-3">{t("title")}</h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          {t("description", { siteName })}
        </p>

        {/* Contact info */}
        {settings.general.contactEmail && (
          <p className="text-sm text-muted-foreground">
            {t("contact")}:{" "}
            <a
              href={`mailto:${settings.general.contactEmail}`}
              className="text-primary hover:underline"
            >
              {settings.general.contactEmail}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
