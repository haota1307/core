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

interface RoleTableToolbarProps<TData> {
  table: Table<TData>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSystemFilter: boolean[];
  onIsSystemFilterChange: (values: boolean[]) => void;
}

export function RoleTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  isSystemFilter,
  onIsSystemFilterChange,
}: RoleTableToolbarProps<TData>) {
  const t = useTranslations("roles");
  const isFiltered =
    searchValue !== "" || isSystemFilter.length > 0;

  const handleIsSystemToggle = (value: boolean) => {
    const newValues = isSystemFilter.includes(value)
      ? isSystemFilter.filter((v) => v !== value)
      : [...isSystemFilter, value];
    onIsSystemFilterChange(newValues);
  };

  const resetFilters = () => {
    onSearchChange("");
    onIsSystemFilterChange([]);
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

        {/* System Role Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("filters.isSystem")}
              {isSystemFilter.length > 0 && (
                <>
                  <div className="mx-2 h-4 bg-border" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {isSystemFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t("filters.isSystem")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={isSystemFilter.includes(true)}
              onCheckedChange={() => handleIsSystemToggle(true)}
            >
              {t("filters.systemRole")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isSystemFilter.includes(false)}
              onCheckedChange={() => handleIsSystemToggle(false)}
            >
              {t("filters.customRole")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-9 px-2 lg:px-3"
          >
            {t("actions.reset")}
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

