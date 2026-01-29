"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { CourseForm } from "@/features/instructor/components";
import { useCreateCourse } from "@/features/instructor/hooks/use-instructor";
import { CreateCourseInput } from "@/features/instructor/schemas";
import { Card, CardContent } from "@/components/ui/card";

export function CreateCourseClient() {
  const router = useRouter();
  const locale = useLocale();
  const createMutation = useCreateCourse();

  const handleSubmit = async (data: CreateCourseInput) => {
    const result = await createMutation.mutateAsync(data);
    if (result.data) {
      router.push(`/${locale}/dashboard/instructor/courses/${result.data.id}`);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/instructor/courses`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <CourseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}

