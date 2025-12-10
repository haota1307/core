export type Locale = "en" | "vi";

export const locales: Locale[] = ["en", "vi"];

export const defaultLocale: Locale = "vi";

export const localeNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  vi: "🇻🇳",
};
