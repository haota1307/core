import { http } from "@/lib/http";
import {
  GetAuditLogsQuery,
  AuditLogListResponse,
  AuditLogResponse,
  AuditLogStatsResponse,
} from "../schemas";

/**
 * Lấy danh sách audit logs
 */
export async function getAuditLogsAction(query: GetAuditLogsQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    
    if (query.search) params.append("search", query.search);
    if (query.userId) params.append("userId", query.userId);
    if (query.action) params.append("action", query.action);
    if (query.entityType) params.append("entityType", query.entityType);
    if (query.entityId) params.append("entityId", query.entityId);
    if (query.status) params.append("status", query.status);
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await http.get<AuditLogListResponse>(
      `/api/audit-logs?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch audit logs",
    };
  }
}

/**
 * Lấy chi tiết audit log
 */
export async function getAuditLogAction(id: string) {
  try {
    const response = await http.get<{ data: AuditLogResponse }>(
      `/api/audit-logs/${id}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch audit log",
    };
  }
}

/**
 * Lấy thống kê audit logs
 */
export async function getAuditLogStatsAction() {
  try {
    const response = await http.get<{ data: AuditLogStatsResponse }>(
      `/api/audit-logs/stats`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch audit log stats",
    };
  }
}

/**
 * Xóa audit logs cũ (chỉ admin mới có quyền)
 */
export async function deleteOldAuditLogsAction(olderThanDays: number) {
  try {
    const response = await http.delete<{ message: string; deletedCount: number }>(
      `/api/audit-logs/cleanup?olderThanDays=${olderThanDays}`
    );
    return { 
      success: true, 
      message: response.message,
      deletedCount: response.deletedCount 
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete old audit logs",
    };
  }
}

