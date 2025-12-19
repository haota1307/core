import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Enum cho các actions thường dùng
 */
export enum AuditAction {
  // Auth actions
  LOGIN = "auth.login",
  LOGOUT = "auth.logout",
  REGISTER = "auth.register",
  REFRESH_TOKEN = "auth.refresh_token",

  // User actions
  USER_CREATE = "user.create",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",
  USER_VIEW = "user.view",
  USER_LIST = "user.list",

  // Role actions
  ROLE_CREATE = "role.create",
  ROLE_UPDATE = "role.update",
  ROLE_DELETE = "role.delete",
  ROLE_VIEW = "role.view",
  ROLE_LIST = "role.list",
  ROLE_ASSIGN_PERMISSIONS = "role.assign_permissions",

  // Permission actions
  PERMISSION_CREATE = "permission.create",
  PERMISSION_UPDATE = "permission.update",
  PERMISSION_DELETE = "permission.delete",
  PERMISSION_VIEW = "permission.view",
  PERMISSION_LIST = "permission.list",

  // Media actions
  MEDIA_UPLOAD = "media.upload",
  MEDIA_UPDATE = "media.update",
  MEDIA_DELETE = "media.delete",
  MEDIA_VIEW = "media.view",
  MEDIA_LIST = "media.list",
  MEDIA_MOVE = "media.move",

  // Media Folder actions
  FOLDER_CREATE = "folder.create",
  FOLDER_UPDATE = "folder.update",
  FOLDER_DELETE = "folder.delete",
  FOLDER_VIEW = "folder.view",
  FOLDER_LIST = "folder.list",
  FOLDER_MOVE = "folder.move",
}

/**
 * Interface cho dữ liệu audit log
 */
export interface AuditLogData {
  userId?: string | null;
  action: string | AuditAction;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  status?: "success" | "error";
  errorMsg?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Lấy IP address từ request
 */
export function getIpAddress(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return null;
}

/**
 * Lấy User Agent từ request
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent");
}

/**
 * Tạo audit log entry
 * @param data - Dữ liệu audit log
 * @param request - NextRequest để lấy IP và User Agent (optional)
 */
export async function createAuditLog(
  data: AuditLogData,
  request?: NextRequest
): Promise<void> {
  try {
    // Lấy IP và User Agent từ request nếu có
    const ipAddress = request ? getIpAddress(request) : data.ipAddress;
    const userAgent = request ? getUserAgent(request) : data.userAgent;

    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        entityName: data.entityName || null,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
        metadata: data.metadata
          ? JSON.parse(JSON.stringify(data.metadata))
          : null,
        status: data.status || "success",
        errorMsg: data.errorMsg || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Không throw error để tránh ảnh hưởng đến luồng chính
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Tạo audit log cho thao tác thành công
 */
export async function logSuccess(
  data: Omit<AuditLogData, "status">,
  request?: NextRequest
): Promise<void> {
  await createAuditLog({ ...data, status: "success" }, request);
}

/**
 * Tạo audit log cho thao tác thất bại
 */
export async function logError(
  data: Omit<AuditLogData, "status"> & { errorMsg: string },
  request?: NextRequest
): Promise<void> {
  await createAuditLog({ ...data, status: "error" }, request);
}

/**
 * So sánh và tạo changes object cho update operations
 * @param oldData - Dữ liệu cũ
 * @param newData - Dữ liệu mới
 * @param sensitiveFields - Các field nhạy cảm không muốn log (ví dụ: password)
 * @returns Object chứa changes
 */
export function getChanges<T extends Record<string, any>>(
  oldData: T,
  newData: Partial<T>,
  sensitiveFields: string[] = ["password", "refreshToken", "token"]
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  for (const key in newData) {
    // Bỏ qua các field nhạy cảm
    if (sensitiveFields.includes(key)) {
      continue;
    }

    const oldValue = oldData[key];
    const newValue = newData[key];

    // Chỉ log nếu có thay đổi
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  }

  return changes;
}

/**
 * Format entity name cho audit log
 */
export function formatEntityName(entity: any): string | null {
  if (!entity) return null;

  // Thử các field thường dùng để đặt tên
  if (entity.name) return entity.name;
  if (entity.email) return entity.email;
  if (entity.title) return entity.title;
  if (entity.filename) return entity.filename;
  if (entity.id) return entity.id;

  return null;
}
