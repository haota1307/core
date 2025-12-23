"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";

export type ClientSiteSettings = {
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
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    facebookPixelId?: string;
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

const defaultSettings: ClientSiteSettings = {
  general: {
    siteName: "My App",
    siteDescription: "A modern web application",
  },
  seo: {},
  localization: {
    currencyCode: "USD",
    currencySymbol: "$",
    currencyPosition: "before",
  },
};

type SettingsContextType = {
  settings: ClientSiteSettings;
  isLoading: boolean;
  error: Error | null;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  error: null,
});

async function fetchPublicSettings(): Promise<ClientSiteSettings> {
  const json = await http.get<{ data: ClientSiteSettings }>(
    "/api/settings/public",
    {
      auth: false,
    }
  );
  return {
    general: json.data?.general || {},
    seo: json.data?.seo || {},
    localization: json.data?.localization || {},
  };
}

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings?: ClientSiteSettings;
}

export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    initialData: initialSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const settings: ClientSiteSettings = {
    general: { ...defaultSettings.general, ...data?.general },
    seo: { ...defaultSettings.seo, ...data?.seo },
    localization: { ...defaultSettings.localization, ...data?.localization },
  };

  return (
    <SettingsContext.Provider
      value={{ settings, isLoading, error: error as Error | null }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function useSiteName() {
  const { settings } = useSettings();
  return settings.general.siteName || "My App";
}

export function useSiteLogo() {
  const { settings } = useSettings();
  return settings.general.siteLogo;
}

export function useCurrency() {
  const { settings } = useSettings();
  return {
    code: settings.localization.currencyCode || "USD",
    symbol: settings.localization.currencySymbol || "$",
    position: settings.localization.currencyPosition || "before",
    thousandSeparator: settings.localization.thousandSeparator || ",",
    decimalSeparator: settings.localization.decimalSeparator || ".",
  };
}

/**
 * Format a number as currency
 */
export function useFormatCurrency() {
  const currency = useCurrency();

  return (amount: number): string => {
    const formatted = amount
      .toFixed(2)
      .replace(".", currency.decimalSeparator)
      .replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);

    return currency.position === "before"
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`;
  };
}
