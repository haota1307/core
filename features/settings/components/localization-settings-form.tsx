"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Languages, DollarSign, Calendar } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import {
  localizationSettingsSchema,
  LocalizationSettingsInput,
} from "../schemas";
import {
  useLocalizationSettings,
  useUpdateLocalizationSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// Available languages
const languages = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ar", label: "العربية" },
  { value: "th", label: "ไทย" },
];

// Currencies
const currencies = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "VND", label: "VND - Vietnamese Dong", symbol: "₫" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
  { value: "KRW", label: "KRW - Korean Won", symbol: "₩" },
];

// Number formats
const numberFormats = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (EU)" },
  { value: "1 234,56", label: "1 234,56 (FR)" },
];

export function LocalizationSettingsForm() {
  const t = useTranslations("settings.localization");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useLocalizationSettings();
  const { mutate: updateSettings, isPending } = useUpdateLocalizationSettings();

  const form = useForm<LocalizationSettingsInput>({
    resolver: zodResolver(localizationSettingsSchema),
    defaultValues: {
      defaultLanguage: "en",
      availableLanguages: ["en", "vi"],
      autoDetectLanguage: true,
      defaultCurrency: "USD",
      currencySymbolPosition: "before",
      numberFormat: "1,234.56",
      enableRtl: false,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        defaultLanguage: settings.defaultLanguage || "en",
        availableLanguages: settings.availableLanguages || ["en", "vi"],
        autoDetectLanguage: settings.autoDetectLanguage ?? true,
        defaultCurrency: settings.defaultCurrency || "USD",
        currencySymbolPosition: settings.currencySymbolPosition || "before",
        numberFormat: settings.numberFormat || "1,234.56",
        enableRtl: settings.enableRtl ?? false,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: LocalizationSettingsInput) => {
    updateSettings(data);
  };

  // Toggle language selection
  const toggleLanguage = (langCode: string) => {
    const currentLanguages = form.getValues("availableLanguages") || [];
    const defaultLang = form.getValues("defaultLanguage");

    // Don't allow removing the default language
    if (langCode === defaultLang && currentLanguages.includes(langCode)) {
      return;
    }

    const newLanguages = currentLanguages.includes(langCode)
      ? currentLanguages.filter((l) => l !== langCode)
      : [...currentLanguages, langCode];

    form.setValue("availableLanguages", newLanguages);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const availableLanguages = form.watch("availableLanguages") || [];
  const defaultLanguage = form.watch("defaultLanguage");

  const tabs: SettingsTabItem[] = [
    {
      id: "language",
      title: t("language"),
      description: t("languageDescription"),
      icon: Languages,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="defaultLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("defaultLanguage")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages
                      .filter((l) => availableLanguages.includes(l.value))
                      .map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("defaultLanguageDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availableLanguages"
            render={() => (
              <FormItem>
                <FormLabel>{t("availableLanguages")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <Badge
                      key={lang.value}
                      variant={
                        availableLanguages.includes(lang.value)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer ${
                        lang.value === defaultLanguage
                          ? "cursor-not-allowed opacity-80"
                          : ""
                      }`}
                      onClick={() => toggleLanguage(lang.value)}
                    >
                      {lang.label}
                      {lang.value === defaultLanguage && " (default)"}
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  {t("availableLanguagesDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoDetectLanguage"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("autoDetect")}</FormLabel>
                  <FormDescription>
                    {t("autoDetectDescription")}
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
            name="enableRtl"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("rtlSupport")}</FormLabel>
                  <FormDescription>
                    {t("rtlSupportDescription")}
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
      id: "currency",
      title: t("currencyFormat"),
      description: t("currencyFormatDescription"),
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("defaultCurrency")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
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
              name="currencySymbolPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("symbolPosition")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="before">
                        {t("symbolBefore")} ($100)
                      </SelectItem>
                      <SelectItem value="after">
                        {t("symbolAfter")} (100$)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "dateTime",
      title: t("numberFormat"),
      description: t("numberFormatDescription"),
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="numberFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("numberFormat")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {numberFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("numberFormatDescription")}
                </FormDescription>
                <FormMessage />
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
          defaultTab="language"
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
