"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Key, Clock } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { securitySettingsSchema, SecuritySettingsInput } from "../schemas";
import {
  useSecuritySettings,
  useUpdateSecuritySettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

export function SecuritySettingsForm() {
  const t = useTranslations("settings.security");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useSecuritySettings();
  const { mutate: updateSettings, isPending } = useUpdateSecuritySettings();

  const form = useForm<SecuritySettingsInput>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        passwordMinLength: settings.passwordMinLength || 8,
        passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
        passwordRequireLowercase: settings.passwordRequireLowercase ?? true,
        passwordRequireNumber: settings.passwordRequireNumber ?? true,
        passwordRequireSpecial: settings.passwordRequireSpecial ?? false,
        sessionTimeout: settings.sessionTimeout || 60,
        maxLoginAttempts: settings.maxLoginAttempts || 5,
        lockoutDuration: settings.lockoutDuration || 15,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SecuritySettingsInput) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const tabs: SettingsTabItem[] = [
    {
      id: "password-policy",
      title: t("passwordPolicy"),
      description: t("passwordPolicyDescription"),
      icon: Key,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="passwordMinLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("minLength")}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={6}
                      max={32}
                      {...field}
                      value={field.value ?? 8}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 8)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("characters")}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormLabel>{t("requirements")}</FormLabel>

            <FormField
              control={form.control}
              name="passwordRequireUppercase"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("requireUppercase")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireLowercase"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("requireLowercase")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireNumber"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("requireNumber")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireSpecial"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("requireSpecial")}
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "session-lockout",
      title: t("sessionLockout"),
      description: t("sessionLockoutDescription"),
      icon: Clock,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="sessionTimeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sessionTimeout")}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={5}
                      {...field}
                      value={field.value ?? 60}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 60)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("minutes")}
                    </span>
                  </div>
                </FormControl>
                <FormDescription>{t("sessionTimeoutDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxLoginAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maxAttempts")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        value={field.value ?? 5}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 5)
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("attempts")}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>{t("maxAttemptsDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lockoutDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lockoutDuration")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? 15}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 15)
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("minutes")}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>{t("lockoutDurationDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="password-policy"
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
