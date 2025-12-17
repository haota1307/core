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
import { useDeleteMedia } from "../hooks/use-media";
import { MediaResponse } from "../schemas";

interface MediaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaResponse | null;
}

export function MediaDeleteDialog({
  open,
  onOpenChange,
  media,
}: MediaDeleteDialogProps) {
  const t = useTranslations("media.delete");
  const deleteMedia = useDeleteMedia();

  const handleDelete = () => {
    if (!media) return;

    deleteMedia.mutate(media.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl">{t("title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>{t("description")}</div>
              {media && media.usageCount > 0 && (
                <div className="text-destructive font-medium">
                  {t("inUseWarning", { count: media.usageCount })}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
          <AlertDialogCancel 
            disabled={deleteMedia.isPending}
            className="min-w-24"
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMedia.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-24"
          >
            {deleteMedia.isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

