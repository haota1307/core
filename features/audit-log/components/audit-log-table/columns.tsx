"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { AuditLogResponse } from "../../schemas";
import { format } from "date-fns";

export function createColumns(
  t: any,
  onViewDetails: (log: AuditLogResponse) => void
): ColumnDef<AuditLogResponse>[] {
  return [
    {
      accessorKey: "createdAt",
      header: t("columns.timestamp"),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm">{format(date, "MMM dd, yyyy")}</span>
            <span className="text-xs text-muted-foreground">
              {format(date, "HH:mm:ss")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: t("columns.user"),
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) {
          return (
            <span className="text-muted-foreground italic">System</span>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name || user.email}</span>
            {user.name && (
              <span className="text-xs text-muted-foreground">{user.email}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "action",
      header: t("columns.action"),
      cell: ({ row }) => {
        const action = row.original.action;
        // Format action: "user.create" -> "Create"
        const actionParts = action.split(".");
        const actionName = actionParts[actionParts.length - 1];
        
        return (
          <Badge variant="outline" className="capitalize">
            {actionName.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entityType",
      header: t("columns.resource"),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="text-sm capitalize">{row.original.entityType}</span>
            {row.original.entityName && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {row.original.entityName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === "success" ? "default" : "destructive"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "ipAddress",
      header: t("columns.ipAddress"),
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {row.original.ipAddress || "-"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("columns.details"),
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];
}

