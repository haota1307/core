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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useDeleteFolder } from "../hooks/use-folders";

interface FolderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: { id: string; name: string; _count?: { media: number; children: number } } | null;
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

  const hasContent = folder?._count && (folder._count.media > 0 || folder._count.children > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl">{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              <div>
                {t("deleteConfirm", { name: folder?.name || "" })}
              </div>
              
              {hasContent && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="font-semibold mb-1">{t("deleteWarning")}</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {folder._count && folder._count.children > 0 && (
                        <li>{t("deleteSubfolders", { count: folder._count.children })}</li>
                      )}
                      {folder._count && folder._count.media > 0 && (
                        <li>{t("deleteFiles", { count: folder._count.media })}</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
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

