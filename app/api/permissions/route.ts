import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import {
  createPermissionSchema,
  getPermissionsQuerySchema,
} from "@/features/role/schemas";

/**
 * GET /api/permissions
 * Lấy danh sách permissions với phân trang, search
 */
export const GET = withPermission(
  "permissions.view",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      // Parse và validate query params
      // Convert null to undefined for optional fields
      const query = getPermissionsQuerySchema.parse({
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
        search: searchParams.get("search") || undefined,
        sortBy: searchParams.get("sortBy") || undefined,
        sortOrder: searchParams.get("sortOrder") || undefined,
      });

      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereConditions: any[] = [
        { deletedAt: null }, // Always include soft delete filter
      ];

      // Search condition: (code contains OR description contains)
      if (query.search) {
        whereConditions.push({
          OR: [
            { code: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        });
      }

      // Combine all conditions with AND
      const where =
        whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions };

      // Build orderBy
      const orderBy: any = {};
      if (
        query.sortBy === "code" ||
        query.sortBy === "createdAt" ||
        query.sortBy === "updatedAt"
      ) {
        orderBy[query.sortBy] = query.sortOrder || "asc";
      } else {
        orderBy.code = query.sortOrder || "asc";
      }

      // Get permissions with pagination
      const [permissions, total] = await Promise.all([
        prisma.permission.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            code: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.permission.count({ where }),
      ]);

      return NextResponse.json({
        data: permissions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get permissions error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/permissions
 * Tạo permission mới
 */
export const POST = withPermission(
  "permissions.manage",
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = createPermissionSchema.parse(body);

      // Check if permission code already exists
      const existingPermission = await prisma.permission.findFirst({
        where: {
          code: validatedData.code,
          deletedAt: null,
        },
      });

      if (existingPermission) {
        return NextResponse.json(
          {
            code: "PERMISSION_EXISTS",
            message: "Permission code already exists",
          },
          { status: 409 }
        );
      }

      // Create permission
      const permission = await prisma.permission.create({
        data: {
          code: validatedData.code,
          description: validatedData.description || null,
        },
        select: {
          id: true,
          code: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ data: permission }, { status: 201 });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.errors[0].message },
          { status: 400 }
        );
      }

      console.error("Create permission error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
