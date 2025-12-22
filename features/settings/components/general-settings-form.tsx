"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Globe, Mail, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { generalSettingsSchema, GeneralSettingsInput } from "../schemas";
import {
  useGeneralSettings,
  useUpdateGeneralSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// Timezone options
const timezones = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (GMT+7)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+7)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
  { value: "America/New_York", label: "America/New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (GMT-8)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

// Date format options
const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2024)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (31.12.2024)" },
];

export function GeneralSettingsForm() {
  const t = useTranslations("settings.general");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useGeneralSettings();
  const { mutate: updateSettings, isPending } = useUpdateGeneralSettings();

  const form = useForm<GeneralSettingsInput>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "",
      siteDescription: "",
      siteLogo: "",
      favicon: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      timezone: "Asia/Ho_Chi_Minh",
      dateFormat: "DD/MM/YYYY",
      maintenanceMode: false,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        siteName: settings.siteName || "",
        siteDescription: settings.siteDescription || "",
        siteLogo: settings.siteLogo || "",
        favicon: settings.favicon || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        address: settings.address || "",
        timezone: settings.timezone || "Asia/Ho_Chi_Minh",
        dateFormat: settings.dateFormat || "DD/MM/YYYY",
        maintenanceMode: settings.maintenanceMode || false,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: GeneralSettingsInput) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  // Define tabs for different sections
  const tabs: SettingsTabItem[] = [
    {
      id: "site-info",
      title: t("siteInfo"),
      description: t("siteInfoDescription"),
      icon: Globe,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="siteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("siteName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("siteNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="siteDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("siteDescription")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("siteDescriptionPlaceholder")}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="siteLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("siteLogo")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("siteLogoPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("siteLogoDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("favicon")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("faviconPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("faviconDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "contact-info",
      title: t("contactInfo"),
      description: t("contactInfoDescription"),
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("contactEmailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactPhone")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("contactPhonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("address")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("addressPlaceholder")}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "regional",
      title: t("regional"),
      description: t("regionalDescription"),
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("timezone")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("timezonePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dateFormat")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("dateFormatPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dateFormats.map((df) => (
                        <SelectItem key={df.value} value={df.value}>
                          {df.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "maintenance",
      title: t("maintenance"),
      description: t("maintenanceDescription"),
      icon: AlertTriangle,
      content: (
        <FormField
          control={form.control}
          name="maintenanceMode"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("maintenanceMode")}
                </FormLabel>
                <FormDescription>
                  {t("maintenanceModeDescription")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="site-info"
          title={t("title")}
          description={t("description")}
          footer={
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {tCommon("save")}
              </Button>
            </div>
          }
        />
      </form>
    </Form>
  );
}
