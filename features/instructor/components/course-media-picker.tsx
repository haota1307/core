"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaCard } from "@/features/media/components/media-card";
import { MediaResponse } from "@/features/media/schemas";
import {
  useFolders,
  useCreateFolder,
} from "@/features/media/hooks/use-folders";
import { useUploadMedia } from "@/features/media/hooks/use-media";
import { http } from "@/lib/http";
import { Search, Upload, ImageIcon, VideoIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface CourseMediaPickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onSelect?: (media: MediaResponse) => void; // New callback with full media object
  accept: "image/*" | "video/*";
  placeholder?: string;
  disabled?: boolean;
  courseTitle?: string; // Used for creating course folder
}

interface FolderResponse {
  id: string;
  name: string;
  parentId: string | null;
}

export function CourseMediaPicker({
  value,
  onChange,
  onSelect,
  accept,
  placeholder,
  disabled,
  courseTitle,
}: CourseMediaPickerProps) {
  const t = useTranslations("media");
  const tCourse = useTranslations("instructor.courseForm");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "upload">("browse");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [courseFolderId, setCourseFolderId] = useState<string | null>(null);

  // Get all folders to find/create Course folder
  const { data: allFolders, isLoading: foldersLoading } = useFolders();
  const createFolderMutation = useCreateFolder();

  // Find or create Course folder structure
  const ensureCourseFolderExists = useCallback(async () => {
    if (!allFolders) return null;

    // Find "Course" root folder
    let courseRootFolder = allFolders.find(
      (f: FolderResponse) => f.name === "Course" && f.parentId === null,
    );

    // Create if not exists
    if (!courseRootFolder) {
      try {
        const result = await createFolderMutation.mutateAsync({
          name: "Course",
        });
        courseRootFolder = result.data;
      } catch (error) {
        console.error("Failed to create Course folder:", error);
        return null;
      }
    }

    return courseRootFolder?.id || null;
  }, [allFolders, createFolderMutation]);

  // Query to get user's own media
  const {
    data: mediaData,
    isLoading: mediaLoading,
    refetch: refetchMedia,
  } = useQuery({
    queryKey: ["my-media", search, accept],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "50");
      params.append("onlyMine", "true"); // Filter only user's own media
      if (search) params.append("search", search);

      // Set mime type filter based on accept
      if (accept === "image/*") {
        params.append("mimeType", "image/");
      } else if (accept === "video/*") {
        params.append("mimeType", "video/");
      }

      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

      const response = await http.get<{
        data: MediaResponse[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/api/media?${params.toString()}`);
      return response;
    },
    staleTime: 5 * 1000,
  });

  const uploadMedia = useUploadMedia();

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    if (accept === "image/*" && !file.type.startsWith("image/")) {
      return false;
    }
    if (accept === "video/*" && !file.type.startsWith("video/")) {
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Ensure Course folder exists
      const rootFolderId = await ensureCourseFolderExists();

      const formData = new FormData();
      formData.append("file", file);

      if (rootFolderId) {
        formData.append("folderId", rootFolderId);
      }

      // Upload and get response
      const response = await http.post<{ data: MediaResponse }>(
        "/api/media/upload",
        formData,
      );

      // Select the uploaded media
      onChange(response.data.url);
      refetchMedia();
      setFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (media: MediaResponse) => {
    onChange(media.url);
    if (onSelect) {
      onSelect(media);
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  const isImage = accept === "image/*";
  const isVideo = accept === "video/*";

  return (
    <div className="space-y-2">
      {/* Preview / Select Button */}
      {value ? (
        <div className="relative group">
          <div className="border rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            {isImage ? (
              <Image
                src={value}
                alt="Selected thumbnail"
                fill
                className="object-cover"
              />
            ) : (
              <video
                src={value}
                className="w-full h-full object-cover"
                controls={false}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              {tCommon("edit")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed"
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isImage ? (
              <ImageIcon className="h-8 w-8" />
            ) : (
              <VideoIcon className="h-8 w-8" />
            )}
            <span>{placeholder || tCourse("selectMedia")}</span>
          </div>
        </Button>
      )}

      {/* Picker Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {isImage
                ? tCourse("selectThumbnail")
                : tCourse("selectPreviewVideo")}
            </DialogTitle>
            <DialogDescription>
              {tCourse("selectMediaDescription")}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "browse" | "upload")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">{t("browse")}</TabsTrigger>
              <TabsTrigger value="upload">{t("upload.title")}</TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="overflow-y-auto max-h-[400px]">
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mediaData?.data && mediaData.data.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaData.data.map((media) => (
                      <div
                        key={media.id}
                        className={cn(
                          "relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:border-primary",
                          value === media.url
                            ? "border-primary ring-2 ring-primary"
                            : "border-transparent",
                        )}
                        onClick={() => handleSelect(media)}
                      >
                        {media.mimeType.startsWith("image/") ? (
                          <Image
                            src={media.thumbnailUrl || media.url}
                            alt={media.alt || media.originalName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                          <p className="text-xs text-white truncate">
                            {media.originalName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("noResults")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("course-media-input")?.click()
                }
              >
                <input
                  id="course-media-input"
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t("upload.dragDrop")}</p>
                    <p className="text-sm text-muted-foreground">
                      {isImage
                        ? t("upload.imageTypes")
                        : t("upload.videoTypes")}
                    </p>
                  </div>
                </div>
              </div>

              {file && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isImage ? (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <VideoIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("upload.uploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t("upload.uploadButton")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
