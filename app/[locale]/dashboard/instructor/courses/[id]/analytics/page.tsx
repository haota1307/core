import { getTranslations } from "next-intl/server";
import { CourseAnalyticsClient } from "./course-analytics-client";

export async function generateMetadata() {
  const t = await getTranslations("instructor.analytics");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface CourseAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseAnalyticsPage({
  params,
}: CourseAnalyticsPageProps) {
  const { id } = await params;

  return <CourseAnalyticsClient courseId={id} />;
}
