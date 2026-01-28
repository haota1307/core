"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { http } from "@/lib/http";
import { loginAction, registerAction, logoutAction } from "../actions";
import type { LoginInput, RegisterInput, PasswordPolicy } from "../schemas";
import { toast } from "sonner";
import { storeTokens, clearTokens } from "@/lib/cookies";
import { clearPermissionsCache } from "@/lib/hooks/use-permissions";

/**
 * Hook to fetch password policy from server
 */
export const usePasswordPolicy = () => {
  return useQuery<PasswordPolicy>({
    queryKey: ["password-policy"],
    queryFn: async () => {
      return http.get<PasswordPolicy>("/api/settings/password-policy", {
        auth: false,
      });
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useLogin = () => {
  const router = useRouter();
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await loginAction(input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: async (data) => {
      // Store tokens in both localStorage and cookies
      storeTokens(data.accessToken, data.refreshToken);

      // Navigate first, permissions will be fetched by usePermissions hook
      router.replace("/dashboard");
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      // Try to get translated message, fallback to original message or default
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};

export const useRegister = () => {
  const router = useRouter();
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const result = await registerAction(input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: async (data) => {
      // Store tokens in both localStorage and cookies
      storeTokens(data.accessToken, data.refreshToken);

      // Navigate first, permissions will be fetched by usePermissions hook
      router.replace("/dashboard");
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      // Try to get translated message, fallback to original message or default
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const t = useTranslations("auth.errors");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await logoutAction();
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      // Clear tokens from both localStorage and cookies
      clearTokens();
      // Clear permissions cache
      clearPermissionsCache();
      // Clear all React Query cache
      queryClient.clear();
      router.push("/auth/login");
    },
    onError: (error: any) => {
      // Even if API call fails, still logout on client side
      // This handles cases where token is expired or API is down
      clearTokens();
      clearPermissionsCache();
      queryClient.clear();

      const errorCode = error.code || "UNKNOWN_ERROR";
      // Try to get translated message, fallback to original message or default
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);

      // Still redirect to login even on error
      router.push("/auth/login");
    },
  });
};

// Verification hooks
export const useSendVerificationCode = () => {
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async ({ email, type }: { email: string; type: "email_verify" | "password_reset" }) => {
      const response = await http.post<{ success: boolean }>(
        "/api/auth/send-code", 
        { email, type },
        { auth: false }
      );
      return response;
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};

export const useVerifyCode = () => {
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async ({ 
      email, 
      code, 
      type 
    }: { 
      email: string; 
      code: string; 
      type: "email_verify" | "password_reset";
    }) => {
      const response = await http.post<{ success: boolean }>(
        "/api/auth/verify-code", 
        { email, code, type },
        { auth: false }
      );
      return response;
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};

export const useForgotPassword = () => {
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await http.post<{ success: boolean }>(
        "/api/auth/forgot-password", 
        { email },
        { auth: false }
      );
      return response;
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();
  const t = useTranslations("auth.errors");

  return useMutation({
    mutationFn: async ({ 
      email, 
      code, 
      newPassword 
    }: { 
      email: string; 
      code: string; 
      newPassword: string;
    }) => {
      const response = await http.post<{ success: boolean }>(
        "/api/auth/reset-password", 
        { email, code, newPassword },
        { auth: false }
      );
      return response;
    },
    onSuccess: () => {
      toast.success(t("passwordResetSuccess") || "Password reset successfully");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const errorCode = error.code || "UNKNOWN_ERROR";
      let message: string;
      try {
        message = t(errorCode);
      } catch {
        message = error.message || t("UNKNOWN_ERROR");
      }
      toast.error(message);
    },
  });
};
