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

interface AdminCourseTableToolbarProps<TData> {
  table: Table<TData>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (values: string[]) => void;
  levelFilter: string[];
  onLevelFilterChange: (values: string[]) => void;
}

export function AdminCourseTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  levelFilter,
  onLevelFilterChange,
}: AdminCourseTableToolbarProps<TData>) {
  const t = useTranslations("admin.courses.table");
  const isFiltered =
    searchValue !== "" || statusFilter.length > 0 || levelFilter.length > 0;

  const handleStatusToggle = (value: string) => {
    const newValues = statusFilter.includes(value)
      ? statusFilter.filter((v) => v !== value)
      : [...statusFilter, value];
    onStatusFilterChange(newValues);
  };

  const handleLevelToggle = (value: string) => {
    const newValues = levelFilter.includes(value)
      ? levelFilter.filter((v) => v !== value)
      : [...levelFilter, value];
    onLevelFilterChange(newValues);
  };

  const resetFilters = () => {
    onSearchChange("");
    onStatusFilterChange([]);
    onLevelFilterChange([]);
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

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("status")}
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
            <DropdownMenuLabel>{t("status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("DRAFT")}
              onCheckedChange={() => handleStatusToggle("DRAFT")}
            >
              {t("statuses.draft")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("PENDING_REVIEW")}
              onCheckedChange={() => handleStatusToggle("PENDING_REVIEW")}
            >
              {t("statuses.pending_review")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("PUBLISHED")}
              onCheckedChange={() => handleStatusToggle("PUBLISHED")}
            >
              {t("statuses.published")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("REJECTED")}
              onCheckedChange={() => handleStatusToggle("REJECTED")}
            >
              {t("statuses.rejected")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("ARCHIVED")}
              onCheckedChange={() => handleStatusToggle("ARCHIVED")}
            >
              {t("statuses.archived")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Level Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("level")}
              {levelFilter.length > 0 && (
                <>
                  <div className="mx-2 h-4 w-[1px] bg-border" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {levelFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t("level")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={levelFilter.includes("BEGINNER")}
              onCheckedChange={() => handleLevelToggle("BEGINNER")}
            >
              {t("levels.beginner")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={levelFilter.includes("INTERMEDIATE")}
              onCheckedChange={() => handleLevelToggle("INTERMEDIATE")}
            >
              {t("levels.intermediate")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={levelFilter.includes("ADVANCED")}
              onCheckedChange={() => handleLevelToggle("ADVANCED")}
            >
              {t("levels.advanced")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={levelFilter.includes("ALL_LEVELS")}
              onCheckedChange={() => handleLevelToggle("ALL_LEVELS")}
            >
              {t("levels.all_levels")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-9 px-2 lg:px-3"
          >
            {t("clearFilters")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Columns Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto h-9">
            <ListFilter className="mr-2 h-4 w-4" />
            {t("columnsToggle")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px]">
          <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
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

