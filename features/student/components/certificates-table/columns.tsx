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
import { MoreHorizontal, Eye, Download, Award } from "lucide-react";
import { CertificateResponse } from "../../schemas";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

type TranslateFunction = (key: string) => string;

interface ColumnActions {
  onView?: (certificate: CertificateResponse) => void;
  onDownload?: (certificate: CertificateResponse) => void;
}

export function createColumns(
  t: TranslateFunction,
  actions: ColumnActions
): ColumnDef<CertificateResponse>[] {
  return [
    {
      accessorKey: "courseThumbnail",
      header: "",
      cell: ({ row }) => {
        const certificate = row.original;
        return (
          <div className="relative h-12 w-20 overflow-hidden rounded">
            {certificate.courseThumbnail ? (
              <Image
                src={certificate.courseThumbnail}
                alt={certificate.courseTitle}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Award className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "courseTitle",
      header: t("course"),
      cell: ({ row }) => {
        const certificate = row.original;
        return (
          <div className="max-w-[300px]">
            <p className="font-medium truncate">{certificate.courseTitle}</p>
            <p className="text-sm text-muted-foreground">
              {certificate.instructorName}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "certificateNumber",
      header: t("certificateNumber"),
      cell: ({ row }) => {
        return (
          <span className="font-mono text-sm">{row.original.certificateNumber}</span>
        );
      },
    },
    {
      accessorKey: "issuedAt",
      header: t("issuedAt"),
      cell: ({ row }) => {
        return format(new Date(row.original.issuedAt), "dd/MM/yyyy", {
          locale: vi,
        });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const certificate = row.original;
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
                <DropdownMenuItem onClick={() => actions.onView?.(certificate)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("view")}
                </DropdownMenuItem>
              )}

              {actions.onDownload && certificate.certificateUrl && (
                <DropdownMenuItem onClick={() => actions.onDownload?.(certificate)}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("download")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
