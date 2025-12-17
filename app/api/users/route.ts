import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";

/**
 * GET /api/users
 * Lấy danh sách users với phân trang, search, filter
 */
export const GET = withPermission(
  "users.view",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      // Pagination
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // Search
      const search = searchParams.get("search") || "";

      // Filters - support multiple values
      const roleIds = searchParams.getAll("roleId"); // Get all roleId params
      const statuses = searchParams.getAll("status"); // Get all status params

      // Sorting
      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortOrder = searchParams.get("sortOrder") || "desc";

      // Build where clause with AND logic for combining filters
      const whereConditions: any[] = [
        { deletedAt: null }, // Always include soft delete filter
      ];

      // Search condition: (email contains OR name contains)
      if (search) {
        whereConditions.push({
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        });
      }

      // Filter by roleId(s) - support multiple roleIds
      if (roleIds.length > 0) {
        if (roleIds.length === 1) {
          whereConditions.push({ roleId: roleIds[0] });
        } else {
          whereConditions.push({ roleId: { in: roleIds } });
        }
      }

      // Filter by status(es) - support multiple statuses
      if (statuses.length > 0) {
        const statusConditions: any[] = [];

        statuses.forEach((status) => {
          if (status === "active") {
            statusConditions.push({ emailVerified: { not: null } });
          } else if (status === "pending") {
            statusConditions.push({ emailVerified: null });
          } else if (status === "inactive") {
            statusConditions.push({ emailVerified: null });
          }
        });

        if (statusConditions.length > 0) {
          // If multiple statuses, use OR logic
          if (statusConditions.length === 1) {
            whereConditions.push(statusConditions[0]);
          } else {
            whereConditions.push({ OR: statusConditions });
          }
        }
      }

      // Combine all conditions with AND
      const where =
        whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions };

      // Build orderBy
      const orderBy: any = {};
      if (sortBy === "name" || sortBy === "email") {
        orderBy[sortBy] = sortOrder;
      } else if (sortBy === "role") {
        orderBy.role = { name: sortOrder };
      } else if (sortBy === "status") {
        orderBy.emailVerified = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Get users with role info
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
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
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/users
 * Tạo user mới
 */
export const POST = withPermission(
  "users.create",
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { email, name, password, roleId } = body;

      // Validation
      if (!email || !password) {
        return NextResponse.json(
          {
            code: "MISSING_FIELDS",
            message: "Email and password are required",
          },
          { status: 400 }
        );
      }

      // Check email exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && !existingUser.deletedAt) {
        return NextResponse.json(
          { code: "EMAIL_EXISTS", message: "Email already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          roleId: roleId || null,
        },
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

      return NextResponse.json(
        { data: user, message: "User created successfully" },
        { status: 201 }
      );
    } catch (error) {
      console.error("Create user error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
