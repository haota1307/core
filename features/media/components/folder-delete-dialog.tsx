"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteFolder } from "../hooks/use-folders";

interface FolderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: { id: string; name: string; _count?: { media: number } } | null;
}

export function FolderDeleteDialog({
  open,
  onOpenChange,
  folder,
}: FolderDeleteDialogProps) {
  const t = useTranslations("media.folder");
  const deleteFolder = useDeleteFolder();

  const handleDelete = () => {
    if (!folder) return;

    deleteFolder.mutate(folder.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl">{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>{t("deleteDescription")}</div>
              {folder && folder._count && folder._count.media > 0 && (
                <div className="font-medium">
                  This folder contains {folder._count.media} file(s) that will be moved to root.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
          <AlertDialogCancel 
            disabled={deleteFolder.isPending}
            className="min-w-24"
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteFolder.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-24"
          >
            {deleteFolder.isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

