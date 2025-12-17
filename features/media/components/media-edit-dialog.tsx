"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateMedia } from "../hooks/use-media";
import { MediaResponse } from "../schemas";

interface MediaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaResponse | null;
}

export function MediaEditDialog({
  open,
  onOpenChange,
  media,
}: MediaEditDialogProps) {
  const t = useTranslations("media.edit");
  const updateMedia = useUpdateMedia();

  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (media) {
      setAlt(media.alt || "");
      setTitle(media.title || "");
      setDescription(media.description || "");
    }
  }, [media]);

  const handleSubmit = async () => {
    if (!media) return;

    updateMedia.mutate(
      {
        id: media.id,
        data: { alt, title, description },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="alt" className="text-sm font-medium">
              {t("altLabel")}
            </Label>
            <Input
              id="alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={t("altPlaceholder")}
              className="h-10"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {t("titleLabel")}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t("descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMedia.isPending}
            className="min-w-24"
          >
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateMedia.isPending}
            className="min-w-24"
          >
            {updateMedia.isPending ? t("cancel") : t("updateButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

