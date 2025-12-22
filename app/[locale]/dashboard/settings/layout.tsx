import type { ReactNode } from "react";
import { SettingsLayout } from "@/features/settings/components";

type SettingsLayoutPageProps = {
  children: ReactNode;
};

export default function SettingsLayoutPage({
  children,
}: SettingsLayoutPageProps) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
