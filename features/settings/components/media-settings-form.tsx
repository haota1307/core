"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { HardDrive, Upload, Image, Droplet } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { mediaSettingsSchema, MediaSettingsInput } from "../schemas";
import {
  useMediaSettings,
  useUpdateMediaSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// Storage providers
const storageProviders = [
  { value: "local", label: "Local Storage" },
  { value: "s3", label: "Amazon S3" },
  { value: "cloudinary", label: "Cloudinary" },
];

// Watermark positions
const watermarkPositions = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "center", label: "Center" },
];

// Common image types
const imageTypes = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/gif", label: "GIF" },
  { value: "image/webp", label: "WebP" },
  { value: "image/svg+xml", label: "SVG" },
];

// Common document types
const documentTypes = [
  { value: "application/pdf", label: "PDF" },
  { value: "application/msword", label: "DOC" },
  {
    value:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "DOCX",
  },
  { value: "application/vnd.ms-excel", label: "XLS" },
  {
    value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    label: "XLSX",
  },
];

export function MediaSettingsForm() {
  const t = useTranslations("settings.media");
  const tCommon = useTranslations("common");

  const { data: settings, isLoading } = useMediaSettings();
  const { mutate: updateSettings, isPending } = useUpdateMediaSettings();

  const form = useForm<MediaSettingsInput>({
    resolver: zodResolver(mediaSettingsSchema),
    defaultValues: {
      storageProvider: "local",
      maxFileSize: 10,
      allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      allowedDocumentTypes: ["application/pdf"],
      allowedVideoTypes: ["video/mp4", "video/webm"],
      imageQuality: 85,
      autoGenerateThumbnails: true,
      thumbnailSizes: ["150x150", "300x300", "600x400"],
      enableWatermark: false,
      watermarkImage: "",
      watermarkPosition: "bottom-right",
      watermarkOpacity: 50,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        storageProvider: settings.storageProvider || "local",
        maxFileSize: settings.maxFileSize || 10,
        allowedImageTypes: settings.allowedImageTypes || [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
        allowedDocumentTypes: settings.allowedDocumentTypes || [
          "application/pdf",
        ],
        allowedVideoTypes: settings.allowedVideoTypes || [
          "video/mp4",
          "video/webm",
        ],
        imageQuality: settings.imageQuality || 85,
        autoGenerateThumbnails: settings.autoGenerateThumbnails ?? true,
        thumbnailSizes: settings.thumbnailSizes || [
          "150x150",
          "300x300",
          "600x400",
        ],
        enableWatermark: settings.enableWatermark ?? false,
        watermarkImage: settings.watermarkImage || "",
        watermarkPosition: settings.watermarkPosition || "bottom-right",
        watermarkOpacity: settings.watermarkOpacity || 50,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: MediaSettingsInput) => {
    updateSettings(data);
  };

  // Toggle array item helper
  const toggleArrayItem = (
    fieldName: keyof MediaSettingsInput,
    value: string
  ) => {
    const currentValues = form.getValues(fieldName) as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    form.setValue(fieldName, newValues as any);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const enableWatermark = form.watch("enableWatermark");

  const tabs: SettingsTabItem[] = [
    {
      id: "storage",
      title: t("storage"),
      description: t("storageDescription"),
      icon: HardDrive,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="storageProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("provider")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("providerPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
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
            name="maxFileSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maxFileSize")}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 10)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">MB</span>
                  </div>
                </FormControl>
                <FormDescription>{t("maxFileSizeDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "allowed-types",
      title: t("allowedTypes"),
      description: t("allowedTypesDescription"),
      icon: Upload,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="allowedImageTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("imageTypes")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {imageTypes.map((type) => (
                    <Badge
                      key={type.value}
                      variant={
                        field.value?.includes(type.value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleArrayItem("allowedImageTypes", type.value)
                      }
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowedDocumentTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("documentTypes")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {documentTypes.map((type) => (
                    <Badge
                      key={type.value}
                      variant={
                        field.value?.includes(type.value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleArrayItem("allowedDocumentTypes", type.value)
                      }
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      id: "image-processing",
      title: t("imageProcessing"),
      description: t("imageProcessingDescription"),
      icon: Image,
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="imageQuality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("imageQuality")}: {field.value}%
                </FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  {t("imageQualityDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoGenerateThumbnails"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("autoThumbnails")}
                  </FormLabel>
                  <FormDescription>
                    {t("autoThumbnailsDescription")}
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
      id: "watermark",
      title: t("watermark"),
      description: t("watermarkDescription"),
      icon: Droplet,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="enableWatermark"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableWatermark")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableWatermarkDescription")}
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

          {enableWatermark && (
            <>
              <FormField
                control={form.control}
                name="watermarkImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("watermarkImage")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("watermarkImagePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="watermarkPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("watermarkPosition")}</FormLabel>
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
                          {watermarkPositions.map((pos) => (
                            <SelectItem key={pos.value} value={pos.value}>
                              {pos.label}
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
                  name="watermarkOpacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("watermarkOpacity")}: {field.value}%
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          min={1}
                          max={100}
                          step={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsTabs
          tabs={tabs}
          defaultTab="storage"
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
