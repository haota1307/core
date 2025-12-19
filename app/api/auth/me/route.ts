import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { getUserWithPermissions } from "@/lib/auth-middleware";

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại kèm permissions
 */
export const GET = withAuth(
  async (request: NextRequest, context: any, authContext: any) => {
    try {
      if (!authContext) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: "Authentication required" },
          { status: 401 }
        );
      }

      // Get full user data with permissions
      const user = await getUserWithPermissions(authContext.user.id);

      if (!user) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: "User not found" },
          { status: 404 }
        );
      }

      const permissions =
        user.role?.rolePermissions.map((rp) => rp.permission.code) || [];

      return NextResponse.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || undefined,
          },
          permissions,
        },
      });
    } catch (error) {
      console.error("Get current user error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
