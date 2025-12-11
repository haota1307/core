"use server";

import { http } from "@/lib/http";
import type { LoginInput, RegisterInput } from "../schemas";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

export type AuthError = {
  message: string;
  code?: string;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

/**
 * Server action: Login
 */
export async function loginAction(
  input: LoginInput
): Promise<ActionResult<AuthResponse>> {
  try {
    const response = await http.post<AuthResponse>("/api/auth/login", input, {
      auth: false,
    });
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || "Login failed",
        code: error.data?.code || "UNKNOWN_ERROR",
      },
    };
  }
}

/**
 * Server action: Register
 */
export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<AuthResponse>> {
  try {
    const response = await http.post<AuthResponse>(
      "/api/auth/register",
      input,
      {
        auth: false,
      }
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || "Registration failed",
        code: error.data?.code || "UNKNOWN_ERROR",
      },
    };
  }
}

/**
 * Server action: Refresh token
 */
export async function refreshTokenAction(
  refreshToken: string
): Promise<ActionResult<AuthResponse>> {
  try {
    const response = await http.post<AuthResponse>(
      "/api/auth/refresh",
      { refreshToken },
      {
        auth: false,
      }
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || "Token refresh failed",
        code: error.data?.code || "UNKNOWN_ERROR",
      },
    };
  }
}

/**
 * Server action: Logout
 */
export async function logoutAction(): Promise<ActionResult<void>> {
  try {
    await http.post<void>("/api/auth/logout", undefined, {
      auth: true,
    });
    return { success: true, data: undefined };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || "Logout failed",
        code: error.data?.code || "UNKNOWN_ERROR",
      },
    };
  }
}
