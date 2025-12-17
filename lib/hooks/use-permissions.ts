"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";

interface UserPermissions {
  permissions: string[];
  loading: boolean;
}

const PERMISSIONS_CACHE_KEY = "user_permissions";
const PERMISSIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedPermissions {
  permissions: string[];
  timestamp: number;
}

/**
 * Hook để lấy permissions từ API và cache
 */
export function usePermissions(): UserPermissions {
  const [cached, setCached] = useState<string[] | null>(null);

  // Try to get from cache first
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedData = localStorage.getItem(PERMISSIONS_CACHE_KEY);
      if (cachedData) {
        try {
          const parsed: CachedPermissions = JSON.parse(cachedData);
          const now = Date.now();
          // Use cache if less than 5 minutes old
          if (now - parsed.timestamp < PERMISSIONS_CACHE_DURATION) {
            setCached(parsed.permissions);
          }
        } catch {
          // Invalid cache, ignore
        }
      }
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const result = await http.get<{ data: { permissions: string[] } }>(
          "/api/auth/me"
        );

        const permissions = result.data?.permissions || [];

        // Cache permissions
        if (typeof window !== "undefined") {
          localStorage.setItem(
            PERMISSIONS_CACHE_KEY,
            JSON.stringify({
              permissions,
              timestamp: Date.now(),
            })
          );
        }

        return permissions;
      } catch (error) {
        // If unauthorized, return empty array (user not logged in)
        console.error("Failed to fetch user permissions:", error);
        return [];
      }
    },
    enabled: !cached, // Only fetch if not cached
    staleTime: PERMISSIONS_CACHE_DURATION,
    retry: false,
  });

  const permissions = cached || data || [];
  const loading = !cached && isLoading;

  return { permissions, loading };
}

/**
 * Hook để check một permission cụ thể
 */
export function useHasPermission(permission: string): {
  hasPermission: boolean;
  loading: boolean;
} {
  const { permissions, loading } = usePermissions();

  return {
    hasPermission: permissions.includes(permission),
    loading,
  };
}

/**
 * Hook để check một trong nhiều permissions (OR logic)
 */
export function useHasAnyPermission(requiredPermissions: string[]): {
  hasPermission: boolean;
  loading: boolean;
} {
  const { permissions, loading } = usePermissions();

  return {
    hasPermission: requiredPermissions.some((p) => permissions.includes(p)),
    loading,
  };
}

/**
 * Hook để check tất cả permissions (AND logic)
 */
export function useHasAllPermissions(requiredPermissions: string[]): {
  hasPermission: boolean;
  loading: boolean;
} {
  const { permissions, loading } = usePermissions();

  return {
    hasPermission: requiredPermissions.every((p) => permissions.includes(p)),
    loading,
  };
}

/**
 * Clear permissions cache (call after logout or permission updates)
 */
export function clearPermissionsCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  }
}
