"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaCard } from "./media-card";
import { MediaUploadDialog } from "./media-upload-dialog";
import { useMedia } from "../hooks/use-media";
import { MediaResponse } from "../schemas";
import { Search, Upload } from "lucide-react";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaResponse) => void;
  multiple?: boolean;
  accept?: string; // e.g., "image/*", "video/*"
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  accept,
}: MediaPickerProps) {
  const t = useTranslations("media");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaResponse[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string | undefined>(
    accept
  );

  const { data, isLoading } = useMedia({
    page: 1,
    limit: 20,
    search,
    mimeType: mimeTypeFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleSelect = (media: MediaResponse) => {
    if (multiple) {
      setSelectedMedia((prev) => {
        const exists = prev.find((m) => m.id === media.id);
        if (exists) {
          return prev.filter((m) => m.id !== media.id);
        }
        return [...prev, media];
      });
    } else {
      onSelect(media);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (multiple && selectedMedia.length > 0) {
      selectedMedia.forEach((media) => onSelect(media));
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger
                  value="all"
                  onClick={() => setMimeTypeFilter(undefined)}
                >
                  {t("filters.all")}
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  onClick={() => setMimeTypeFilter("image/")}
                >
                  {t("filters.images")}
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  onClick={() => setMimeTypeFilter("video/")}
                >
                  {t("filters.videos")}
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  onClick={() => setMimeTypeFilter("application/")}
                >
                  {t("filters.documents")}
                </TabsTrigger>
              </TabsList>

              <Button
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("addNew")}
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Media Grid */}
            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tCommon("loading")}
                </div>
              ) : data?.data && data.data.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.data.map((media) => (
                    <MediaCard
                      key={media.id}
                      media={media}
                      selectable
                      selected={selectedMedia.some((m) => m.id === media.id)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noResults")}
                </div>
              )}
            </div>
          </Tabs>

          {/* Actions */}
          {multiple && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedMedia.length === 0}
              >
                {tCommon("save")} ({selectedMedia.length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
}

