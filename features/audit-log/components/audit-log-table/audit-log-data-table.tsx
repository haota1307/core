"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { useTranslations } from "next-intl";
import { AuditLogTableToolbar } from "./audit-log-table-toolbar";

interface AuditLogDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  actionFilter: string[];
  onActionFilterChange: (values: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (values: string[]) => void;
  entityTypeFilter: string[];
  onEntityTypeFilterChange: (values: string[]) => void;
}

export function AuditLogDataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pageCount,
  currentPage,
  onPageChange,
  searchValue,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  statusFilter,
  onStatusFilterChange,
  entityTypeFilter,
  onEntityTypeFilterChange,
}: AuditLogDataTableProps<TData, TValue>) {
  const t = useTranslations("auditLog");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <AuditLogTableToolbar
          table={table}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          actionFilter={actionFilter}
          onActionFilterChange={onActionFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          entityTypeFilter={entityTypeFilter}
          onEntityTypeFilterChange={onEntityTypeFilterChange}
        />
        <div className="flex items-center justify-center h-64 rounded-md border">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AuditLogTableToolbar
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        actionFilter={actionFilter}
        onActionFilterChange={onActionFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        entityTypeFilter={entityTypeFilter}
        onEntityTypeFilterChange={onEntityTypeFilterChange}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <Empty title={t("noResults")} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={pageCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}

