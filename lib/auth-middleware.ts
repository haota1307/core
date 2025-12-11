import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { AuthContext, JWTPayload } from "@/lib/types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Lấy access token từ request header
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Verify JWT token và trả về payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Lấy thông tin user từ database kèm role và permissions
 */
export async function getUserWithPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: { deletedAt: null },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Middleware chính: verify token và lấy auth context
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  try {
    // 1. Lấy token từ header
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    // 2. Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // 3. Lấy user từ DB với role và permissions
    const user = await getUserWithPermissions(payload.userId);
    if (!user) {
      return null;
    }

    // 4. Extract permissions
    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.code) || [];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || undefined,
      },
      permissions,
    };
  } catch (error) {
    console.error("Get auth context error:", error);
    return null;
  }
}

/**
 * Check nếu user có permission cụ thể
 */
export function hasPermission(
  authContext: AuthContext,
  permission: string
): boolean {
  return authContext.permissions.includes(permission);
}

/**
 * Check nếu user có ít nhất một trong các permissions
 */
export function hasAnyPermission(
  authContext: AuthContext,
  permissions: string[]
): boolean {
  return permissions.some((p) => authContext.permissions.includes(p));
}

/**
 * Check nếu user có tất cả các permissions
 */
export function hasAllPermissions(
  authContext: AuthContext,
  permissions: string[]
): boolean {
  return permissions.every((p) => authContext.permissions.includes(p));
}
