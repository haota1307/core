import { getTranslations } from "next-intl/server";
import { CourseContentClient } from "./course-content-client";

export async function generateMetadata() {
  const t = await getTranslations("instructor.content");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface CourseContentPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseContentPage({
  params,
}: CourseContentPageProps) {
  const { id } = await params;

  return <CourseContentClient courseId={id} />;
}
