import { z } from "zod";

/**
 * Schema cho query parameters lấy danh sách audit logs
 */
export const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  status: z.enum(["success", "error"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Type cho query parameters
 */
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;

/**
 * Interface cho audit log response
 */
export interface AuditLogResponse {
  id: string;
  userId: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  changes: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  errorMsg: string | null;
  createdAt: Date;
}

/**
 * Interface cho danh sách audit logs
 */
export interface AuditLogListResponse {
  data: AuditLogResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Interface cho thống kê audit logs
 */
export interface AuditLogStatsResponse {
  totalLogs: number;
  successCount: number;
  errorCount: number;
  topActions: {
    action: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    userName: string | null;
    userEmail: string;
    count: number;
  }[];
  recentActivities: AuditLogResponse[];
}

