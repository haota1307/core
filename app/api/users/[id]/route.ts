import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import {
  createAuditLog,
  AuditAction,
  getChanges,
  formatEntityName,
} from "@/lib/audit-log";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/users/[id]
 * Lấy chi tiết user
 */
export const GET = withPermission(
  "users.view",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext: any
  ) => {
    try {
      const { id } = await params;

      const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              rolePermissions: {
                where: { deletedAt: null },
                select: {
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
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: "User not found" },
          { status: 404 }
        );
      }

      // Log audit
      await createAuditLog(
        {
          userId: authContext.user.id,
          action: AuditAction.USER_VIEW,
          entityType: "user",
          entityId: user.id,
          entityName: formatEntityName(user),
        },
        request
      );

      return NextResponse.json({ data: user });
    } catch (error) {
      console.error("Get user error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/users/[id]
 * Cập nhật user
 */
export const PATCH = withPermission(
  "users.edit",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext: any
  ) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { email, name, password, roleId, image } = body;

      // Check user exists
      const existingUser = await prisma.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingUser) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: "User not found" },
          { status: 404 }
        );
      }

      // Check email conflict
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (emailExists) {
          return NextResponse.json(
            { code: "EMAIL_EXISTS", message: "Email already exists" },
            { status: 409 }
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (image !== undefined) updateData.image = image;
      if (roleId !== undefined) updateData.roleId = roleId;

      // Hash new password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Get changes for audit log (excluding password)
      const changes = getChanges(existingUser, updateData);

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log audit
      await createAuditLog(
        {
          userId: authContext.user.id,
          action: AuditAction.USER_UPDATE,
          entityType: "user",
          entityId: user.id,
          entityName: formatEntityName(user),
          changes,
        },
        request
      );

      return NextResponse.json({
        data: user,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Update user error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/users/[id]
 * Xóa user (soft delete)
 */
export const DELETE = withPermission(
  "users.delete",
  async (
    request: NextRequest,
    { params }: { params: RouteParams },
    authContext: any
  ) => {
    try {
      const { id } = await params;

      // Check user exists
      const existingUser = await prisma.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingUser) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: "User not found" },
          { status: 404 }
        );
      }

      // Soft delete user
      await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Also delete all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { deletedAt: new Date() },
      });

      // Log audit
      await createAuditLog(
        {
          userId: authContext.user.id,
          action: AuditAction.USER_DELETE,
          entityType: "user",
          entityId: existingUser.id,
          entityName: formatEntityName(existingUser),
        },
        request
      );

      return NextResponse.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

