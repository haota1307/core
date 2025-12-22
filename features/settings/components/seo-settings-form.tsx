"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { X, Search, Share2, BarChart } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { seoSettingsSchema, SeoSettingsInput } from "../schemas";
import { useSeoSettings, useUpdateSeoSettings } from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// Twitter card types
const twitterCardTypes = [
  { value: "summary", label: "Summary" },
  { value: "summary_large_image", label: "Summary with Large Image" },
];

export function SeoSettingsForm() {
  const t = useTranslations("settings.seo");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useSeoSettings();
  const { mutate: updateSettings, isPending } = useUpdateSeoSettings();

  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<SeoSettingsInput>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      defaultMetaTitle: "",
      defaultMetaDescription: "",
      metaKeywords: [],
      ogImage: "",
      ogSiteName: "",
      twitterCardType: "summary_large_image",
      twitterSite: "",
      googleAnalyticsId: "",
      facebookPixelId: "",
      robotsTxt: "",
      enableSitemap: true,
      enableIndexing: true,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        defaultMetaTitle: settings.defaultMetaTitle || "",
        defaultMetaDescription: settings.defaultMetaDescription || "",
        metaKeywords: settings.metaKeywords || [],
        ogImage: settings.ogImage || "",
        ogSiteName: settings.ogSiteName || "",
        twitterCardType: settings.twitterCardType || "summary_large_image",
        twitterSite: settings.twitterSite || "",
        googleAnalyticsId: settings.googleAnalyticsId || "",
        facebookPixelId: settings.facebookPixelId || "",
        robotsTxt: settings.robotsTxt || "",
        enableSitemap: settings.enableSitemap ?? true,
        enableIndexing: settings.enableIndexing ?? true,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SeoSettingsInput) => {
    updateSettings(data);
  };

  // Handle keyword input
  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const keyword = keywordInput.trim();
      if (keyword) {
        const currentKeywords = form.getValues("metaKeywords") || [];
        if (!currentKeywords.includes(keyword)) {
          form.setValue("metaKeywords", [...currentKeywords, keyword]);
        }
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("metaKeywords") || [];
    form.setValue(
      "metaKeywords",
      currentKeywords.filter((k) => k !== keyword)
    );
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const keywords = form.watch("metaKeywords") || [];

  const tabs: SettingsTabItem[] = [
    {
      id: "seo",
      title: t("metaTags"),
      description: t("metaTagsDescription"),
      icon: Search,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="defaultMetaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("metaTitle")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("metaTitlePlaceholder")} {...field} />
                </FormControl>
                <FormDescription>{t("metaTitleDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultMetaDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("metaDescription")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("metaDescriptionPlaceholder")}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("metaDescriptionDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metaKeywords"
            render={() => (
              <FormItem>
                <FormLabel>{t("keywords")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("keywordsPlaceholder")}
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                  />
                </FormControl>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() => removeKeyword(keyword)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormDescription>{t("keywordsDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableIndexing"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableIndexing")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableIndexingDescription")}
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
            name="enableSitemap"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableSitemap")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableSitemapDescription")}
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
            name="robotsTxt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("robotsTxt")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("robotsTxtPlaceholder")}
                    rows={5}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("robotsTxtDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "social",
      title: t("openGraph"),
      description: t("openGraphDescription"),
      icon: Share2,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="ogSiteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ogSiteName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("ogSiteNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ogImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ogImage")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("ogImagePlaceholder")} {...field} />
                </FormControl>
                <FormDescription>{t("ogImageDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="twitterCardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cardType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {twitterCardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="twitterSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("twitterSite")}</FormLabel>
                  <FormControl>
                    <Input placeholder="@yoursite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: t("analytics"),
      description: t("analyticsDescription"),
      icon: BarChart,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="googleAnalyticsId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("googleAnalytics")}</FormLabel>
                  <FormControl>
                    <Input placeholder="G-XXXXXXXXXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("googleAnalyticsDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facebookPixelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("facebookPixel")}</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXXXXXXXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("facebookPixelDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="seo"
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
