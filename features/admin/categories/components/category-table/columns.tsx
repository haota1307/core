"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CategoryResponse } from "../../schemas";
import Image from "next/image";

type TranslateFunction = (key: string) => string;

interface ColumnActions {
  onEdit?: (category: CategoryResponse) => void;
  onDelete?: (category: CategoryResponse) => void;
}

export function createCategoryColumns(
  t: TranslateFunction,
  actions: ColumnActions
): ColumnDef<CategoryResponse>[] {
  return [
    {
      accessorKey: "image",
      header: "",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="relative h-10 w-10 overflow-hidden rounded">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                {category.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: t("slug"),
      cell: ({ row }) => (
        <code className="text-sm text-muted-foreground">{row.original.slug}</code>
      ),
    },
    {
      accessorKey: "parent",
      header: t("parent"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.parent?.name || t("noParent")}
        </span>
      ),
    },
    {
      accessorKey: "_count.courses",
      header: t("courseCount"),
      cell: ({ row }) => (
        <span>{row.original._count?.courses || 0}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit?.(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {actions.onDelete && (
                <DropdownMenuItem
                  onClick={() => actions.onDelete?.(category)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

