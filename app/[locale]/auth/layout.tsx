import { Building2 } from "lucide-react";
import React from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const siteSettings = await getSiteSettings();
  const siteName = siteSettings.general.siteName || "My App";

  return (
    <div className="bg-muted flex h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Building2 className="size-4" />
            </div>
            {siteName}
          </Link>
        </div>
        {children}
      </div>
      <div className="flex justify-end w-full">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Layout;
