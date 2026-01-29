"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { MoreHorizontal, Pencil, Trash2, Eye, Send, BookOpen } from "lucide-react";
import { CourseResponse } from "../../schemas";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

type TranslateFunction = (key: string) => string;

interface ColumnActions {
  onEdit?: (course: CourseResponse) => void;
  onDelete?: (course: CourseResponse) => void;
  onView?: (course: CourseResponse) => void;
  onSubmit?: (course: CourseResponse) => void;
  onManageCurriculum?: (course: CourseResponse) => void;
}

export function createColumns(
  t: TranslateFunction,
  actions: ColumnActions
): ColumnDef<CourseResponse>[] {
  return [
    {
      accessorKey: "thumbnail",
      header: "",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="relative h-12 w-20 overflow-hidden rounded">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: t("title"),
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="max-w-[300px]">
            <p className="font-medium truncate">{course.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {course.shortDescription}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          DRAFT: "secondary",
          PENDING_REVIEW: "outline",
          PUBLISHED: "default",
          REJECTED: "destructive",
          ARCHIVED: "secondary",
        };
        return (
          <Badge variant={variants[status] || "secondary"}>
            {t(`statuses.${status.toLowerCase()}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "level",
      header: t("level"),
      cell: ({ row }) => {
        const level = row.original.level;
        return <span>{t(`levels.${level.toLowerCase()}`)}</span>;
      },
    },
    {
      accessorKey: "price",
      header: t("price"),
      cell: ({ row }) => {
        const course = row.original;
        const price = course.salePrice || course.price;
        return (
          <div>
            <span className="font-medium">
              {new Intl.NumberFormat("vi-VN").format(price)} {course.currency}
            </span>
            {course.salePrice && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {new Intl.NumberFormat("vi-VN").format(course.price)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "enrollmentCount",
      header: t("students"),
      cell: ({ row }) => (
        <span>{row.original.enrollmentCount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "rating",
      header: t("rating"),
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span>{Number(course.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">({course.reviewCount})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("createdAt"),
      cell: ({ row }) => {
        return format(new Date(row.original.createdAt), "dd/MM/yyyy", {
          locale: vi,
        });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const course = row.original;
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
              
              {actions.onView && (
                <DropdownMenuItem onClick={() => actions.onView?.(course)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("view")}
                </DropdownMenuItem>
              )}
              
              {actions.onManageCurriculum && (
                <DropdownMenuItem onClick={() => actions.onManageCurriculum?.(course)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t("manageCurriculum")}
                </DropdownMenuItem>
              )}
              
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit?.(course)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              
              {actions.onSubmit && course.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => actions.onSubmit?.(course)}>
                  <Send className="mr-2 h-4 w-4" />
                  {t("submitForReview")}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {actions.onDelete && (
                <DropdownMenuItem
                  onClick={() => actions.onDelete?.(course)}
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

