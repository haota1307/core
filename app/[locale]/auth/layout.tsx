import { GalleryVerticalEnd } from "lucide-react";
import React from "react";
import { LanguageSwitcher } from "@/components/language-switcher";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-muted flex h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <a
            href="#"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
          <LanguageSwitcher />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Layout;
