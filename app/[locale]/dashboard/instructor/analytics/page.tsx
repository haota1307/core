import { getTranslations } from "next-intl/server";
import { AnalyticsDashboard } from "@/features/instructor/components";

export async function generateMetadata() {
  const t = await getTranslations("instructor.analytics");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function InstructorAnalyticsPage() {
  const t = await getTranslations("instructor.analytics");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}

