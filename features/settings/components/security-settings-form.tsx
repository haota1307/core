"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Shield, Key, Clock, Bot } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { securitySettingsSchema, SecuritySettingsInput } from "../schemas";
import {
  useSecuritySettings,
  useUpdateSecuritySettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// CAPTCHA providers
const captchaProviders = [
  { value: "recaptcha", label: "Google reCAPTCHA" },
  { value: "hcaptcha", label: "hCaptcha" },
  { value: "turnstile", label: "Cloudflare Turnstile" },
];

export function SecuritySettingsForm() {
  const t = useTranslations("settings.security");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useSecuritySettings();
  const { mutate: updateSettings, isPending } = useUpdateSecuritySettings();

  const [showSecretKey, setShowSecretKey] = useState(false);

  const form = useForm<SecuritySettingsInput>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      requireTwoFactor: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableCaptcha: false,
      captchaProvider: "recaptcha",
      captchaSiteKey: "",
      captchaSecretKey: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        requireTwoFactor: settings.requireTwoFactor ?? false,
        passwordMinLength: settings.passwordMinLength || 8,
        passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
        passwordRequireLowercase: settings.passwordRequireLowercase ?? true,
        passwordRequireNumber: settings.passwordRequireNumber ?? true,
        passwordRequireSpecial: settings.passwordRequireSpecial ?? false,
        sessionTimeout: settings.sessionTimeout || 60,
        maxLoginAttempts: settings.maxLoginAttempts || 5,
        lockoutDuration: settings.lockoutDuration || 15,
        enableCaptcha: settings.enableCaptcha ?? false,
        captchaProvider: settings.captchaProvider || "recaptcha",
        captchaSiteKey: settings.captchaSiteKey || "",
        captchaSecretKey: settings.captchaSecretKey || "",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SecuritySettingsInput) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const enableCaptcha = form.watch("enableCaptcha");

  const tabs: SettingsTabItem[] = [
    {
      id: "two-factor",
      title: t("twoFactor"),
      description: t("twoFactorDescription"),
      icon: Shield,
      content: (
        <FormField
          control={form.control}
          name="requireTwoFactor"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("requireTwoFactor")}
                </FormLabel>
                <FormDescription>
                  {t("requireTwoFactorDescription")}
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
          <div className="grid gap-4 sm:grid-cols-3">
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 60)
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("minutes")}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "captcha",
      title: t("captcha"),
      description: t("captchaDescription"),
      icon: Bot,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="enableCaptcha"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableCaptcha")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableCaptchaDescription")}
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

          {enableCaptcha && (
            <>
              <FormField
                control={form.control}
                name="captchaProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("captchaProvider")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {captchaProviders.map((provider) => (
                          <SelectItem
                            key={provider.value}
                            value={provider.value}
                          >
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="captchaSiteKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("siteKey")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("siteKeyPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="captchaSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("secretKey")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showSecretKey ? "text" : "password"}
                            placeholder={t("secretKeyPlaceholder")}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecretKey(!showSecretKey)}
                          >
                            {showSecretKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="two-factor"
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
