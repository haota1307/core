"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Download,
  Upload,
  RefreshCw,
  Clock,
  HardDrive,
  Database,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { backupSettingsSchema, BackupSettingsInput } from "../schemas";
import {
  useBackupSettings,
  useUpdateBackupSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";
import { toast } from "sonner";

// Backup frequencies
const backupFrequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Storage locations
const storageLocations = [
  { value: "local", label: "Local Storage" },
  { value: "s3", label: "Amazon S3" },
  { value: "google-drive", label: "Google Drive" },
];

export function BackupSettingsForm() {
  const t = useTranslations("settings.backup");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useBackupSettings();
  const { mutate: updateSettings, isPending } = useUpdateBackupSettings();

  const form = useForm<BackupSettingsInput>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      enableAutoBackup: false,
      backupFrequency: "weekly",
      backupRetention: 7,
      backupTime: "02:00",
      includeMedia: true,
      includeDatabase: true,
      storageLocation: "local",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        enableAutoBackup: settings.enableAutoBackup ?? false,
        backupFrequency: settings.backupFrequency || "weekly",
        backupRetention: settings.backupRetention || 7,
        backupTime: settings.backupTime || "02:00",
        includeMedia: settings.includeMedia ?? true,
        includeDatabase: settings.includeDatabase ?? true,
        storageLocation: settings.storageLocation || "local",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: BackupSettingsInput) => {
    updateSettings(data);
  };

  const handleCreateBackup = () => {
    // TODO: Implement backup creation
    toast.success(t("backupCreated"));
  };

  const handleExportSettings = () => {
    // TODO: Implement settings export
    toast.success(t("settingsExported"));
  };

  const handleImportSettings = () => {
    // TODO: Implement settings import
    toast.success(t("settingsImported"));
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const enableAutoBackup = form.watch("enableAutoBackup");

  const tabs: SettingsTabItem[] = [
    {
      id: "schedule",
      title: t("autoBackup"),
      description: t("autoBackupDescription"),
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 mb-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("createBackup")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("createBackupTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("createBackupDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCreateBackup}>
                    {t("createBackup")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={handleExportSettings}>
              <Download className="mr-2 h-4 w-4" />
              {t("exportSettings")}
            </Button>

            <Button variant="outline" onClick={handleImportSettings}>
              <Upload className="mr-2 h-4 w-4" />
              {t("importSettings")}
            </Button>
          </div>

          <FormField
            control={form.control}
            name="enableAutoBackup"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableAutoBackup")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableAutoBackupDescription")}
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

          {enableAutoBackup && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="backupFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("frequency")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {backupFrequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
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
                  name="backupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("backupTime")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="w-32" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="backupRetention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("retention")}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 7)
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          {t("backups")}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t("retentionDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      ),
    },
    {
      id: "storage",
      title: t("storageLocation"),
      description: t("storageLocationDescription"),
      icon: HardDrive,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="storageLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("location")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageLocations.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("locationDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "database",
      title: t("backupContent"),
      description: t("backupContentDescription"),
      icon: Database,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="includeDatabase"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("includeDatabase")}
                  </FormLabel>
                  <FormDescription>
                    {t("includeDatabaseDescription")}
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
            name="includeMedia"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("includeMedia")}
                  </FormLabel>
                  <FormDescription>
                    {t("includeMediaDescription")}
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
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="schedule"
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
