"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Send, Server, Settings, Mail } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// SMTP Provider configurations
const smtpProviders = [
  { value: "custom", label: "Custom SMTP", host: "", port: 587 },
  { value: "gmail", label: "Gmail", host: "smtp.gmail.com", port: 587 },
  {
    value: "sendgrid",
    label: "SendGrid",
    host: "smtp.sendgrid.net",
    port: 587,
  },
  { value: "mailgun", label: "Mailgun", host: "smtp.mailgun.org", port: 587 },
  {
    value: "ses",
    label: "Amazon SES",
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
  },
];

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
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpProvider: "custom",
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: true,
      smtpUsername: "",
      smtpPassword: "",
      fromName: "",
      fromEmail: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        smtpProvider: settings.smtpProvider || "custom",
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure ?? true,
        smtpUsername: settings.smtpUsername || "",
        smtpPassword: settings.smtpPassword || "",
        fromName: settings.fromName || "",
        fromEmail: settings.fromEmail || "",
      });
    }
  }, [settings, form]);

  // Auto-fill host/port when provider changes
  const handleProviderChange = (value: string) => {
    form.setValue("smtpProvider", value as any);
    const provider = smtpProviders.find((p) => p.value === value);
    if (provider && provider.host) {
      form.setValue("smtpHost", provider.host);
      form.setValue("smtpPort", provider.port);
    }
  };

  const onSubmit = (data: EmailSettingsInput) => {
    updateSettings(data);
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
      id: "smtp-provider",
      title: t("smtpConfig"),
      description: t("smtpConfigDescription"),
      icon: Server,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="smtpProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("provider")}</FormLabel>
                <Select
                  onValueChange={handleProviderChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("providerPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {smtpProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("providerDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="smtpHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("host")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("hostPlaceholder")} {...field} />
                  </FormControl>
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
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 587)
                      }
                    />
                  </FormControl>
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
        </div>
      ),
    },
    {
      id: "smtp-authentication",
      title: t("authentication"),
      description: t("authenticationDescription"),
      icon: Settings,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="smtpUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("username")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("usernamePlaceholder")} {...field} />
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
                    <Input placeholder={t("fromNamePlaceholder")} {...field} />
                  </FormControl>
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
                    />
                  </FormControl>
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
          defaultTab="smtp-provider"
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
