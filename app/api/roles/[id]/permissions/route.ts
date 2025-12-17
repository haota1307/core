import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updateRolePermissionsSchema } from "@/features/role/schemas";
import { invalidateRefreshTokensByRoleId } from "@/lib/rbac-utils";

type RouteParams = Promise<{ id: string }>;

/**
 * PATCH /api/roles/[id]/permissions
 * Cập nhật permissions của role
 * Khi update permissions, sẽ invalidate tất cả refresh tokens của users có role này
 */
export const PATCH = withPermission(
  "roles.manage_permissions",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = updateRolePermissionsSchema.parse(body);

      // Check role exists
      const existingRole = await prisma.role.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingRole) {
        return NextResponse.json(
          { code: "ROLE_NOT_FOUND", message: "Role not found" },
          { status: 404 }
        );
      }

      // Verify all permission IDs exist
      const permissions = await prisma.permission.findMany({
        where: {
          id: { in: validatedData.permissionIds },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (permissions.length !== validatedData.permissionIds.length) {
        return NextResponse.json(
          {
            code: "INVALID_PERMISSIONS",
            message: "Some permissions not found",
          },
          { status: 400 }
        );
      }

      // Delete all existing role permissions (hard delete)
      // RolePermission là bảng trung gian, không cần soft delete
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: id,
        },
      });

      // Create new role permissions
      if (validatedData.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: validatedData.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Invalidate refresh tokens của tất cả users có role này
      // Để force họ phải refresh token và nhận permissions mới
      try {
        await invalidateRefreshTokensByRoleId(id);
      } catch (error) {
        console.error("Failed to invalidate refresh tokens:", error);
        // Không throw error, chỉ log vì update permissions đã thành công
      }

      // Get updated role with permissions
      const updatedRole = await prisma.role.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          createdAt: true,
          updatedAt: true,
          rolePermissions: {
            select: {
              id: true,
              permission: {
                select: {
                  id: true,
                  code: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        data: updatedRole,
        message:
          "Role permissions updated successfully. Users with this role will need to refresh their tokens.",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.errors[0].message },
          { status: 400 }
        );
      }

      console.error("Update role permissions error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
