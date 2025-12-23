"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { http } from "@/lib/http";
import { getAccessToken } from "@/lib/cookies";
import {
  getSettingsByGroupAction,
  updateGeneralSettingsAction,
  updateEmailSettingsAction,
  updateMediaSettingsAction,
  updateSecuritySettingsAction,
  updateNotificationSettingsAction,
  updateSeoSettingsAction,
  updateLocalizationSettingsAction,
  updateBackupSettingsAction,
  testEmailSettingsAction,
} from "../actions";
import {
  SettingGroup,
  GeneralSettingsInput,
  EmailSettingsInput,
  MediaSettingsInput,
  SecuritySettingsInput,
  NotificationSettingsInput,
  SeoSettingsInput,
  LocalizationSettingsInput,
  BackupSettingsInput,
} from "../schemas";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  groups: () => [...settingsKeys.all, "group"] as const,
  group: (group: string) => [...settingsKeys.groups(), group] as const,
};

/**
 * Hook to get settings by group
 */
export function useSettingsByGroup<T = Record<string, unknown>>(
  group: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: settingsKeys.group(group),
    queryFn: async () => {
      const result = await getSettingsByGroupAction(group);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data?.settings as T;
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get general settings
 */
export function useGeneralSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<GeneralSettingsInput>(
    SettingGroup.GENERAL,
    options
  );
}

/**
 * Hook to get email settings
 */
export function useEmailSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<EmailSettingsInput>(SettingGroup.EMAIL, options);
}

/**
 * Hook to get media settings
 */
export function useMediaSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<MediaSettingsInput>(SettingGroup.MEDIA, options);
}

/**
 * Hook to get security settings
 */
export function useSecuritySettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<SecuritySettingsInput>(
    SettingGroup.SECURITY,
    options
  );
}

/**
 * Hook to get notification settings
 */
export function useNotificationSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<NotificationSettingsInput>(
    SettingGroup.NOTIFICATION,
    options
  );
}

/**
 * Hook to get SEO settings
 */
export function useSeoSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<SeoSettingsInput>(SettingGroup.SEO, options);
}

/**
 * Hook to get localization settings
 */
export function useLocalizationSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<LocalizationSettingsInput>(
    SettingGroup.LOCALIZATION,
    options
  );
}

/**
 * Hook to get backup settings
 */
export function useBackupSettings(options?: { enabled?: boolean }) {
  return useSettingsByGroup<BackupSettingsInput>(SettingGroup.BACKUP, options);
}

/**
 * Hook to update general settings
 */
export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateGeneralSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.GENERAL),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update email settings
 */
export function useUpdateEmailSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateEmailSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.EMAIL),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update media settings
 */
export function useUpdateMediaSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateMediaSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.MEDIA),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update security settings
 */
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateSecuritySettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.SECURITY),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateNotificationSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.NOTIFICATION),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update SEO settings
 */
export function useUpdateSeoSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateSeoSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.SEO),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update localization settings
 */
export function useUpdateLocalizationSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateLocalizationSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.LOCALIZATION),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to update backup settings
 */
export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: updateBackupSettingsAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        queryClient.invalidateQueries({
          queryKey: settingsKeys.group(SettingGroup.BACKUP),
        });
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to test email settings
 */
export function useTestEmailSettings() {
  const t = useTranslations("settings");

  return useMutation({
    mutationFn: (email: string) => testEmailSettingsAction(email),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("email.testSuccess"));
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Backup types
export interface Backup {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: string;
  includeDatabase: boolean;
  includeMedia: boolean;
  includeSettings: boolean;
  createdAt: string;
}

// Backup query keys
export const backupKeys = {
  all: ["backups"] as const,
  list: () => [...backupKeys.all, "list"] as const,
};

/**
 * Hook to list all backups
 */
export function useBackups() {
  return useQuery({
    queryKey: backupKeys.list(),
    queryFn: async () => {
      const data = await http.get<{ backups: Backup[] }>("/api/backup");
      return data.backups;
    },
  });
}

/**
 * Hook to create a backup
 */
export function useCreateBackup() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings.backup");

  return useMutation({
    mutationFn: async (options?: {
      includeDatabase?: boolean;
      includeMedia?: boolean;
      includeSettings?: boolean;
    }) => {
      return http.post("/api/backup", options || {});
    },
    onSuccess: () => {
      toast.success(t("backupCreated"));
      queryClient.invalidateQueries({ queryKey: backupKeys.list() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to delete a backup
 */
export function useDeleteBackup() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings.backup");

  return useMutation({
    mutationFn: async (id: string) => {
      return http.delete(`/api/backup/${id}`);
    },
    onSuccess: () => {
      toast.success(t("backupDeleted"));
      queryClient.invalidateQueries({ queryKey: backupKeys.list() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to restore a backup
 */
export function useRestoreBackup() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings.backup");

  return useMutation({
    mutationFn: async ({
      id,
      options,
    }: {
      id: string;
      options?: { restoreDatabase?: boolean; restoreSettings?: boolean };
    }) => {
      return http.post(`/api/backup/${id}/restore`, options || {});
    },
    onSuccess: () => {
      toast.success(t("backupRestored"));
      // Invalidate all settings queries after restore
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to export settings
 */
export function useExportSettings() {
  const t = useTranslations("settings.backup");

  return useMutation({
    mutationFn: async () => {
      // Need to use fetch for blob response, but with auth token
      const token = getAccessToken();
      const response = await fetch("/api/backup/export-settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Failed to export settings");
      }
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "settings.json";

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success(t("settingsExported"));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to import settings
 */
export function useImportSettings() {
  const queryClient = useQueryClient();
  const t = useTranslations("settings.backup");

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text);

      return http.post<{ importedCount: number }>(
        "/api/backup/export-settings",
        data
      );
    },
    onSuccess: (data) => {
      toast.success(t("settingsImported", { count: data.importedCount }));
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
