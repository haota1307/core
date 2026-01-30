import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getWishlistQuerySchema, toggleWishlistSchema } from "@/features/student/schemas";

/**
 * GET /api/student/wishlist
 * Lấy danh sách khóa học trong wishlist
 * Note: Hiện tại chưa có model Wishlist trong schema, sẽ cần thêm sau
 * Tạm thời trả về empty array
 */
export const GET = withPermission(
  "courses.enrolled",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;

      const searchParams = request.nextUrl.searchParams;
      const query = getWishlistQuerySchema.parse({
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
        search: searchParams.get("search") || undefined,
        categoryId: searchParams.get("categoryId") || undefined,
        level: searchParams.get("level") || undefined,
        sortBy: searchParams.get("sortBy") || "addedAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
      });

      // TODO: Implement wishlist when Wishlist model is added to schema
      // For now, return empty list
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page: query.page,
          limit: query.limit,
          totalPages: 0,
        },
      });
    } catch (error) {
      console.error("Get student wishlist error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/student/wishlist
 * Thêm khóa học vào wishlist
 */
export const POST = withPermission(
  "courses.enrolled",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;
      const body = await request.json();
      const { courseId } = toggleWishlistSchema.parse(body);

      // TODO: Implement wishlist when Wishlist model is added to schema
      return NextResponse.json(
        { message: "Wishlist feature coming soon" },
        { status: 501 }
      );
    } catch (error) {
      console.error("Add to wishlist error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/student/wishlist
 * Xóa khóa học khỏi wishlist
 */
export const DELETE = withPermission(
  "courses.enrolled",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;
      const searchParams = request.nextUrl.searchParams;
      const courseId = searchParams.get("courseId");

      if (!courseId) {
        return NextResponse.json(
          { code: "MISSING_FIELDS", message: "Course ID is required" },
          { status: 400 }
        );
      }

      // TODO: Implement wishlist when Wishlist model is added to schema
      return NextResponse.json(
        { message: "Wishlist feature coming soon" },
        { status: 501 }
      );
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
