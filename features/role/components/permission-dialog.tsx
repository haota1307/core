"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionForm } from "./permission-form";
import { PermissionResponse } from "../schemas";
import {
  useCreatePermission,
  useUpdatePermission,
} from "../hooks/use-roles";
import { useTranslations } from "next-intl";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: PermissionResponse;
}

export function PermissionDialog({
  open,
  onOpenChange,
  permission,
}: PermissionDialogProps) {
  const t = useTranslations("permissions.dialog");
  const isEditMode = !!permission;

  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission(permission?.id || "");

  const handleSubmit = async (data: any) => {
    if (isEditMode) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <PermissionForm
          permission={permission}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

