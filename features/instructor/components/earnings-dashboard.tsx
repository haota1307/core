"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorEarnings } from "../hooks/use-instructor";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function EarningsDashboard() {
  const t = useTranslations("instructor.earnings");
  const { data, isLoading, error } = useInstructorEarnings();

  if (isLoading) {
    return <EarningsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("errorLoading")}
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalEarnings")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalEarnings)} <span className="text-sm font-normal">VND</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("allTime")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalEnrollments")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalEnrollments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("studentsEnrolled")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalCourses")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {t("publishedCourses")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("averageRating")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              {data.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("overallRating")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("monthlyEarnings")}</CardTitle>
          <CardDescription>{t("monthlyEarningsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("period")}</TableHead>
                <TableHead className="text-right">{t("revenue")}</TableHead>
                <TableHead className="text-right">{t("platformFee")}</TableHead>
                <TableHead className="text-right">{t("netEarnings")}</TableHead>
                <TableHead className="text-right">{t("enrollments")}</TableHead>
                <TableHead>{t("payoutStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthlyEarnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("noEarningsYet")}
                  </TableCell>
                </TableRow>
              ) : (
                data.monthlyEarnings.map((earning) => (
                  <TableRow key={`${earning.year}-${earning.month}`}>
                    <TableCell className="font-medium">
                      {format(new Date(earning.year, earning.month - 1), "MMMM yyyy", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(earning.totalRevenue)} VND
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -{formatCurrency(earning.platformFee)} VND
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(earning.netEarnings)} VND
                    </TableCell>
                    <TableCell className="text-right">
                      {earning.enrollmentCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={earning.isPaidOut ? "default" : "secondary"}>
                        {earning.isPaidOut ? t("paid") : t("pending")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentTransactions")}</CardTitle>
          <CardDescription>{t("recentTransactionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("course")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noTransactionsYet")}
                  </TableCell>
                </TableRow>
              ) : (
                data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === "ENROLLMENT" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        {t(`transactionTypes.${tx.type.toLowerCase()}`)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.courseTitle || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          tx.type === "ENROLLMENT" ? "text-green-600" : "text-red-600"
                        }
                      >
                        {tx.type === "ENROLLMENT" ? "+" : "-"}
                        {formatCurrency(tx.amount)} VND
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "COMPLETED"
                            ? "default"
                            : tx.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {t(`transactionStatuses.${tx.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EarningsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

