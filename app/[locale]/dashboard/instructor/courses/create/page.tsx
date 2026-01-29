import { getTranslations } from "next-intl/server";
import { CreateCourseClient } from "./create-client";

export async function generateMetadata() {
  const t = await getTranslations("instructor.courses");
  return {
    title: t("createTitle"),
    description: t("createDescription"),
  };
}

export default async function CreateCoursePage() {
  const t = await getTranslations("instructor.courses");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("createTitle")}</h1>
        <p className="text-muted-foreground">{t("createDescription")}</p>
      </div>
      <CreateCourseClient />
    </div>
  );
}

