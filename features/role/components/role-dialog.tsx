"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleForm } from "./role-form";
import { RoleResponse } from "../schemas";
import { useCreateRole, useUpdateRole } from "../hooks/use-roles";
import { useTranslations } from "next-intl";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleResponse;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const t = useTranslations("roles.dialog");
  const isEditMode = !!role;

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(role?.id || "");

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
        <RoleForm
          role={role}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

