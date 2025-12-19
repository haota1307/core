"use client";

import { Table } from "@tanstack/react-table";
import { X, PlusCircle, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface AuditLogTableToolbarProps<TData> {
  table: Table<TData>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  actionFilter: string[];
  onActionFilterChange: (values: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (values: string[]) => void;
  entityTypeFilter: string[];
  onEntityTypeFilterChange: (values: string[]) => void;
}

export function AuditLogTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  statusFilter,
  onStatusFilterChange,
  entityTypeFilter,
  onEntityTypeFilterChange,
}: AuditLogTableToolbarProps<TData>) {
  const t = useTranslations("auditLog");
  
  const isFiltered =
    searchValue !== "" ||
    actionFilter.length > 0 ||
    statusFilter.length > 0 ||
    entityTypeFilter.length > 0;

  const handleActionToggle = (value: string) => {
    const newValues = actionFilter.includes(value)
      ? actionFilter.filter((v) => v !== value)
      : [...actionFilter, value];
    onActionFilterChange(newValues);
  };

  const handleStatusToggle = (value: string) => {
    const newValues = statusFilter.includes(value)
      ? statusFilter.filter((v) => v !== value)
      : [...statusFilter, value];
    onStatusFilterChange(newValues);
  };

  const handleEntityTypeToggle = (value: string) => {
    const newValues = entityTypeFilter.includes(value)
      ? entityTypeFilter.filter((v) => v !== value)
      : [...entityTypeFilter, value];
    onEntityTypeFilterChange(newValues);
  };

  const resetFilters = () => {
    onSearchChange("");
    onActionFilterChange([]);
    onStatusFilterChange([]);
    onEntityTypeFilterChange([]);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-[200px] lg:w-[250px]"
        />

        {/* Action Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("filters.action")}
              {actionFilter.length > 0 && (
                <>
                  <div className="mx-2 h-4 w-[1px] bg-border" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {actionFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t("filters.action")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={actionFilter.includes("auth.login")}
              onCheckedChange={() => handleActionToggle("auth.login")}
            >
              {t("actions.login")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={actionFilter.includes("auth.logout")}
              onCheckedChange={() => handleActionToggle("auth.logout")}
            >
              {t("actions.logout")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={actionFilter.includes("user.create")}
              onCheckedChange={() => handleActionToggle("user.create")}
            >
              {t("actions.create")} User
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={actionFilter.includes("user.update")}
              onCheckedChange={() => handleActionToggle("user.update")}
            >
              {t("actions.update")} User
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={actionFilter.includes("user.delete")}
              onCheckedChange={() => handleActionToggle("user.delete")}
            >
              {t("actions.delete")} User
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Entity Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("filters.resource")}
              {entityTypeFilter.length > 0 && (
                <>
                  <div className="mx-2 h-4 w-[1px] bg-border" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {entityTypeFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t("filters.resource")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={entityTypeFilter.includes("auth")}
              onCheckedChange={() => handleEntityTypeToggle("auth")}
            >
              {t("resources.session")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={entityTypeFilter.includes("user")}
              onCheckedChange={() => handleEntityTypeToggle("user")}
            >
              {t("resources.user")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={entityTypeFilter.includes("role")}
              onCheckedChange={() => handleEntityTypeToggle("role")}
            >
              {t("resources.role")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={entityTypeFilter.includes("permission")}
              onCheckedChange={() => handleEntityTypeToggle("permission")}
            >
              {t("resources.permission")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={entityTypeFilter.includes("media")}
              onCheckedChange={() => handleEntityTypeToggle("media")}
            >
              {t("resources.media")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("filters.status")}
              {statusFilter.length > 0 && (
                <>
                  <div className="mx-2 h-4 w-[1px] bg-border" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {statusFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t("filters.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("success")}
              onCheckedChange={() => handleStatusToggle("success")}
            >
              {t("status.success")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("error")}
              onCheckedChange={() => handleStatusToggle("error")}
            >
              {t("status.error")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Columns Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto h-9">
            <ListFilter className="mr-2 h-4 w-4" />
            Cột
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px]">
          <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

