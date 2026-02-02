import { getTranslations } from "next-intl/server";
import { CourseDetailClient } from "./course-detail-client";

export async function generateMetadata() {
  const t = await getTranslations("instructor.courses");
  return {
    title: t("editTitle"),
    description: t("editDescription"),
  };
}

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;

  return <CourseDetailClient courseId={id} />;
}
