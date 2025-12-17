"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { PermissionResponse } from "../../schemas";

interface ColumnsProps {
  onEdit: (permission: PermissionResponse) => void;
  onDelete: (permission: PermissionResponse) => void;
  t: any; // i18n translation function
}

export function createPermissionColumns({
  onEdit,
  onDelete,
  t,
}: ColumnsProps): ColumnDef<PermissionResponse>[] {
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
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{t("columns.code")}</span>
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
        const code = row.getValue("code") as string;
        return (
          <div className="font-mono text-sm font-medium">{code}</div>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => (
        <span className="font-medium">{t("columns.description")}</span>
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-[400px] text-muted-foreground">
            {description || "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const permission = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(permission)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("columns.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(permission)}
                className="text-destructive"
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

