"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  FileText,
  Film,
  File,
  FolderInput
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MediaResponse } from "../schemas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: MediaResponse;
  onEdit?: (media: MediaResponse) => void;
  onDelete?: (media: MediaResponse) => void;
  onMove?: (media: MediaResponse) => void;
  onSelect?: (media: MediaResponse) => void;
  selectable?: boolean;
  selected?: boolean;
  viewMode?: "grid" | "list";
}

export function MediaCard({
  media,
  onEdit,
  onMove,
  onDelete,
  onSelect,
  selectable = false,
  selected = false,
  viewMode = "grid",
}: MediaCardProps) {
  const t = useTranslations("media");
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isImage = media.mimeType.startsWith("image/");
  const isVideo = media.mimeType.startsWith("video/");
  const isPdf = media.mimeType === "application/pdf";

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${media.url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success(t("messages.urlCopied"));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = media.url;
    link.download = media.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(media);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(media);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!onMove) return; // Only allow drag if move is enabled
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "media",
      id: media.id,
      name: media.originalName,
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getFileIcon = () => {
    if (isImage) return null; // Show thumbnail
    if (isVideo) return <Film className="h-12 w-12 text-blue-500" />;
    if (isPdf) return <FileText className="h-12 w-12 text-red-500" />;
    return <File className="h-12 w-12 text-gray-500" />;
  };

  const getFileExtension = () => {
    return media.originalName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center p-3 rounded-lg transition-all",
        "hover:bg-accent/50 cursor-pointer",
        selected && "bg-accent ring-2 ring-primary",
        isDragging && "opacity-50",
        selectable && "select-none"
      )}
      onClick={() => selectable && onSelect?.(media)}
      draggable={!!onMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Thumbnail/Icon */}
      <div className="relative w-full aspect-square mb-2 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {isImage && !imageError ? (
          <Image
            src={media.thumbnailUrl || media.url}
            alt={media.alt || media.originalName}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          getFileIcon()
        )}

        {/* File type badge */}
        {!isImage && (
          <div className="absolute bottom-1 right-1 bg-background/90 px-1.5 py-0.5 rounded text-[10px] font-medium">
            {getFileExtension()}
          </div>
        )}

        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* File name */}
      <div className="w-full text-center px-1">
        <p 
          className="text-sm truncate" 
          title={media.title || media.originalName}
        >
          {media.title || media.originalName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(media.size)}
        </p>
      </div>

      {/* Context menu - only show on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-7 w-7 shadow-md"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyUrl}>
              <Copy className="mr-2 h-4 w-4" />
              {t("actions.copyUrl")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t("actions.download")}
            </DropdownMenuItem>
            {(onEdit || onMove || onDelete) && <DropdownMenuSeparator />}
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(media)}>
                <FolderInput className="mr-2 h-4 w-4" />
                {t("actions.move")}
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

