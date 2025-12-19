"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuditLogs } from "@/features/audit-log/hooks/use-audit-logs";
import { AuditLogDataTable } from "@/features/audit-log/components/audit-log-table/audit-log-data-table";
import { AuditLogDetailDialog } from "@/features/audit-log/components/audit-log-detail-dialog";
import { createColumns } from "@/features/audit-log/components/audit-log-table/columns";
import { AuditLogResponse } from "@/features/audit-log/schemas";
import { useHasPermission } from "@/lib/hooks/use-permissions";

export default function AuditLogsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("auditLog");
  const { hasPermission, loading: permissionLoading } =
    useHasPermission("audit_logs.view");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data, isLoading } = useAuditLogs(
    {
      page,
      limit: 10,
      search,
      action:
        actionFilter.length > 0
          ? actionFilter.length === 1
            ? actionFilter[0]
            : (actionFilter as any)
          : undefined,
      status:
        statusFilter.length > 0
          ? ((statusFilter.length === 1 ? statusFilter[0] : statusFilter[0]) as
              | "success"
              | "error"
              | undefined)
          : undefined,
      entityType:
        entityTypeFilter.length > 0
          ? entityTypeFilter.length === 1
            ? entityTypeFilter[0]
            : (entityTypeFilter as any)
          : undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: hasPermission,
    }
  );

  const handleViewDetails = (log: AuditLogResponse) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const columns = createColumns(t, handleViewDetails);

  // Check permission
  if (permissionLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{tCommon("accessDenied")}</h2>
          <p className="text-muted-foreground mt-2">
            {tCommon("noPermission")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Data Table - No Card wrapper */}
      <AuditLogDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        entityTypeFilter={entityTypeFilter}
        onEntityTypeFilterChange={setEntityTypeFilter}
      />

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        log={selectedLog}
      />
    </div>
  );
}
