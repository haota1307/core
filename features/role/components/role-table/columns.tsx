"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Shield, ArrowUpDown } from "lucide-react";
import { RoleResponse } from "../../schemas";

interface ColumnsProps {
  onEdit: (role: RoleResponse) => void;
  onDelete: (role: RoleResponse) => void;
  onManagePermissions: (role: RoleResponse) => void;
  t: any; // i18n translation function
}

export function createRoleColumns({
  onEdit,
  onDelete,
  onManagePermissions,
  t,
}: ColumnsProps): ColumnDef<RoleResponse>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{t("columns.name")}</span>
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 p-0 ml-2"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{role.name}</div>
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs">
                {t("columns.system")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => <span className="font-medium">{t("columns.description")}</span>,
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-[300px] truncate text-muted-foreground">
            {description || "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("columns.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onManagePermissions(role)}
                // Note: Permission check should be done in component, not here
                // This is just UI, actual permission is checked in API
              >
                <Shield className="mr-2 h-4 w-4" />
                {t("columns.managePermissions")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(role)}
                disabled={role.isSystem}
                // Note: Permission check should be done in component, not here
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("columns.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(role)}
                disabled={role.isSystem}
                className="text-destructive"
                // Note: Permission check should be done in component, not here
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("columns.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

