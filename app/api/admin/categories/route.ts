import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getCategoriesQuerySchema, createCategorySchema } from "@/features/admin/categories/schemas";
import { createAuditLog } from "@/lib/audit-log";

/**
 * GET /api/admin/categories
 * Lấy danh sách danh mục
 */
export const GET = withPermission(
  "categories.manage",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      
      // Check if this is a request for all categories (no pagination)
      const getAll = searchParams.get("all") === "true";
      
      if (getAll) {
        // Return all categories without pagination
        const where: Record<string, unknown> = {};
        
        if (searchParams.get("search")) {
          where.OR = [
            { name: { contains: searchParams.get("search"), mode: "insensitive" } },
            { slug: { contains: searchParams.get("search"), mode: "insensitive" } },
          ];
        }
        
        if (searchParams.get("parentId")) {
          where.parentId = searchParams.get("parentId");
        }
        
        const sortBy = searchParams.get("sortBy") || "name";
        const sortOrder = searchParams.get("sortOrder") || "asc";
        const orderBy = { [sortBy]: sortOrder };
        
        const categories = await prisma.category.findMany({
          where,
          orderBy,
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                courses: true,
                children: true,
              },
            },
          },
        });
        
        return NextResponse.json({ data: categories });
      }
      
      // Normal paginated request
      const query = getCategoriesQuerySchema.parse({
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
        search: searchParams.get("search") || undefined,
        parentId: searchParams.get("parentId") || undefined,
        sortBy: searchParams.get("sortBy") || "name",
        sortOrder: searchParams.get("sortOrder") || "asc",
      });

      const skip = (query.page - 1) * query.limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { slug: { contains: query.search, mode: "insensitive" } },
        ];
      }

      if (query.parentId) {
        where.parentId = query.parentId;
      }

      const orderBy = { [query.sortBy || "name"]: query.sortOrder || "asc" };

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: query.limit,
          orderBy,
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                courses: true,
                children: true,
              },
            },
          },
        }),
        prisma.category.count({ where }),
      ]);

      return NextResponse.json({
        data: categories,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/admin/categories
 * Tạo danh mục mới
 */
export const POST = withPermission(
  "categories.manage",
  async (request: NextRequest, context, authContext) => {
    try {
      const user = authContext!.user;
      const body = await request.json();
      const validatedData = createCategorySchema.parse(body);

      // Generate slug if not provided
      let slug = validatedData.slug;
      if (!slug) {
        slug = validatedData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[đĐ]/g, "d")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }

      // Check if slug exists
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      const category = await prisma.category.create({
        data: {
          name: validatedData.name,
          slug: finalSlug,
          description: validatedData.description,
          image: validatedData.image,
          parentId: validatedData.parentId,
        },
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
        action: "CREATE",
        entityType: "Category",
        entityId: category.id,
        entityName: category.name,
        metadata: {
          parentId: category.parentId,
        },
      });

      return NextResponse.json(
        { data: category, message: "Category created successfully" },
        { status: 201 }
      );
    } catch (error) {
      console.error("Create category error:", error);
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

