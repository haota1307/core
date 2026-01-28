import { z } from "zod";

// ============================================
// SETTING TYPES & ENUMS
// ============================================

export const SettingGroup = {
  GENERAL: "general",
  EMAIL: "email",
  MEDIA: "media",
  SECURITY: "security",
  NOTIFICATION: "notification",
  SEO: "seo",
  LOCALIZATION: "localization",
  BACKUP: "backup",
} as const;

export type SettingGroupType = (typeof SettingGroup)[keyof typeof SettingGroup];

export const SettingType = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
  ARRAY: "array",
} as const;

export type SettingTypeValue = (typeof SettingType)[keyof typeof SettingType];

// ============================================
// BASE SCHEMAS
// ============================================

export const settingSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  group: z.string(),
  type: z.string(),
  label: z.string().nullable(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type SettingResponse = z.infer<typeof settingSchema>;

// ============================================
// GENERAL SETTINGS
// ============================================

export const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().optional(),
  siteLogo: z.string().optional(),
  favicon: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string(),
  dateFormat: z.string(),
  maintenanceMode: z.boolean(),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

// ============================================
// EMAIL SETTINGS
// ============================================

export const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().positive(),
  smtpSecure: z.boolean(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

// ============================================
// EMAIL TEMPLATES
// ============================================

export const emailTemplateVariableSchema = z.object({
  key: z.string(),
  description: z.string(),
});

export const createEmailTemplateSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  bodyType: z.enum(["html", "markdown"]),
  description: z.string(),
  variables: z.array(emailTemplateVariableSchema),
  isActive: z.boolean(),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  subject: z.string().min(1, "Subject is required").optional(),
  body: z.string().min(1, "Body is required").optional(),
  bodyType: z.enum(["html", "markdown"]).optional(),
  description: z.string().optional(),
  variables: z.array(emailTemplateVariableSchema).optional(),
  isActive: z.boolean().optional(),
});

export const getEmailTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type EmailTemplateVariable = z.infer<typeof emailTemplateVariableSchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type GetEmailTemplatesQuery = z.infer<typeof getEmailTemplatesQuerySchema>;

