import { Locale } from "@/i18n/config";

/**
 * Utility functions for i18n
 */

/**
 * Get the direction for a locale (for RTL support)
 */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  // Add RTL locales here if needed (e.g., 'ar', 'he')
  const rtlLocales: Locale[] = [];
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format a number according to locale
 */
export function formatNumber(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = "VND"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
