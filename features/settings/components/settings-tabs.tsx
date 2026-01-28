"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface SettingsTabItem {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  content: ReactNode;
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[];
  defaultTab?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
}

export function SettingsTabs({
  tabs,
  defaultTab,
  title,
  description,
  footer,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Content with sidebar */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <nav className="flex flex-col space-y-1 pr-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors w-full",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{tab.title}</span>
                      <span
                        className={cn(
                          "text-xs line-clamp-2",
                          isActive
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {tab.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Render all tabs but only show the active one - keeps form state intact */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <div
                key={tab.id}
                className={cn(isActive ? "block" : "hidden")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {Icon && <Icon className="h-5 w-5" />}
                      {tab.title}
                    </CardTitle>
                    <CardDescription>{tab.description}</CardDescription>
                  </CardHeader>
                  <CardContent>{tab.content}</CardContent>
                </Card>
              </div>
            );
          })}

          {/* Footer (e.g., Save button) */}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