export interface EmailTemplateResponse {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body: string;
  bodyType: string;
  description: string | null;
  variables: EmailTemplateVariable[] | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateListResponse {
  data: EmailTemplateResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// MEDIA SETTINGS
// ============================================

export const mediaSettingsSchema = z.object({
  // Storage configuration
  storageProvider: z.enum(["local", "cloudinary"]),
  
  // Local storage settings
  localUploadPath: z.string().optional(), // e.g., "uploads" or "/var/www/uploads"
  
  // Cloudinary settings (required when storageProvider is "cloudinary")
  cloudinaryCloudName: z.string().optional(),
  cloudinaryApiKey: z.string().optional(),
  cloudinaryApiSecret: z.string().optional(),
  cloudinaryUploadPreset: z.string().optional(),
  
  // File size limits
  maxFileSize: z.number().int().positive(), // MB
  maxVideoSize: z.number().int().positive().optional(), // MB - separate limit for videos
  
  // Allowed file types
  allowedImageTypes: z.array(z.string()),
  allowedDocumentTypes: z.array(z.string()),
  allowedVideoTypes: z.array(z.string()),
  
  // Image processing
  imageQuality: z.number().int().min(1).max(100),
  autoGenerateThumbnails: z.boolean(),
  thumbnailSizes: z.array(z.string()),
  
  // Cloudinary image optimization
  enableImageOptimization: z.boolean().optional(),
  imageOptimizationQuality: z.enum(["auto", "auto:low", "auto:eco", "auto:good", "auto:best"]).optional(),
  imageOptimizationFormat: z.enum(["auto", "webp", "avif", "jpg", "png"]).optional(),
  maxImageWidth: z.number().int().positive().optional(), // Max width in pixels
  maxImageHeight: z.number().int().positive().optional(), // Max height in pixels
  
  // Watermark settings
  enableWatermark: z.boolean(),
  watermarkImage: z.string().optional(),
  watermarkPosition: z.enum([
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "center",
  ]),
  watermarkOpacity: z.number().int().min(1).max(100),
  
  // Video encryption settings (DRM-like protection)
  enableVideoEncryption: z.boolean(),
  videoEncryptionMethod: z.enum(["hls-aes", "dash-clearkey", "none"]).optional(),
  videoEncryptionKey: z.string().optional(), // 16-byte hex key for AES-128
  enableVideoWatermark: z.boolean().optional(), // Overlay user info on video
  videoQualityPresets: z.array(z.string()).optional(), // e.g., ["360p", "720p", "1080p"]
});

export type MediaSettingsInput = z.infer<typeof mediaSettingsSchema>;

// ============================================
// SECURITY SETTINGS
// ============================================

export const securitySettingsSchema = z.object({
  passwordMinLength: z.number().int().min(6).max(32),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumber: z.boolean(),
  passwordRequireSpecial: z.boolean(),
  sessionTimeout: z.number().int().positive(), // minutes
  maxLoginAttempts: z.number().int().positive(),
  lockoutDuration: z.number().int().positive(), // minutes
});

export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;

// ============================================
// NOTIFICATION SETTINGS
// ============================================

export const notificationSettingsSchema = z.object({
  // Email notifications
  emailOnNewUser: z.boolean(),
  emailOnPasswordReset: z.boolean(),
  emailOnLoginAlert: z.boolean(),
  emailOnSystemAlert: z.boolean(),
  // In-app notifications
  enablePushNotifications: z.boolean(),
  enableRealtimeUpdates: z.boolean(),
  // Digest settings
  enableDailyDigest: z.boolean(),
  enableWeeklyReport: z.boolean(),
  digestTime: z.string(),
  adminEmails: z.array(z.string()),
});

export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;

// ============================================
// SEO SETTINGS
// ============================================

export const seoSettingsSchema = z.object({
  // Meta tags
  defaultMetaTitle: z.string().optional(),
  defaultMetaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()),
  // Open Graph
  ogImage: z.string().optional(),
  ogSiteName: z.string().optional(),
  // Twitter Card
  twitterCardType: z.enum(["summary", "summary_large_image"]),
  twitterSite: z.string().optional(),
  // Analytics
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  // Robots
  robotsTxt: z.string().optional(),
  enableSitemap: z.boolean(),
  enableIndexing: z.boolean(),
});

export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;

// ============================================
// LOCALIZATION SETTINGS
// ============================================

export const localizationSettingsSchema = z.object({
  defaultLanguage: z.string(),
  availableLanguages: z.array(z.string()),
  autoDetectLanguage: z.boolean(),
  defaultCurrency: z.string(),
  currencySymbolPosition: z.enum(["before", "after"]),
  numberFormat: z.enum(["1,234.56", "1.234,56", "1 234,56"]),
  enableRtl: z.boolean(),
});

export type LocalizationSettingsInput = z.infer<
  typeof localizationSettingsSchema
>;

// ============================================
// BACKUP SETTINGS
// ============================================

export const backupSettingsSchema = z.object({
  enableAutoBackup: z.boolean(),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  backupRetention: z.number().int().positive(), // number of backups to keep
  backupTime: z.string(),
  includeMedia: z.boolean(),
  includeDatabase: z.boolean(),
  storageLocation: z.enum(["local", "s3", "google-drive"]),
});

export type BackupSettingsInput = z.infer<typeof backupSettingsSchema>;

// ============================================
// QUERY SCHEMAS
// ============================================

export const getSettingsQuerySchema = z.object({
  group: z.string().optional(),
  key: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
});

export type GetSettingsQuery = z.infer<typeof getSettingsQuerySchema>;

// ============================================
// UPDATE SCHEMAS
// ============================================

export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export const updateSettingsSchema = z.object({
  settings: z.array(updateSettingSchema),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SettingsGroupResponse {
  group: string;
  settings: Record<string, unknown>;
}

export interface SettingsListResponse {
  data: SettingResponse[];
}
