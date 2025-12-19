import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { getAuditLogsQuerySchema } from "@/features/audit-log/schemas";

/**
 * GET /api/audit-logs
 * Lấy danh sách audit logs với phân trang, search, filter
 */
export const GET = withPermission(
  "audit_logs.view",
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      // Parse và validate query params
      const query = getAuditLogsQuerySchema.parse({
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
        search: searchParams.get("search") || undefined,
        userId: searchParams.get("userId") || undefined,
        action: searchParams.get("action") || undefined,
        entityType: searchParams.get("entityType") || undefined,
        entityId: searchParams.get("entityId") || undefined,
        status: searchParams.get("status") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
        sortBy: searchParams.get("sortBy") || undefined,
        sortOrder: searchParams.get("sortOrder") || undefined,
      });

      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereConditions: any[] = [];

      // Search trong action, entityType, entityName
      if (query.search) {
        whereConditions.push({
          OR: [
            { action: { contains: query.search, mode: "insensitive" } },
            { entityType: { contains: query.search, mode: "insensitive" } },
            { entityName: { contains: query.search, mode: "insensitive" } },
          ],
        });
      }

      // Filter by userId
      if (query.userId) {
        whereConditions.push({ userId: query.userId });
      }

      // Filter by action
      if (query.action) {
        whereConditions.push({ action: query.action });
      }

      // Filter by entityType
      if (query.entityType) {
        whereConditions.push({ entityType: query.entityType });
      }

      // Filter by entityId
      if (query.entityId) {
        whereConditions.push({ entityId: query.entityId });
      }

      // Filter by status
      if (query.status) {
        whereConditions.push({ status: query.status });
      }

      // Filter by date range
      if (query.startDate || query.endDate) {
        const dateFilter: any = {};
        if (query.startDate) {
          dateFilter.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          dateFilter.lte = new Date(query.endDate);
        }
        whereConditions.push({ createdAt: dateFilter });
      }

      // Combine all conditions with AND
      const where =
        whereConditions.length === 0
          ? {}
          : whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions };

      // Build orderBy
      const sortBy = query.sortBy || "createdAt";
      const sortOrder = query.sortOrder || "desc";
      const orderBy: any = {};
      
      if (sortBy === "user") {
        orderBy.user = { email: sortOrder };
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Query
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            action: true,
            entityType: true,
            entityId: true,
            entityName: true,
            changes: true,
            metadata: true,
            ipAddress: true,
            userAgent: true,
            status: true,
            errorMsg: true,
            createdAt: true,
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return NextResponse.json({
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      
      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.errors[0].message },
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

