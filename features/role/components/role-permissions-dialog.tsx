"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUpdateRolePermissions, usePermissions } from "../hooks/use-roles";
import { RoleDetailResponse } from "../schemas";
import { useTranslations } from "next-intl";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDetailResponse;
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
}: RolePermissionsDialogProps) {
  const t = useTranslations("roles.permissions");
  // Fetch all permissions (no pagination needed in dialog)
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({
    page: 1,
    limit: 1000, // Large limit to get all permissions
  });
  const permissions = permissionsData?.data || [];
  const updatePermissionsMutation = useUpdateRolePermissions(role.id);

  // State for selected permissions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Update state when dialog opens or role changes
  useEffect(() => {
    if (open) {
      const currentSelectedIds = role.rolePermissions.map(
        (rp) => rp.permission.id
      );
      setSelectedIds(currentSelectedIds);
    }
  }, [open, role.id]); // Only update when dialog opens or role.id changes

  const handleTogglePermission = (permissionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    if (!permissions) return;
    if (selectedIds.length === permissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(permissions.map((p) => p.id));
    }
  };

  const handleSubmit = async () => {
    await updatePermissionsMutation.mutateAsync({
      permissionIds: selectedIds,
    });
    onOpenChange(false);
  };

  const isLoading = updatePermissionsMutation.isPending || permissionsLoading;

  // Group permissions by module (e.g., "users.*", "roles.*")
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    const module = perm.code.split(".")[0];
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("title", { roleName: role.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Select All Button */}
          <div className="flex justify-between items-center flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading || !permissions?.length}
            >
              {selectedIds.length === permissions?.length
                ? t("deselectAll")
                : t("selectAll")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("selectedCount", { count: selectedIds.length })}
            </span>
          </div>

          {/* Permissions List */}
          <div className="flex-1 border rounded-md overflow-y-auto">
            <div className="p-4 space-y-6">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="space-y-2">
                  <Label className="text-sm font-semibold uppercase">
                    {module}
                  </Label>
                  <div className="space-y-2 pl-4">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission.id}
                          checked={selectedIds.includes(permission.id)}
                          onCheckedChange={() =>
                            handleTogglePermission(permission.id)
                          }
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={permission.id}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          <div className="font-mono text-xs text-muted-foreground">
                            {permission.code}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">
                              {permission.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t("saving") : t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

