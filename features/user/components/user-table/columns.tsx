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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { UserResponse } from "../../schemas";

interface ColumnsProps {
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  t: any; // i18n translation function
}

export function createColumns({
  onEdit,
  onDelete,
  t,
}: ColumnsProps): ColumnDef<UserResponse>[] {
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
        const user = row.original;
        const initials =
          user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || user.email[0].toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || user.email}
              />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name || t("noName")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{t("columns.role")}</span>
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
        const role = row.original.role;
        return (
          <span className="text-sm">
            {role?.name || (
              <span className="text-muted-foreground">{t("noRole")}</span>
            )}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{t("columns.email")}</span>
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
        return <span className="text-sm">{row.original.email}</span>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{t("columns.status")}</span>
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
        const isActive = !!row.original.emailVerified;
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                : "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-100"
            }
          >
            {isActive ? t("status.active") : t("status.pending")}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const isActive = !!row.original.emailVerified;
        return value.includes(isActive ? "active" : "pending");
      },
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right font-medium">{t("columns.actions")}</div>
      ),
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions.label")}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(user.id)}
                >
                  {t("actions.copyId")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
