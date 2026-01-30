"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";
import { CertificatesDataTable } from "@/features/student/components/certificates-table/certificates-data-table";
import { createColumns } from "@/features/student/components/certificates-table/columns";
import { useCertificates } from "@/features/student/hooks/use-student";
import { CertificateResponse } from "@/features/student/schemas";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";

const CertificatesPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("certificates.view");
  const tCommon = useTranslations("common");
  const t = useTranslations("student.certificates");
  const tTable = useTranslations("student.certificates.table");

  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle sorting changes
  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  // Build query params
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch certificates with React Query
  const { data, isLoading } = useCertificates(
    {
      page,
      limit: 10,
      search,
      sortBy,
      sortOrder,
    },
    {
      enabled: hasViewPermission,
    }
  );

  // Columns with actions
  const columns = createColumns(tTable, {
    onView: (certificate) => {
      // Open certificate in new tab if URL exists
      if (certificate.certificateUrl) {
        window.open(certificate.certificateUrl, "_blank");
      }
    },
    onDownload: (certificate) => {
      // Download certificate if URL exists
      if (certificate.certificateUrl) {
        const link = document.createElement("a");
        link.href = certificate.certificateUrl;
        link.download = `${certificate.courseTitle}-certificate.pdf`;
        link.click();
      }
    },
  });

  // Check permission
  if (permissionsLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!hasViewPermission) {
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

      {/* Data Table */}
      <CertificatesDataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.meta.totalPages || 1}
        currentPage={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
};

export default CertificatesPage;
