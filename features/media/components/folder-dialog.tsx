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
import { useCreateFolder, useUpdateFolder } from "../hooks/use-folders";
import { MediaFolderResponse } from "../schemas";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: MediaFolderResponse | null;
  parentId?: string | null;
}

export function FolderDialog({
  open,
  onOpenChange,
  folder,
  parentId,
}: FolderDialogProps) {
  const t = useTranslations("media.folder");
  const [name, setName] = useState("");

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();

  const isLoading = createFolder.isPending || updateFolder.isPending;

  useEffect(() => {
    if (folder) {
      setName(folder.name);
    } else {
      setName("");
    }
  }, [folder, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (folder) {
      await updateFolder.mutateAsync({
        id: folder.id,
        name: name.trim(),
      });
    } else {
      await createFolder.mutateAsync({
        name: name.trim(),
        parentId: parentId || undefined,
      });
    }

    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">
            {folder ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {folder ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName" className="text-sm font-medium">
              {t("nameLabel")}
            </Label>
            <Input
              id="folderName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="min-w-24"
          >
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim() || isLoading}
            className="min-w-24"
          >
            {isLoading ? t("saving") : (folder ? t("update") : t("create"))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
