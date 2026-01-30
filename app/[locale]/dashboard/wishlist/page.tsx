"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SortingState } from "@tanstack/react-table";
import { useWishlist, useRemoveFromWishlist } from "@/features/student/hooks/use-student";
import { WishlistItemResponse } from "@/features/student/schemas";
import { useTranslations } from "next-intl";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WishlistPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission: hasViewPermission, loading: permissionsLoading } =
    useHasPermission("courses.enrolled");
  const tCommon = useTranslations("common");
  const t = useTranslations("student.wishlist");

  // State for pagination and search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Fetch wishlist with React Query
  const { data, isLoading } = useWishlist(
    {
      page,
      limit: 12,
      search,
    },
    {
      enabled: hasViewPermission,
    }
  );

  const removeMutation = useRemoveFromWishlist();

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

  const wishlistItems = data?.data || [];
  const totalPages = data?.meta.totalPages || 1;

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

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[200px] lg:w-[250px]"
        />
      </div>

      {/* Wishlist Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wishlistItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative h-48 w-full">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Heart className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeMutation.mutate(item.courseId)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 line-clamp-2 font-semibold">{item.title}</h3>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.shortDescription}
                  </p>
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.instructor.name || item.instructor.email}</span>
                    {item.category && (
                      <>
                        <span>•</span>
                        <span>{item.category.name}</span>
                      </>
                    )}
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">
                        {Number(item.rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({item.reviewCount})
                      </span>
                    </div>
                    <div className="text-right">
                      {item.salePrice ? (
                        <>
                          <span className="font-semibold text-primary">
                            {new Intl.NumberFormat("vi-VN").format(item.salePrice)}{" "}
                            {item.currency}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground line-through">
                            {new Intl.NumberFormat("vi-VN").format(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">
                          {item.price === 0
                            ? t("free")
                            : `${new Intl.NumberFormat("vi-VN").format(item.price)} ${item.currency}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/${locale}/courses/${item.slug}`)
                      }
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t("viewCourse")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("page")} {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t("empty.title")}</h3>
            <p className="text-muted-foreground">{t("empty.description")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WishlistPage;
