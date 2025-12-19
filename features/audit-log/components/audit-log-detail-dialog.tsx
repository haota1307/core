"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuditLogResponse } from "../schemas";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface AuditLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogResponse | null;
}

export function AuditLogDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) {
  const t = useTranslations("auditLog");

  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("detail.title")}</DialogTitle>
          <DialogDescription>
            {format(new Date(log.createdAt), "PPpp")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("columns.user")}
              </p>
              <p className="text-sm mt-1">
                {log.user ? (
                  <>
                    <span className="font-medium">
                      {log.user.name || log.user.email}
                    </span>
                    {log.user.name && (
                      <span className="text-muted-foreground block">
                        {log.user.email}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="italic text-muted-foreground">System</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("columns.action")}
              </p>
              <p className="text-sm mt-1">
                <Badge variant="outline" className="capitalize">
                  {log.action.split(".").pop()?.replace("_", " ")}
                </Badge>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("columns.resource")}
              </p>
              <p className="text-sm mt-1 capitalize">{log.entityType}</p>
              {log.entityName && (
                <p className="text-xs text-muted-foreground">{log.entityName}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-sm mt-1">
                <Badge
                  variant={log.status === "success" ? "default" : "destructive"}
                >
                  {log.status}
                </Badge>
              </p>
            </div>

            {log.ipAddress && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("columns.ipAddress")}
                </p>
                <p className="text-sm mt-1 font-mono">{log.ipAddress}</p>
              </div>
            )}

            {log.entityId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("columns.resourceId")}
                </p>
                <p className="text-sm mt-1 font-mono">{log.entityId}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {log.errorMsg && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Error Message
                </p>
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {log.errorMsg}
                </div>
              </div>
            </>
          )}

          {/* Changes */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("detail.changes")}
                </p>
                <div className="space-y-3">
                  {Object.entries(log.changes as Record<string, any>).map(
                    ([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {key}
                          </p>
                          <div className="bg-muted p-2 rounded-md">
                            <p className="text-xs font-medium mb-1">
                              {t("detail.before")}
                            </p>
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(value.old, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            &nbsp;
                          </p>
                          <div className="bg-muted p-2 rounded-md">
                            <p className="text-xs font-medium mb-1">
                              {t("detail.after")}
                            </p>
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(value.new, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Metadata
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* User Agent */}
          {log.userAgent && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("detail.userAgent")}
                </p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {log.userAgent}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

