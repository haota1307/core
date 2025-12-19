"use client";

import { useState, useMemo } from "react";
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
import { useMoveFolder, useFolders } from "../hooks/use-folders";
import { MediaFolderResponse } from "../schemas";
import { Folder, Home } from "lucide-react";

interface FolderMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: MediaFolderResponse | null;
}

export function FolderMoveDialog({
  open,
  onOpenChange,
  folder,
}: FolderMoveDialogProps) {
  const t = useTranslations("media.folder");
  const moveFolder = useMoveFolder();

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Fetch all folders
  const { data: foldersData } = useFolders();
  const folders = foldersData || [];

  // Filter out the current folder and its descendants to prevent circular references
  const availableFolders = useMemo(() => {
    if (!folder) return folders;

    const getDescendantIds = (folderId: string): string[] => {
      const descendants: string[] = [folderId];
      const children = folders.filter((f) => f.parentId === folderId);
      children.forEach((child) => {
        descendants.push(...getDescendantIds(child.id));
      });
      return descendants;
    };

    const excludedIds = getDescendantIds(folder.id);
    return folders.filter((f) => !excludedIds.includes(f.id));
  }, [folder, folders]);

  const handleMove = () => {
    if (!folder) return;

    moveFolder.mutate(
      { id: folder.id, parentId: selectedParentId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedParentId(null);
        },
      }
    );
  };

  // Reset selection when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedParentId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">{t("moveTitle")}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {t("moveDescription")}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectDestination")}</label>
            <Select
              value={selectedParentId || "root"}
              onValueChange={(value) =>
                setSelectedParentId(value === "root" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{t("root")}</span>
                  </div>
                </SelectItem>
                {availableFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>{f.name}</span>
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
            disabled={moveFolder.isPending}
            className="min-w-24"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleMove}
            disabled={moveFolder.isPending}
            className="min-w-24"
          >
            {moveFolder.isPending ? t("moving") : t("moveButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

