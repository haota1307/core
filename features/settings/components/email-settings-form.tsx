"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Send, Server, Mail, FileText } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { emailSettingsSchema, EmailSettingsInput } from "../schemas";
import {
  useEmailSettings,
  useUpdateEmailSettings,
  useTestEmailSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";
import { EmailTemplateList } from "./email-template-list";

export function EmailSettingsForm() {
  const t = useTranslations("settings.email");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useEmailSettings();
  const { mutate: updateSettings, isPending } = useUpdateEmailSettings();
  const { mutate: testEmail, isPending: isTestingEmail } =
    useTestEmailSettings();

  const [showPassword, setShowPassword] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const form = useForm<EmailSettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(emailSettingsSchema) as any,
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: true,
      smtpUsername: "",
      smtpPassword: "",
      fromName: "",
      fromEmail: "",
    },
  });

  // Update form when settings are loaded (only once when settings change)
  useEffect(() => {
    if (settings) {
      form.reset({
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure ?? true,
        smtpUsername: settings.smtpUsername || "",
        smtpPassword: settings.smtpPassword || "",
        fromName: settings.fromName || "",
        fromEmail: settings.fromEmail || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = (data: EmailSettingsInput) => {
    // Ensure correct types before submission
    const payload = {
      ...data,
      smtpPort: Number(data.smtpPort) || 587,
      smtpSecure: Boolean(data.smtpSecure),
    };
    updateSettings(payload);
  };

  const handleTestEmail = () => {
    if (testEmailAddress) {
      testEmail(testEmailAddress);
      setTestDialogOpen(false);
      setTestEmailAddress("");
    }
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const tabs: SettingsTabItem[] = [
    {
      id: "smtp-config",
      title: t("smtpConfig"),
      description: t("smtpConfigDescription"),
      icon: Server,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="smtpHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("host")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("hostPlaceholder")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>{t("hostDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smtpPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("port")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="587"
                      {...field}
                      value={field.value ?? 587}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 587)
                      }
                    />
                  </FormControl>
                  <FormDescription>{t("portDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="smtpSecure"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("secure")}</FormLabel>
                  <FormDescription>{t("secureDescription")}</FormDescription>
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
            name="smtpUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("username")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("usernamePlaceholder")} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="smtpPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>{t("passwordDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "sender-info",
      title: t("senderInfo"),
      description: t("senderInfoDescription"),
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fromName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fromName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("fromNamePlaceholder")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>{t("fromNameDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fromEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("fromEmailPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>{t("fromEmailDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "email-templates",
      title: t("templates.tabTitle"),
      description: t("templates.tabDescription"),
      icon: FileText,
      content: <EmailTemplateList />,
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="smtp-config"
          title={t("title")}
          description={t("description")}
          footer={
            <div className="flex justify-between">
              <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Send className="mr-2 h-4 w-4" />
                    {t("testEmail")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("testEmailTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("testEmailDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      type="email"
                      placeholder={t("testEmailPlaceholder")}
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTestDialogOpen(false)}
                    >
                      {tCommon("cancel")}
                    </Button>
                    <Button
                      onClick={handleTestEmail}
                      disabled={!testEmailAddress || isTestingEmail}
                    >
                      {isTestingEmail && <Spinner className="mr-2 h-4 w-4" />}
                      {t("sendTest")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
