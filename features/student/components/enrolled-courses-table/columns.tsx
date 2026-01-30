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
import { MoreHorizontal, Eye, BookOpen, Play } from "lucide-react";
import { EnrolledCourseResponse } from "../../schemas";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

type TranslateFunction = (key: string) => string;

interface ColumnActions {
  onView?: (course: EnrolledCourseResponse) => void;
  onContinue?: (course: EnrolledCourseResponse) => void;
}

export function createColumns(
  t: TranslateFunction,
  actions: ColumnActions
): ColumnDef<EnrolledCourseResponse>[] {
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
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{course.instructor.name || course.instructor.email}</span>
              {course.category && (
                <>
                  <span>•</span>
                  <span>{course.category.name}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "progress",
      header: t("progress"),
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="w-[200px]">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{course.progress}%</span>
              <span className="text-muted-foreground">
                {course.completedLessons}/{course.totalLessons} {t("lessons")}
              </span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<
          string,
          "default" | "secondary" | "destructive" | "outline"
        > = {
          ACTIVE: "default",
          COMPLETED: "secondary",
          EXPIRED: "destructive",
          REFUNDED: "outline",
        };
        return (
          <Badge variant={variants[status] || "secondary"}>
            {t(`statuses.${status.toLowerCase()}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "enrolledAt",
      header: t("enrolledAt"),
      cell: ({ row }) => {
        return format(new Date(row.original.enrolledAt), "dd/MM/yyyy", {
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

              {actions.onContinue && (
                <DropdownMenuItem onClick={() => actions.onContinue?.(course)}>
                  <Play className="mr-2 h-4 w-4" />
                  {t("continue")}
                </DropdownMenuItem>
              )}

              {actions.onView && (
                <DropdownMenuItem onClick={() => actions.onView?.(course)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("view")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
