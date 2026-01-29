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
import { MoreHorizontal, Eye, CheckCircle, XCircle, Trash2, BookOpen } from "lucide-react";
import { AdminCourseResponse } from "../../schemas";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TranslateFunction = (key: string) => string;

interface ColumnActions {
  onView?: (course: AdminCourseResponse) => void;
  onApprove?: (course: AdminCourseResponse) => void;
  onReject?: (course: AdminCourseResponse) => void;
  onDelete?: (course: AdminCourseResponse) => void;
}

export function createAdminCourseColumns(
  t: TranslateFunction,
  actions: ColumnActions
): ColumnDef<AdminCourseResponse>[] {
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
          <div className="max-w-[250px]">
            <p className="font-medium truncate">{course.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {course.shortDescription}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "instructor",
      header: t("instructor"),
      cell: ({ row }) => {
        const instructor = row.original.instructor;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={instructor.image || undefined} alt={instructor.name || ""} />
              <AvatarFallback>
                {(instructor.name || instructor.email)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {instructor.name || t("noName")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {instructor.email}
              </p>
            </div>
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
        const isPending = course.status === "PENDING_REVIEW";
        
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
              
              {isPending && actions.onApprove && (
                <DropdownMenuItem onClick={() => actions.onApprove?.(course)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  {t("approve")}
                </DropdownMenuItem>
              )}
              
              {isPending && actions.onReject && (
                <DropdownMenuItem onClick={() => actions.onReject?.(course)}>
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  {t("reject")}
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

