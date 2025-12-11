import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, hasPermission } from "./auth-middleware";

/**
 * Higher-order function để bảo vệ API route với authentication
 */
export function withAuth<T>(
  handler: (
    request: NextRequest,
    context: { params: T },
    authContext: Awaited<ReturnType<typeof getAuthContext>>
  ) => Promise<Response>
) {
  return async (request: NextRequest, context: { params: T }) => {
    const authContext = await getAuthContext(request);

    if (!authContext) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    return handler(request, context, authContext);
  };
}

/**
 * Higher-order function để bảo vệ API route với permission check
 */
export function withPermission<T>(
  permission: string,
  handler: (
    request: NextRequest,
    context: { params: T },
    authContext: Awaited<ReturnType<typeof getAuthContext>>
  ) => Promise<Response>
) {
  return withAuth<T>(async (request, context, authContext) => {
    if (!authContext) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasPermission(authContext, permission)) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
        { status: 403 }
      );
    }

    return handler(request, context, authContext);
  });
}

/**
 * Higher-order function để bảo vệ API route với nhiều permissions (OR logic)
 */
export function withAnyPermission<T>(
  permissions: string[],
  handler: (
    request: NextRequest,
    context: { params: T },
    authContext: Awaited<ReturnType<typeof getAuthContext>>
  ) => Promise<Response>
) {
  return withAuth<T>(async (request, context, authContext) => {
    if (!authContext) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const hasAccess = permissions.some((p) =>
      authContext.permissions.includes(p)
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
        { status: 403 }
      );
    }

    return handler(request, context, authContext);
  });
}
