import prisma from "@/lib/prisma";

export type SiteSettings = {
  general: {
    siteName?: string;
    siteDescription?: string;
    siteLogo?: string;
    favicon?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    timezone?: string;
    dateFormat?: string;
    maintenanceMode?: boolean;
  };
  seo: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    defaultMetaKeywords?: string;
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    facebookPixelId?: string;
    enableSitemap?: boolean;
    robotsTxt?: string;
  };
  localization: {
    defaultLocale?: string;
    availableLocales?: string[];
    currencyCode?: string;
    currencySymbol?: string;
    currencyPosition?: string;
    thousandSeparator?: string;
    decimalSeparator?: string;
  };
};

const defaultSettings: SiteSettings = {
  general: {
    siteName: "My App",
    siteDescription: "A modern web application",
    timezone: "Asia/Ho_Chi_Minh",
    dateFormat: "DD/MM/YYYY",
    maintenanceMode: false,
  },
  seo: {
    enableSitemap: true,
  },
  localization: {
    defaultLocale: "en",
    availableLocales: ["en", "vi"],
    currencyCode: "USD",
    currencySymbol: "$",
    currencyPosition: "before",
    thousandSeparator: ",",
    decimalSeparator: ".",
  },
};

/**
 * Get site settings from database (server-side only)
 * This function is cached and can be used in Server Components
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        isPublic: true,
        group: {
          in: ["general", "seo", "localization"],
        },
      },
      select: {
        key: true,
        value: true,
        group: true,
      },
    });

    // Merge with defaults
    const result: SiteSettings = { ...defaultSettings };

    for (const setting of settings) {
      const group = setting.group as keyof SiteSettings;
      if (result[group]) {
        (result[group] as any)[setting.key] = setting.value;
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return defaultSettings;
  }
}

/**
 * Get a specific setting by key (server-side only)
 */
export async function getSetting<T = unknown>(
  key: string,
  defaultValue?: T
): Promise<T> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });

    return (setting?.value as T) ?? (defaultValue as T);
  } catch (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return defaultValue as T;
  }
}

/**
 * Get settings by group (server-side only)
 */
export async function getSettingsByGroup(
  group: string
): Promise<Record<string, unknown>> {
  try {
    const settings = await prisma.setting.findMany({
      where: { group },
      select: {
        key: true,
        value: true,
      },
    });

    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  } catch (error) {
    console.error(`Failed to fetch settings for group ${group}:`, error);
    return {};
  }
}

export type SecuritySettings = {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
};

const defaultSecuritySettings: SecuritySettings = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
};

/**
 * Get security settings from database (server-side only)
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const settings = await prisma.setting.findMany({
      where: { group: "security" },
      select: {
        key: true,
        value: true,
      },
    });

    const result: SecuritySettings = { ...defaultSecuritySettings };

    for (const setting of settings) {
      const key = setting.key as keyof SecuritySettings;
      if (key in result) {
        (result as any)[key] = setting.value;
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch security settings:", error);
    return defaultSecuritySettings;
  }
}

/**
 * Validate password against security policy
 */
export function validatePasswordPolicy(
  password: string,
  settings: SecuritySettings
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < settings.passwordMinLength) {
    errors.push(
      `Password must be at least ${settings.passwordMinLength} characters`
    );
  }

  if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (settings.passwordRequireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    settings.passwordRequireSpecial &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
