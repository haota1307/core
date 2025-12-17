import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updateRoleSchema } from "@/features/role/schemas";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/roles/[id]
 * Lấy chi tiết role với permissions
 */
export const GET = withPermission(
  "roles.view",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;

      const role = await prisma.role.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          createdAt: true,
          updatedAt: true,
          rolePermissions: {
            where: { deletedAt: null },
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

      if (!role) {
        return NextResponse.json(
          { code: "ROLE_NOT_FOUND", message: "Role not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: role });
    } catch (error) {
      console.error("Get role error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/roles/[id]
 * Cập nhật role (name, description)
 */
export const PATCH = withPermission(
  "roles.edit",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = updateRoleSchema.parse(body);

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

      // Check if trying to edit system role
      if (existingRole.isSystem) {
        return NextResponse.json(
          { code: "SYSTEM_ROLE", message: "Cannot edit system role" },
          { status: 403 }
        );
      }

      // Check name conflict if name is being updated
      if (validatedData.name && validatedData.name !== existingRole.name) {
        const nameExists = await prisma.role.findFirst({
          where: {
            name: validatedData.name,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (nameExists) {
          return NextResponse.json(
            { code: "ROLE_EXISTS", message: "Role name already exists" },
            { status: 409 }
          );
        }
      }

      // Update role
      const updateData: any = {};
      if (validatedData.name !== undefined)
        updateData.name = validatedData.name;
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description || null;

      const role = await prisma.role.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        data: role,
        message: "Role updated successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.errors[0].message },
          { status: 400 }
        );
      }

      console.error("Update role error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/roles/[id]
 * Xóa role (soft delete)
 */
export const DELETE = withPermission(
  "roles.delete",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;

      // Check role exists
      const existingRole = await prisma.role.findFirst({
        where: { id, deletedAt: null },
        include: {
          users: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      });

      if (!existingRole) {
        return NextResponse.json(
          { code: "ROLE_NOT_FOUND", message: "Role not found" },
          { status: 404 }
        );
      }

      // Check if trying to delete system role
      if (existingRole.isSystem) {
        return NextResponse.json(
          { code: "SYSTEM_ROLE", message: "Cannot delete system role" },
          { status: 403 }
        );
      }

      // Check if role has users
      if (existingRole.users.length > 0) {
        return NextResponse.json(
          {
            code: "ROLE_IN_USE",
            message: "Cannot delete role that is assigned to users",
          },
          { status: 409 }
        );
      }

      // Soft delete role
      await prisma.role.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Also soft delete all role permissions
      await prisma.rolePermission.updateMany({
        where: { roleId: id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({
        message: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Delete role error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
