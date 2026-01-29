import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit-log";
import { updateCategorySchema } from "@/features/admin/categories/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/categories/[id]
 * Lấy chi tiết danh mục
 */
export const GET = withPermission(
  "categories.manage",
  async (request: NextRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              courses: true,
              children: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: category });
    } catch (error) {
      console.error("Get category error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/admin/categories/[id]
 * Cập nhật danh mục
 */
export const PATCH = withPermission(
  "categories.manage",
  async (request: NextRequest, context: RouteContext, authContext) => {
    try {
      const { id } = await context.params;
      const user = authContext!.user;
      const body = await request.json();

      const validatedData = updateCategorySchema.parse(body);

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Category not found" },
          { status: 404 }
        );
      }

      // Check for circular reference
      if (validatedData.parentId === id) {
        return NextResponse.json(
          { code: "INVALID_PARENT", message: "Category cannot be its own parent" },
          { status: 400 }
        );
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: validatedData,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entityType: "Category",
        entityId: id,
        entityName: updatedCategory.name,
        request,
      });

      return NextResponse.json({
        data: updatedCategory,
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("Update category error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid input data" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/admin/categories/[id]
 * Xóa danh mục
 */
export const DELETE = withPermission(
  "categories.manage",
  async (request: NextRequest, context: RouteContext, authContext) => {
    try {
      const { id } = await context.params;
      const user = authContext!.user;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Category not found" },
          { status: 404 }
        );
      }

      // Move children to parent (or root)
      if (category._count.children > 0) {
        await prisma.category.updateMany({
          where: { parentId: id },
          data: { parentId: category.parentId },
        });
      }

      // Remove category from courses
      await prisma.course.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });

      // Delete category
      await prisma.category.delete({
        where: { id },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "DELETE",
        entityType: "Category",
        entityId: id,
        entityName: category.name,
        request,
      });

      return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

