"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Copy,
  ExternalLink,
  X,
  FileText,
  Film,
  File,
  Calendar,
  HardDrive,
  User,
  ImageIcon,
  Cloud,
  FolderOpen,
} from "lucide-react";
import { MediaResponse } from "../schemas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaResponse | null;
}

export function MediaPreviewDialog({
  open,
  onOpenChange,
  media,
}: MediaPreviewDialogProps) {
  const t = useTranslations("media");
  const tCommon = useTranslations("common");
  const [imageError, setImageError] = useState(false);

  if (!media) return null;

  const isImage = media.mimeType.startsWith("image/");
  const isVideo = media.mimeType.startsWith("video/");
  const isPdf = media.mimeType === "application/pdf";
  const isCloudinary = media.storageProvider === "cloudinary" || media.url.includes("cloudinary.com");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFullUrl = () => {
    const isAbsoluteUrl = media.url.startsWith('http://') || media.url.startsWith('https://');
    return isAbsoluteUrl ? media.url : `${window.location.origin}${media.url}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getFullUrl());
    toast.success(t("messages.urlCopied"));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = getFullUrl();
    link.download = media.originalName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(getFullUrl(), "_blank");
  };

  const getFileIcon = () => {
    if (isVideo) return <Film className="h-24 w-24 text-blue-500" />;
    if (isPdf) return <FileText className="h-24 w-24 text-red-500" />;
    return <File className="h-24 w-24 text-gray-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {isImage && <ImageIcon className="h-5 w-5 text-green-500" />}
              {isVideo && <Film className="h-5 w-5 text-blue-500" />}
              {isPdf && <FileText className="h-5 w-5 text-red-500" />}
              {!isImage && !isVideo && !isPdf && <File className="h-5 w-5 text-gray-500" />}
              <span className="truncate max-w-md">{media.title || media.originalName}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                {t("actions.copyUrl")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                {t("actions.download")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("preview.openInNewTab") || "Mở tab mới"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 p-6 overflow-auto">
            {isImage && !imageError ? (
              <div className="relative max-w-full max-h-full">
                <Image
                  src={media.url}
                  alt={media.alt || media.originalName}
                  width={media.width || 800}
                  height={media.height || 600}
                  className="object-contain max-h-[70vh] w-auto rounded-lg shadow-lg"
                  onError={() => setImageError(true)}
                  unoptimized={isCloudinary}
                />
              </div>
            ) : isVideo ? (
              <video
                src={getFullUrl()}
                controls
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                controlsList="nodownload"
              >
                {t("preview.videoNotSupported") || "Trình duyệt không hỗ trợ video"}
              </video>
            ) : isPdf ? (
              <iframe
                src={getFullUrl()}
                className="w-full h-[70vh] rounded-lg shadow-lg"
                title={media.originalName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                {getFileIcon()}
                <p className="mt-4 text-lg font-medium">{media.originalName}</p>
                <p className="text-sm">{t("preview.noPreview") || "Không thể xem trước file này"}</p>
                <Button className="mt-4" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("actions.download")}
                </Button>
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="w-80 border-l bg-background p-6 overflow-y-auto shrink-0">
            <h3 className="font-semibold mb-4">{t("preview.fileInfo") || "Thông tin file"}</h3>
            
            <div className="space-y-4">
              {/* File Name */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("preview.fileName") || "Tên file"}</p>
                <p className="text-sm font-medium break-all">{media.originalName}</p>
              </div>

              {/* Title */}
              {media.title && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("preview.title") || "Tiêu đề"}</p>
                  <p className="text-sm">{media.title}</p>
                </div>
              )}

              {/* Description */}
              {media.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("preview.description") || "Mô tả"}</p>
                  <p className="text-sm text-muted-foreground">{media.description}</p>
                </div>
              )}

              {/* Alt text */}
              {media.alt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("preview.altText") || "Alt text"}</p>
                  <p className="text-sm text-muted-foreground">{media.alt}</p>
                </div>
              )}

              <Separator />

              {/* File Details */}
              <div className="space-y-3">
                {/* Type */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("preview.type") || "Loại"}</p>
                    <p className="text-sm font-medium">{media.mimeType}</p>
                  </div>
                </div>

                {/* Size */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("preview.size") || "Kích thước"}</p>
                    <p className="text-sm font-medium">{formatFileSize(media.size)}</p>
                  </div>
                </div>

                {/* Dimensions (for images) */}
                {isImage && media.width && media.height && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("preview.dimensions") || "Kích thước"}</p>
                      <p className="text-sm font-medium">{media.width} × {media.height} px</p>
                    </div>
                  </div>
                )}

                {/* Duration (for videos) */}
                {isVideo && media.duration && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("preview.duration") || "Thời lượng"}</p>
                      <p className="text-sm font-medium">{Math.floor(media.duration / 60)}:{String(media.duration % 60).padStart(2, '0')}</p>
                    </div>
                  </div>
                )}

                {/* Storage Provider */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    {isCloudinary ? (
                      <Cloud className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("preview.storage") || "Lưu trữ"}</p>
                    <Badge variant={isCloudinary ? "default" : "secondary"}>
                      {isCloudinary ? "Cloudinary" : "Local"}
                    </Badge>
                  </div>
                </div>

                {/* Uploaded by */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("preview.uploadedBy") || "Tải lên bởi"}</p>
                    <p className="text-sm font-medium">{media.uploader.name || media.uploader.email}</p>
                  </div>
                </div>

                {/* Upload date */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("preview.uploadedAt") || "Ngày tải lên"}</p>
                    <p className="text-sm font-medium">{formatDate(media.createdAt)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* URL */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">URL</p>
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-xs font-mono break-all select-all">{getFullUrl()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

