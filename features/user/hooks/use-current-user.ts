"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUserAction } from "../actions";
import type { UserResponse } from "../schemas";

export interface CurrentUserData {
  user: UserResponse;
  permissions: string[];
}

/**
 * Hook lấy thông tin user hiện tại
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: async () => {
      const result = await getCurrentUserAction();
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("[useCurrentUser] result:", result);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
