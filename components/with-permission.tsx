"use client";

import { ReactNode } from "react";
import { useHasPermission, useHasAnyPermission } from "@/lib/hooks/use-permissions";
import { AccessDenied } from "./access-denied";
import { Skeleton } from "@/components/ui/skeleton";

interface WithPermissionProps {
  permission?: string;
  permissions?: string[]; // OR logic - show if has any of these
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * HOC để bảo vệ component/page dựa trên permissions
 * 
 * Usage:
 * <WithPermission permission="users.view">
 *   <UsersPage />
 * </WithPermission>
 * 
 * <WithPermission permissions={["users.view", "users.edit"]}>
 *   <UsersPage />
 * </WithPermission>
 */
export function WithPermission({
  permission,
  permissions,
  children,
  fallback,
  showLoading = true,
}: WithPermissionProps) {
  // Check single permission
  const {
    hasPermission: hasSinglePermission,
    loading: singleLoading,
  } = useHasPermission(permission || "");

  // Check multiple permissions (OR logic)
  const {
    hasPermission: hasAnyPermission,
    loading: anyLoading,
  } = useHasAnyPermission(permissions || []);

  // Determine which check to use
  const isLoading = permission ? singleLoading : anyLoading;
  const hasPermission = permission
    ? hasSinglePermission
    : hasAnyPermission;

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied />;
  }

  // Show children if has permission
  return <>{children}</>;
}
