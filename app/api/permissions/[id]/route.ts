import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updatePermissionSchema } from "@/features/role/schemas";
import { invalidateRefreshTokensByRoleId } from "@/lib/rbac-utils";

type RouteParams = Promise<{ id: string }>;

/**
 * PATCH /api/permissions/[id]
 * Cập nhật permission
 */
export const PATCH = withPermission(
  "permissions.manage",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = updatePermissionSchema.parse(body);

      // Check permission exists
      const existingPermission = await prisma.permission.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingPermission) {
        return NextResponse.json(
          { code: "PERMISSION_NOT_FOUND", message: "Permission not found" },
          { status: 404 }
        );
      }

      // Check code conflict if code is being updated
      if (
        validatedData.code &&
        validatedData.code !== existingPermission.code
      ) {
        const codeExists = await prisma.permission.findFirst({
          where: {
            code: validatedData.code,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (codeExists) {
          return NextResponse.json(
            {
              code: "PERMISSION_EXISTS",
              message: "Permission code already exists",
            },
            { status: 409 }
          );
        }
      }

      // Update permission
      const updateData: any = {};
      if (validatedData.code !== undefined)
        updateData.code = validatedData.code;
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description || null;

      const permission = await prisma.permission.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          code: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Invalidate refresh tokens của tất cả roles có permission này
      // Lấy tất cả roles có permission này
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          permissionId: id,
          deletedAt: null,
        },
        select: {
          roleId: true,
        },
      });

      const roleIds = [...new Set(rolePermissions.map((rp) => rp.roleId))];

      // Invalidate refresh tokens cho mỗi role
      for (const roleId of roleIds) {
        try {
          await invalidateRefreshTokensByRoleId(roleId);
        } catch (error) {
          console.error(
            `Failed to invalidate refresh tokens for role ${roleId}:`,
            error
          );
        }
      }

      return NextResponse.json({
        data: permission,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.errors[0].message },
          { status: 400 }
        );
      }

      console.error("Update permission error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/permissions/[id]
 * Xóa permission (soft delete)
 */
export const DELETE = withPermission(
  "permissions.manage",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;

      // Check permission exists
      const existingPermission = await prisma.permission.findFirst({
        where: { id, deletedAt: null },
        include: {
          rolePermissions: {
            where: { deletedAt: null },
            select: {
              roleId: true,
            },
          },
        },
      });

      if (!existingPermission) {
        return NextResponse.json(
          { code: "PERMISSION_NOT_FOUND", message: "Permission not found" },
          { status: 404 }
        );
      }

      // Get unique role IDs that use this permission
      const roleIds = [
        ...new Set(existingPermission.rolePermissions.map((rp) => rp.roleId)),
      ];

      // Soft delete permission
      await prisma.permission.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete all role permissions using this permission
      await prisma.rolePermission.updateMany({
        where: { permissionId: id },
        data: { deletedAt: new Date() },
      });

      // Invalidate refresh tokens của tất cả roles có permission này
      for (const roleId of roleIds) {
        try {
          await invalidateRefreshTokensByRoleId(roleId);
        } catch (error) {
          console.error(
            `Failed to invalidate refresh tokens for role ${roleId}:`,
            error
          );
        }
      }

      return NextResponse.json({
        success: true,
      });
    } catch (error) {
      console.error("Delete permission error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
