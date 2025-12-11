"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useRouter } from "@/i18n/routing";
import {
  buildNavigationData,
  type NavigationItem,
  type NavigationQuickLink,
} from "@/lib/navigation";

type CommandEntry = {
  title: string;
  url: string;
  icon?: LucideIcon;
  parentTitle?: string;
};

const flattenNavigation = (items: NavigationItem[]): CommandEntry[] =>
  items.flatMap((item) => {
    const subItems =
      item.items?.map((subItem) => ({
        title: subItem.title,
        url: subItem.url,
        icon: item.icon,
        parentTitle: item.title,
      })) ?? [];

    return [
      {
        title: item.title,
        url: item.url,
        icon: item.icon,
      },
      ...subItems,
    ];
  });

const mapQuickLinks = (links: NavigationQuickLink[]): CommandEntry[] =>
  links.map((link) => ({
    title: link.name,
    url: link.url,
    icon: link.icon,
  }));

export function NavigationCommand() {
  const [open, setOpen] = useState(false);
  const tNav = useTranslations("nav");
  const tNavItems = useTranslations("nav.items");
  const router = useRouter();

  const navigation = useMemo(() => buildNavigationData(tNavItems), [tNavItems]);

  const mainCommands = useMemo(
    () => flattenNavigation(navigation.navMain),
    [navigation.navMain]
  );

  const quickLinkCommands = useMemo(
    () => mapQuickLinks(navigation.quickLinks),
    [navigation.quickLinks]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && (key === "f" || key === "k")) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-10 w-full justify-start gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open navigation search"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left text-sm">Search navigation...</span>
        <Kbd>Ctrl + F</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={tNav("navigation")}
        description="Search through dashboard navigation"
      >
        <CommandInput placeholder="Search navigation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={tNav("navigation")}>
            {mainCommands.map((item) => (
              <CommandItem
                key={`nav-${item.parentTitle ?? "root"}-${item.url}-${
                  item.title
                }`}
                value={`${item.title} ${item.parentTitle ?? ""}`}
                onSelect={() => handleSelect(item.url)}
              >
                {item.icon && <item.icon className="size-4" />}
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.parentTitle && (
                    <span className="text-xs text-muted-foreground">
                      {item.parentTitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={tNav("quickLinks")}>
            {quickLinkCommands.map((item) => (
              <CommandItem
                key={`quick-${item.url}-${item.title}`}
                value={item.title}
                onSelect={() => handleSelect(item.url)}
              >
                {item.icon && <item.icon className="size-4" />}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
