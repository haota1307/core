"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMoveMedia } from "../hooks/use-media";
import { useFolders } from "../hooks/use-folders";
import { MediaResponse } from "../schemas";
import { Folder, Home } from "lucide-react";

interface MediaMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaResponse | null;
}

export function MediaMoveDialog({
  open,
  onOpenChange,
  media,
}: MediaMoveDialogProps) {
  const t = useTranslations("media.move");
  const tFolder = useTranslations("media.folder");
  const moveMedia = useMoveMedia();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch all folders
  const { data: foldersData } = useFolders();
  const folders = foldersData || [];

  const handleMove = () => {
    if (!media) return;

    moveMedia.mutate(
      { id: media.id, folderId: selectedFolderId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedFolderId(null);
        },
      }
    );
  };

  // Reset selection when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedFolderId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {t("description")}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectFolder")}</label>
            <Select
              value={selectedFolderId || "root"}
              onValueChange={(value) =>
                setSelectedFolderId(value === "root" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{tFolder("root")}</span>
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={moveMedia.isPending}
            className="min-w-24"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleMove}
            disabled={moveMedia.isPending}
            className="min-w-24"
          >
            {moveMedia.isPending ? t("moving") : t("moveButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

