import { notFound } from "next/navigation";
import { CoursePreviewClient } from "./course-preview-client";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function CoursePreviewPage({ params }: PageProps) {
  const { id, locale } = await params;

  if (!id) {
    notFound();
  }

  return <CoursePreviewClient courseId={id} locale={locale} />;
}
