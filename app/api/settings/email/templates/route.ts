import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { createEmailTemplateSchema } from "@/features/settings/schemas";

/**
 * GET /api/settings/email/templates
 * Get list of email templates
 */
export const GET = withPermission(
  "settings.view",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      // Pagination
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // Search
      const search = searchParams.get("search") || "";
      const isActive = searchParams.get("isActive");

      // Build where clause
      const where: any = {
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
        ];
      }

      if (isActive !== null && isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      // Query
      const [items, total] = await Promise.all([
        prisma.emailTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
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
        }),
        prisma.emailTemplate.count({ where }),
      ]);

      return NextResponse.json({
        data: items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get email templates error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/settings/email/templates
 * Create new email template
 */
export const POST = withPermission(
  "settings.edit",
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      // Validate
      const parsed = createEmailTemplateSchema.safeParse(body);
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

      const { slug, name, subject, body: templateBody, bodyType, description, variables, isActive } = parsed.data;

      // Check slug unique
      const existing = await prisma.emailTemplate.findFirst({
        where: { slug, deletedAt: null },
      });

      if (existing) {
        return NextResponse.json(
          { code: "SLUG_EXISTS", message: "Template with this slug already exists" },
          { status: 400 }
        );
      }

      // Create
      const template = await prisma.emailTemplate.create({
        data: {
          slug,
          name,
          subject,
          body: templateBody,
          bodyType: bodyType || "html",
          description,
          variables: variables || [],
          isActive: isActive ?? true,
        },
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

      return NextResponse.json(
        { data: template, message: "Email template created successfully" },
        { status: 201 }
      );
    } catch (error) {
      console.error("Create email template error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

