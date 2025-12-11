import { User, Role, Permission } from "@/app/generated/prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role?: Role & {
    rolePermissions: Array<{
      permission: Permission;
    }>;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  user: AuthUser;
  permissions: string[];
}

