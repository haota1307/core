type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;

export type HttpClientConfig = {
  /**
   * Base URL prefix. When omitted, relative paths will be used.
   */
  baseUrl?: string;
  /**
   * Provide your own fetch (useful for testing).
   */
  fetchFn?: typeof fetch;
  /**
   * Should return a bearer token when available.
   */
  getAccessToken?: () => Promise<string | null> | string | null;
  /**
   * Called when we receive 401/403. Should return a fresh access token or null.
   */
  refreshToken?: () => Promise<string | null>;
  /**
   * Optional hook when auth ultimately fails (e.g. trigger logout).
   */
  onUnauthorized?: (status: number) => void | Promise<void>;
  /**
   * Default credentials policy. Useful when you rely on cookies.
   */
  credentials?: RequestCredentials;
};

export type RequestOptions<TBody = unknown> = Omit<
  RequestInit,
  "method" | "body" | "headers"
> & {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: TBody;
  query?: Record<string, QueryValue>;
  /**
   * Include Authorization header (default: true).
   */
  auth?: boolean;
};

export class HttpError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(status: number, message: string, data?: T) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const isJsonBody = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  typeof value === "object" &&
  !isFormData(value) &&
  !(value instanceof Blob) &&
  !(value instanceof ArrayBuffer) &&
  !(value instanceof URLSearchParams) &&
  !(value instanceof ReadableStream);

const shouldParseJson = (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

const buildUrl = (
  baseUrl: string | undefined,
  path: string,
  query?: Record<string, QueryValue>
) => {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? new URL(path)
      : new URL(path, baseUrl ?? origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  if (shouldParseJson(response)) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}

export const createHttpClient = (config: HttpClientConfig) => {
  const fetchImpl = config.fetchFn ?? fetch;

  const request = async <TResponse = unknown, TBody = unknown>(
    path: string,
    options: RequestOptions<TBody> = {},
    retrying = false
  ): Promise<TResponse> => {
    const {
      method = "GET",
      headers,
      body,
      query,
      auth = true,
      credentials,
      ...rest
    } = options;

    const url = buildUrl(config.baseUrl, path, query);

    const resolvedHeaders = new Headers(headers);

    if (auth) {
      const token = await config.getAccessToken?.();
      if (token) {
        resolvedHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    let preparedBody: BodyInit | undefined;
    if (body !== undefined) {
      if (isJsonBody(body)) {
        resolvedHeaders.set("Content-Type", "application/json");
        preparedBody = JSON.stringify(body);
      } else {
        preparedBody = body as BodyInit;
      }
    }

    const response = await fetchImpl(url, {
      method,
      headers: resolvedHeaders,
      body: preparedBody,
      credentials: credentials ?? config.credentials,
      ...rest,
    });

    if (response.ok) {
      return parseResponse<TResponse>(response);
    }

    const errorPayload = await parseResponse<unknown>(response).catch(
      () => undefined
    );

    const isUnauthorized = response.status === 401 || response.status === 403;

    if (isUnauthorized && !retrying && config.refreshToken) {
      const refreshedToken = await config.refreshToken();
      if (refreshedToken) {
        // Retry once with the new token
        return request<TResponse, TBody>(path, options, true);
      }
    }

    if (isUnauthorized) {
      await config.onUnauthorized?.(response.status);
    }

    const message =
      (errorPayload as { message?: string })?.message ??
      `Request failed with status ${response.status}`;

    throw new HttpError(response.status, message, errorPayload);
  };

  return {
    request,
    get: <TResponse = unknown>(path: string, opts?: RequestOptions<never>) =>
      request<TResponse>(path, { ...opts, method: "GET" }),
    post: <TResponse = unknown, TBody = unknown>(
      path: string,
      body?: TBody,
      opts?: RequestOptions<TBody>
    ) => request<TResponse, TBody>(path, { ...opts, method: "POST", body }),
    put: <TResponse = unknown, TBody = unknown>(
      path: string,
      body?: TBody,
      opts?: RequestOptions<TBody>
    ) => request<TResponse, TBody>(path, { ...opts, method: "PUT", body }),
    patch: <TResponse = unknown, TBody = unknown>(
      path: string,
      body?: TBody,
      opts?: RequestOptions<TBody>
    ) => request<TResponse, TBody>(path, { ...opts, method: "PATCH", body }),
    delete: <TResponse = unknown, TBody = unknown>(
      path: string,
      opts?: RequestOptions<TBody>
    ) => request<TResponse, TBody>(path, { ...opts, method: "DELETE" }),
  };
};

import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
} from "./cookies";

/**
 * Default client instance.
 * Configured with access/refresh token handling from cookies.
 */
export const http = createHttpClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include",
  getAccessToken: () => {
    return getAccessToken();
  },
  refreshToken: async () => {
    if (typeof window === "undefined") return null;

    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) return null;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        }
      );

      if (!res.ok) {
        // Refresh failed, clear tokens
        clearTokens();
        return null;
      }

      const json = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };

      const newAccessToken = json?.accessToken ?? null;
      const newRefreshToken = json?.refreshToken;

      if (newAccessToken && newRefreshToken) {
        storeTokens(newAccessToken, newRefreshToken);
      }

      return newAccessToken;
    } catch {
      // Clear tokens on error
      clearTokens();
      return null;
    }
  },
  onUnauthorized: () => {
    if (typeof window !== "undefined") {
      // Clear tokens and redirect to login
      clearTokens();
      window.location.href = "/auth/login";
    }
  },
});

export type HttpClient = ReturnType<typeof createHttpClient>;
