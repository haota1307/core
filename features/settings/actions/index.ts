import { http } from "@/lib/http";
import {
  SettingsGroupResponse,
  SettingsListResponse,
  GetSettingsQuery,
  GeneralSettingsInput,
  EmailSettingsInput,
  MediaSettingsInput,
  SecuritySettingsInput,
  NotificationSettingsInput,
  SeoSettingsInput,
  LocalizationSettingsInput,
  BackupSettingsInput,
  SettingGroup,
} from "../schemas";

/**
 * Get all settings
 */
export async function getSettingsAction(query?: GetSettingsQuery) {
  try {
    const params = new URLSearchParams();
    if (query?.group) params.append("group", query.group);
    if (query?.key) params.append("key", query.key);
    if (query?.isPublic !== undefined)
      params.append("isPublic", String(query.isPublic));

    const queryString = params.toString();
    const url = `/api/settings${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<SettingsListResponse>(url);
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch settings",
    };
  }
}

/**
 * Get settings by group
 */
export async function getSettingsByGroupAction(group: string) {
  try {
    const response = await http.get<SettingsGroupResponse>(
      `/api/settings/group/${group}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch settings",
    };
  }
}

/**
 * Update general settings
 */
export async function updateGeneralSettingsAction(input: GeneralSettingsInput) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.GENERAL}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update email settings
 */
export async function updateEmailSettingsAction(input: EmailSettingsInput) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.EMAIL}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update media settings
 */
export async function updateMediaSettingsAction(input: MediaSettingsInput) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.MEDIA}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update security settings
 */
export async function updateSecuritySettingsAction(
  input: SecuritySettingsInput
) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.SECURITY}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettingsAction(
  input: NotificationSettingsInput
) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.NOTIFICATION}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update SEO settings
 */
export async function updateSeoSettingsAction(input: SeoSettingsInput) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.SEO}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update localization settings
 */
export async function updateLocalizationSettingsAction(
  input: LocalizationSettingsInput
) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.LOCALIZATION}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Update backup settings
 */
export async function updateBackupSettingsAction(input: BackupSettingsInput) {
  try {
    const response = await http.put<{ message: string }>(
      `/api/settings/group/${SettingGroup.BACKUP}`,
      input
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update settings",
    };
  }
}

/**
 * Test email settings
 */
export async function testEmailSettingsAction(email: string) {
  try {
    const response = await http.post<{ message: string }>(
      `/api/settings/email/test`,
      { email }
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send test email",
    };
  }
}

// ============================================
// EMAIL TEMPLATE ACTIONS
// ============================================

import {
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  GetEmailTemplatesQuery,
  EmailTemplateListResponse,
  EmailTemplateResponse,
} from "../schemas";

/**
 * Get email templates list
 */
export async function getEmailTemplatesAction(query: GetEmailTemplatesQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.isActive !== undefined) params.append("isActive", String(query.isActive));

    const response = await http.get<EmailTemplateListResponse>(
      `/api/settings/email/templates?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch email templates",
    };
  }
}

/**
 * Get single email template
 */
export async function getEmailTemplateAction(id: string) {
  try {
    const response = await http.get<{ data: EmailTemplateResponse }>(
      `/api/settings/email/templates/${id}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch email template",
    };
  }
}

/**
 * Create email template
 */
export async function createEmailTemplateAction(input: CreateEmailTemplateInput) {
  try {
    const response = await http.post<{ data: EmailTemplateResponse; message: string }>(
      `/api/settings/email/templates`,
      input
    );
    return { success: true, data: response.data, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create email template",
    };
  }
}

/**
 * Update email template
 */
export async function updateEmailTemplateAction(id: string, input: UpdateEmailTemplateInput) {
  try {
    const response = await http.patch<{ data: EmailTemplateResponse; message: string }>(
      `/api/settings/email/templates/${id}`,
      input
    );
    return { success: true, data: response.data, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update email template",
    };
  }
}

/**
 * Delete email template
 */
export async function deleteEmailTemplateAction(id: string) {
  try {
    const response = await http.delete<{ message: string }>(
      `/api/settings/email/templates/${id}`
    );
    return { success: true, message: response.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete email template",
    };
  }
}