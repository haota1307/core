"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { loginAction, registerAction, logoutAction } from "../actions";
import type { LoginInput, RegisterInput } from "../schemas";
import { toast } from "sonner";
import { storeTokens, clearTokens } from "@/lib/cookies";

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
    onSuccess: (data) => {
      // Store tokens in both localStorage and cookies
      storeTokens(data.accessToken, data.refreshToken);
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
    onSuccess: (data) => {
      // Store tokens in both localStorage and cookies
      storeTokens(data.accessToken, data.refreshToken);
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
      router.push("/auth/login");
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
