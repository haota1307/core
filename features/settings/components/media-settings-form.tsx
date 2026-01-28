"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  HardDrive,
  Upload,
  Image,
  Droplet,
  Video,
  Cloud,
  FolderOpen,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SettingsTabs, SettingsTabItem } from "./settings-tabs";
import { mediaSettingsSchema, MediaSettingsInput } from "../schemas";
import {
  useMediaSettings,
  useUpdateMediaSettings,
} from "../hooks/use-settings";
import { SettingsFormSkeleton } from "./settings-layout";

// Storage providers
const storageProviders = [
  { value: "local", label: "Local Storage", icon: FolderOpen },
  { value: "cloudinary", label: "Cloudinary", icon: Cloud },
];

// Watermark positions
const watermarkPositions = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "center", label: "Center" },
];

// Video encryption methods
const videoEncryptionMethods = [
  { value: "none", label: "Không mã hóa" },
  { value: "hls-aes", label: "HLS AES-128 (Recommended)" },
  { value: "dash-clearkey", label: "DASH ClearKey" },
];

// Video quality presets
const videoQualityOptions = [
  { value: "360p", label: "360p (SD)" },
  { value: "480p", label: "480p (SD)" },
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

// Common image types
const imageTypes = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/gif", label: "GIF" },
  { value: "image/webp", label: "WebP" },
  { value: "image/svg+xml", label: "SVG" },
];

