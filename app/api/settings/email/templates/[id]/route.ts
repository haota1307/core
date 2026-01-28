import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { updateEmailTemplateSchema } from "@/features/settings/schemas";

type RouteParams = Promise<{ id: string }>;

/**
 * GET /api/settings/email/templates/[id]
 * Get single email template
 */
export const GET = withPermission(
  "settings.view",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;

      const template = await prisma.emailTemplate.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          slug: true,
          name: true,
          subject: true,
          body: true,
          bodyType: true,
          description: true,
          variables: true,
          isSystem: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!template) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Email template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: template });
    } catch (error) {
      console.error("Get email template error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/settings/email/templates/[id]
 * Update email template
 */
export const PATCH = withPermission(
  "settings.edit",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Validate
      const parsed = updateEmailTemplateSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues?.[0];
        return NextResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: firstError?.message || "Invalid input",
          },
          { status: 400 }
        );
      }

      // Check exists
      const existing = await prisma.emailTemplate.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Email template not found" },
          { status: 404 }
        );
      }

      // Update
      const template = await prisma.emailTemplate.update({
        where: { id },
        data: parsed.data,
        select: {
          id: true,
          slug: true,
          name: true,
          subject: true,
          body: true,
          bodyType: true,
          description: true,
          variables: true,
          isSystem: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        data: template,
        message: "Email template updated successfully",
      });
    } catch (error) {
      console.error("Update email template error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/settings/email/templates/[id]
 * Soft delete email template
 */
export const DELETE = withPermission(
  "settings.edit",
  async (request: NextRequest, { params }: { params: RouteParams }) => {
    try {
      const { id } = await params;

      const existing = await prisma.emailTemplate.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Email template not found" },
          { status: 404 }
        );
      }

      // Cannot delete system templates
      if (existing.isSystem) {
        return NextResponse.json(
          { code: "SYSTEM_TEMPLATE", message: "System templates cannot be deleted" },
          { status: 400 }
        );
      }

      // Soft delete
      await prisma.emailTemplate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({
        message: "Email template deleted successfully",
      });
    } catch (error) {
      console.error("Delete email template error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

