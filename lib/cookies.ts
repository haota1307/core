/**
 * Cookie utilities for token management
 */

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export const COOKIE_OPTIONS = {
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Set a cookie (client-side)
 */
export function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // Encode value to handle special characters
  const encodedValue = encodeURIComponent(value);

  const secure = window.location.protocol === "https:" ? "Secure;" : "";
  document.cookie = `${name}=${encodedValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; ${secure}`;
}

/**
 * Get a cookie value (client-side)
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const encodedValue = c.substring(nameEQ.length, c.length);
      // Decode value to handle special characters
      try {
        return decodeURIComponent(encodedValue);
      } catch {
        // If decode fails, return as-is (backwards compatibility)
        return encodedValue;
      }
    }
  }

  return null;
}

/**
 * Delete a cookie (client-side)
 */
export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Store auth tokens in cookies only
 */
export function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;

  // Store in cookies only
  setCookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, 1); // 1 day for access token
  setCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, 7); // 7 days for refresh token
}

/**
 * Get access token from cookie
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = getCookie(COOKIE_NAMES.ACCESS_TOKEN);
  if (!token) {
    console.warn(
      `[Cookies] Access token not found. Cookie name: ${COOKIE_NAMES.ACCESS_TOKEN}`
    );
    console.log(`[Cookies] All cookies: ${document.cookie}`);
  }
  return token;
}

/**
 * Get refresh token from cookie
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Clear all auth tokens from cookies
 */
export function clearTokens() {
  if (typeof window === "undefined") return;

  // Clear from cookies
  deleteCookie(COOKIE_NAMES.ACCESS_TOKEN);
  deleteCookie(COOKIE_NAMES.REFRESH_TOKEN);
}
