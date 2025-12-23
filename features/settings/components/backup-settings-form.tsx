"use client";

import { useEffect, useRef, useState } from "react";
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
  Trash2,
  RotateCcw,
  FileJson,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { backupSettingsSchema, BackupSettingsInput } from "../schemas";
import {
  useBackupSettings,
  useUpdateBackupSettings,
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackup,
  useExportSettings,
  useImportSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

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

  // Backup hooks
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreBackup = useRestoreBackup();
  const exportSettings = useExportSettings();
  const importSettings = useImportSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  const handleCreateBackup = () => {
    createBackup.mutate({
      includeDatabase: form.getValues("includeDatabase"),
      includeMedia: form.getValues("includeMedia"),
      includeSettings: true,
    });
  };

  const handleExportSettings = () => {
    exportSettings.mutate();
  };

  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importSettings.mutate(file);
      e.target.value = "";
    }
  };

  const handleDownloadBackup = async (id: string, filename: string) => {
    try {
      const { getAccessToken } = await import("@/lib/cookies");
      const token = getAccessToken();

      const response = await fetch(`/api/backup/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to download backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleDeleteBackup = (id: string) => {
    deleteBackup.mutate(id);
  };

  const handleRestoreBackup = (id: string) => {
    setSelectedBackupId(id);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    if (selectedBackupId) {
      restoreBackup.mutate({ id: selectedBackupId });
      setRestoreDialogOpen(false);
      setSelectedBackupId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

            <Button
              variant="outline"
              onClick={handleExportSettings}
              disabled={exportSettings.isPending}
            >
              {exportSettings.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t("exportSettings")}
            </Button>

            <Button
              variant="outline"
              onClick={handleImportSettings}
              disabled={importSettings.isPending}
            >
              {importSettings.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {t("importSettings")}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
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
    {
      id: "history",
      title: t("backupHistory"),
      description: t("backupHistoryDescription"),
      icon: FileJson,
      content: (
        <div className="space-y-4">
          {backupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("filename")}</TableHead>
                    <TableHead>{t("size")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("createdAt")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-sm">
                        {backup.filename}
                      </TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            backup.status === "completed"
                              ? "default"
                              : backup.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(backup.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDownloadBackup(backup.id, backup.filename)
                            }
                            title={t("download")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestoreBackup(backup.id)}
                            title={t("restore")}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBackup(backup.id)}
                            title={tCommon("delete")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("noBackups")}
            </div>
          )}

          {/* Restore confirmation dialog */}
          <AlertDialog
            open={restoreDialogOpen}
            onOpenChange={setRestoreDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("restoreTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("restoreDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRestore}>
                  {t("restore")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
