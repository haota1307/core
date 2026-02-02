import { notFound } from "next/navigation";
import { CourseStudentsClient } from "./course-students-client";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function CourseStudentsPage({ params }: PageProps) {
  const { id, locale } = await params;

  if (!id) {
    notFound();
  }

  return <CourseStudentsClient courseId={id} locale={locale} />;
}
