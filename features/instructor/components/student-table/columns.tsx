"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StudentResponse } from "../../schemas";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type TranslateFunction = (key: string) => string;

export function createStudentColumns(
  t: TranslateFunction
): ColumnDef<StudentResponse>[] {
  return [
    {
      accessorKey: "name",
      header: t("student"),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.image || undefined} alt={student.name || ""} />
              <AvatarFallback>
                {(student.name || student.email)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{student.name || t("noName")}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "courseTitle",
      header: t("course"),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">
          {row.original.courseTitle}
        </span>
      ),
    },
    {
      accessorKey: "progress",
      header: t("progress"),
      cell: ({ row }) => {
        const progress = row.original.progress;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-sm text-muted-foreground w-10">
              {progress}%
            </span>
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
          ACTIVE: "default",
          COMPLETED: "secondary",
          EXPIRED: "outline",
          REFUNDED: "destructive",
        };
        return (
          <Badge variant={variants[status] || "secondary"}>
            {t(`statuses.${status.toLowerCase()}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "pricePaid",
      header: t("pricePaid"),
      cell: ({ row }) => (
        <span>
          {new Intl.NumberFormat("vi-VN").format(row.original.pricePaid)} VND
        </span>
      ),
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
      accessorKey: "completedAt",
      header: t("completedAt"),
      cell: ({ row }) => {
        const completedAt = row.original.completedAt;
        if (!completedAt) return <span className="text-muted-foreground">-</span>;
        return format(new Date(completedAt), "dd/MM/yyyy", { locale: vi });
      },
    },
  ];
}

