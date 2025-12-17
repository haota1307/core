"use client";

import { ReactNode } from "react";
import { useHasPermission, useHasAnyPermission } from "@/lib/hooks/use-permissions";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[]; // OR logic - show if has any
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component để ẩn/hiện UI dựa trên permissions
 * 
 * Usage:
 * <PermissionGuard permission="users.view">
 *   <Button>View Users</Button>
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={["users.view", "users.edit"]}>
 *   <Button>Edit Users</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  permissions,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission || "");
  const hasAnyPermission = useHasAnyPermission(permissions || []);

  // Check permission
  if (permission) {
    return hasPermission ? <>{children}</> : <>{fallback}</>;
  }

  // Check any of permissions (OR logic)
  if (permissions && permissions.length > 0) {
    return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
  }

  // No permission check specified, show children
  return <>{children}</>;
}

