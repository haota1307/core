"use client";

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
import { useDeletePermission } from "../hooks/use-roles";
import { PermissionResponse } from "../schemas";
import { useTranslations } from "next-intl";

interface PermissionDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionResponse;
}

export function PermissionDeleteDialog({
  open,
  onOpenChange,
  permission,
}: PermissionDeleteDialogProps) {
  const t = useTranslations("permissions.delete");
  const deleteMutation = useDeletePermission();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(permission.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { permissionCode: permission.code })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