// Common video types
const videoTypes = [
  { value: "video/mp4", label: "MP4" },
  { value: "video/webm", label: "WebM" },
  { value: "video/quicktime", label: "MOV" },
  { value: "video/x-msvideo", label: "AVI" },
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

  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);

  const form = useForm<MediaSettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(mediaSettingsSchema) as any,
    defaultValues: {
      storageProvider: "local",
      localUploadPath: "uploads",
      cloudinaryCloudName: "",
      cloudinaryApiKey: "",
      cloudinaryApiSecret: "",
      cloudinaryUploadPreset: "",
      maxFileSize: 10,
      maxVideoSize: 100,
      allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      allowedDocumentTypes: ["application/pdf"],
      allowedVideoTypes: ["video/mp4", "video/webm"],
      imageQuality: 85,
      autoGenerateThumbnails: true,
      thumbnailSizes: ["150x150", "300x300", "600x400"],
      // Cloudinary image optimization
      enableImageOptimization: true,
      imageOptimizationQuality: "auto",
      imageOptimizationFormat: "auto",
      maxImageWidth: 1920,
      maxImageHeight: 1080,
      // Watermark
      enableWatermark: false,
      watermarkImage: "",
      watermarkPosition: "bottom-right",
      watermarkOpacity: 50,
      // Video (Cloudinary only)
      enableVideoEncryption: false,
      videoEncryptionMethod: "none",
      videoEncryptionKey: "",
      enableVideoWatermark: false,
      videoQualityPresets: ["720p", "1080p"],
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        storageProvider: settings.storageProvider || "local",
        localUploadPath: settings.localUploadPath || "uploads",
        cloudinaryCloudName: settings.cloudinaryCloudName || "",
        cloudinaryApiKey: settings.cloudinaryApiKey || "",
        cloudinaryApiSecret: settings.cloudinaryApiSecret || "",
        cloudinaryUploadPreset: settings.cloudinaryUploadPreset || "",
        maxFileSize: settings.maxFileSize || 10,
        maxVideoSize: settings.maxVideoSize || 100,
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
        // Cloudinary image optimization
        enableImageOptimization: settings.enableImageOptimization ?? true,
        imageOptimizationQuality: settings.imageOptimizationQuality || "auto",
        imageOptimizationFormat: settings.imageOptimizationFormat || "auto",
        maxImageWidth: settings.maxImageWidth || 1920,
        maxImageHeight: settings.maxImageHeight || 1080,
        // Watermark
        enableWatermark: settings.enableWatermark ?? false,
        watermarkImage: settings.watermarkImage || "",
        watermarkPosition: settings.watermarkPosition || "bottom-right",
        watermarkOpacity: settings.watermarkOpacity || 50,
        // Video (Cloudinary only)
        enableVideoEncryption: settings.enableVideoEncryption ?? false,
        videoEncryptionMethod: settings.videoEncryptionMethod || "none",
        videoEncryptionKey: settings.videoEncryptionKey || "",
        enableVideoWatermark: settings.enableVideoWatermark ?? false,
        videoQualityPresets: settings.videoQualityPresets || ["720p", "1080p"],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(fieldName, newValues as any);
  };

  // Generate random encryption key
  const generateEncryptionKey = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const key = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    form.setValue("videoEncryptionKey", key);
  };

  if (isLoading) {
    return <SettingsFormSkeleton />;
  }

  const storageProvider = form.watch("storageProvider");
  const enableWatermark = form.watch("enableWatermark");
  const enableVideoEncryption = form.watch("enableVideoEncryption");

  const tabs: SettingsTabItem[] = [
    {
      id: "storage",
      title: t("storage"),
      description: t("storageDescription"),
      icon: HardDrive,
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="storageProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("provider")}</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  {storageProviders.map((provider) => {
                    const Icon = provider.icon;
                    const isSelected = field.value === provider.value;
                    return (
                      <div
                        key={provider.value}
                        onClick={() => field.onChange(provider.value)}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        <Icon
                          className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <div>
                          <p
                            className={`font-medium ${isSelected ? "text-primary" : ""}`}
                          >
                            {provider.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {provider.value === "local"
                              ? t("localDescription")
                              : t("cloudinaryDescription")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Local Storage Config */}
          {storageProvider === "local" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {t("localConfig")}
              </h4>
              <FormField
                control={form.control}
                name="localUploadPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("uploadPath")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="uploads"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>{t("uploadPathDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Cloudinary Config */}
          {storageProvider === "cloudinary" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                {t("cloudinaryConfig")}
              </h4>
              <Alert>
                <AlertDescription>
                  {t("cloudinaryConfigDescription")}
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cloudinaryCloudName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cloudName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your-cloud-name"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cloudinaryUploadPreset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("uploadPreset")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your-upload-preset"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>{t("uploadPresetDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cloudinaryApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apiKey")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789012345"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cloudinaryApiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apiSecret")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showApiSecret ? "text" : "password"}
                          placeholder="••••••••••••••••••••••••"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>{t("apiSecretDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* File Size Limits */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                        value={field.value ?? 10}
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

            <FormField
              control={form.control}
              name="maxVideoSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maxVideoSize")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        {...field}
                        value={field.value ?? 100}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 100)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">MB</span>
                    </div>
                  </FormControl>
                  <FormDescription>{t("maxVideoSizeDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: "allowed-types",
      title: t("allowedTypes"),
      description: t("allowedTypesDescription"),
      icon: Upload,
      content: (
        <div className="space-y-6">
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
                        field.value?.includes(type.value) ? "default" : "outline"
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
            name="allowedVideoTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("videoTypes")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {videoTypes.map((type) => (
                    <Badge
                      key={type.value}
                      variant={
                        field.value?.includes(type.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleArrayItem("allowedVideoTypes", type.value)
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
                        field.value?.includes(type.value) ? "default" : "outline"
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
                <FormDescription>{t("imageQualityDescription")}</FormDescription>
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
                  <FormDescription>{t("autoThumbnailsDescription")}</FormDescription>
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

          {/* Cloudinary Image Optimization - only show when Cloudinary is selected */}
          {storageProvider === "cloudinary" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                {t("enableImageOptimization")}
              </h4>
              <Alert>
                <AlertDescription>
                  {t("enableImageOptimizationDescription")}
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="enableImageOptimization"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("enableImageOptimization")}
                      </FormLabel>
                      <FormDescription>
                        {t("enableImageOptimizationDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("enableImageOptimization") && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="imageOptimizationQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("optimizationQuality")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "auto"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="auto">Auto (Recommended)</SelectItem>
                              <SelectItem value="auto:low">Auto Low (Smaller size)</SelectItem>
                              <SelectItem value="auto:eco">Auto Eco</SelectItem>
                              <SelectItem value="auto:good">Auto Good</SelectItem>
                              <SelectItem value="auto:best">Auto Best (Highest quality)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>{t("optimizationQualityDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageOptimizationFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("optimizationFormat")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "auto"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="auto">Auto (WebP/AVIF if supported)</SelectItem>
                              <SelectItem value="webp">WebP</SelectItem>
                              <SelectItem value="avif">AVIF (Smallest)</SelectItem>
                              <SelectItem value="jpg">JPEG</SelectItem>
                              <SelectItem value="png">PNG</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>{t("optimizationFormatDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="maxImageWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maxImageWidth")}</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={100}
                                max={4096}
                                {...field}
                                value={field.value ?? 1920}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1920)
                                }
                                className="w-28"
                              />
                              <span className="text-sm text-muted-foreground">px</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxImageHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maxImageHeight")}</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={100}
                                max={4096}
                                {...field}
                                value={field.value ?? 1080}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1080)
                                }
                                className="w-28"
                              />
                              <span className="text-sm text-muted-foreground">px</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    // Video tab - only show for Cloudinary
    ...(storageProvider === "cloudinary" ? [{
      id: "video",
      title: t("videoSettings"),
      description: t("videoSettingsDescription"),
      icon: Video,
      content: (
        <div className="space-y-6">
          {/* Video Encryption */}
          <FormField
            control={form.control}
            name="enableVideoEncryption"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("enableVideoEncryption")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableVideoEncryptionDescription")}
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

          {enableVideoEncryption && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t("videoEncryptionInfo")}
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="videoEncryptionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("encryptionMethod")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {videoEncryptionMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("encryptionMethodDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoEncryptionKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("encryptionKey")}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showEncryptionKey ? "text" : "password"}
                            placeholder="32-character hex key"
                            {...field}
                            value={field.value ?? ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                          >
                            {showEncryptionKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateEncryptionKey}
                        >
                          {t("generateKey")}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>{t("encryptionKeyDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Video Watermark */}
          <FormField
            control={form.control}
            name="enableVideoWatermark"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableVideoWatermark")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableVideoWatermarkDescription")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Video Quality Presets */}
          <FormField
            control={form.control}
            name="videoQualityPresets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("videoQualityPresets")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {videoQualityOptions.map((quality) => (
                    <Badge
                      key={quality.value}
                      variant={
                        field.value?.includes(quality.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleArrayItem("videoQualityPresets", quality.value)
                      }
                    >
                      {quality.label}
                    </Badge>
                  ))}
                </div>
                <FormDescription>{t("videoQualityPresetsDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    }] : []),
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
                        value={field.value ?? ""}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
