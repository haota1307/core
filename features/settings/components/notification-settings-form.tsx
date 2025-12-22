"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail, Bell, MessageSquare } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import {
  notificationSettingsSchema,
  NotificationSettingsInput,
} from "../schemas";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

export function NotificationSettingsForm() {
  const t = useTranslations("settings.notifications");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useNotificationSettings();
  const { mutate: updateSettings, isPending } = useUpdateNotificationSettings();

  const form = useForm<NotificationSettingsInput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailOnNewUser: true,
      emailOnPasswordReset: true,
      emailOnLoginAlert: false,
      emailOnSystemAlert: true,
      enablePushNotifications: false,
      enableRealtimeUpdates: true,
      enableDailyDigest: false,
      enableWeeklyReport: false,
      digestTime: "09:00",
      adminEmails: [],
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        emailOnNewUser: settings.emailOnNewUser ?? true,
        emailOnPasswordReset: settings.emailOnPasswordReset ?? true,
        emailOnLoginAlert: settings.emailOnLoginAlert ?? false,
        emailOnSystemAlert: settings.emailOnSystemAlert ?? true,
        enablePushNotifications: settings.enablePushNotifications ?? false,
        enableRealtimeUpdates: settings.enableRealtimeUpdates ?? true,
        enableDailyDigest: settings.enableDailyDigest ?? false,
        enableWeeklyReport: settings.enableWeeklyReport ?? false,
        digestTime: settings.digestTime || "09:00",
        adminEmails: settings.adminEmails || [],
      });
    }
  }, [settings, form]);

  const onSubmit = (data: NotificationSettingsInput) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const tabs: SettingsTabItem[] = [
    {
      id: "email",
      title: t("emailNotifications"),
      description: t("emailNotificationsDescription"),
      icon: Mail,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="emailOnNewUser"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("newUser")}</FormLabel>
                  <FormDescription>{t("newUserDescription")}</FormDescription>
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

          <FormField
            control={form.control}
            name="emailOnPasswordReset"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("passwordReset")}
                  </FormLabel>
                  <FormDescription>
                    {t("passwordResetDescription")}
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

          <FormField
            control={form.control}
            name="emailOnLoginAlert"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("loginAlert")}</FormLabel>
                  <FormDescription>
                    {t("loginAlertDescription")}
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

          <FormField
            control={form.control}
            name="emailOnSystemAlert"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("systemAlert")}
                  </FormLabel>
                  <FormDescription>
                    {t("systemAlertDescription")}
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
        </div>
      ),
    },
    {
      id: "push",
      title: t("inAppNotifications"),
      description: t("inAppNotificationsDescription"),
      icon: Bell,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="enablePushNotifications"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("pushNotifications")}
                  </FormLabel>
                  <FormDescription>
                    {t("pushNotificationsDescription")}
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

          <FormField
            control={form.control}
            name="enableRealtimeUpdates"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("realtimeUpdates")}
                  </FormLabel>
                  <FormDescription>
                    {t("realtimeUpdatesDescription")}
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
        </div>
      ),
    },
    {
      id: "digest",
      title: t("digest"),
      description: t("digestDescription"),
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="enableDailyDigest"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("dailyDigest")}
                  </FormLabel>
                  <FormDescription>
                    {t("dailyDigestDescription")}
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

          <FormField
            control={form.control}
            name="enableWeeklyReport"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("weeklyReport")}
                  </FormLabel>
                  <FormDescription>
                    {t("weeklyReportDescription")}
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

          <FormField
            control={form.control}
            name="digestTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("digestTime")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="w-32" />
                </FormControl>
                <FormDescription>{t("digestTimeDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="email"
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
