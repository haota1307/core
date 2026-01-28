import { z } from "zod";

// Media Response Schema
export const MediaResponseSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  path: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  publicId: z.string().nullable().optional(), // Cloudinary public ID
  storageProvider: z.string().default("local"), // "local" or "cloudinary"
  alt: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  uploadedBy: z.string(),
  uploader: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  usageCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MediaResponse = z.infer<typeof MediaResponseSchema>;

// Upload Media Schema
export const UploadMediaSchema = z.object({
  file: z.instanceof(File),
  alt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type UploadMediaInput = z.infer<typeof UploadMediaSchema>;

// Update Media Schema
export const UpdateMediaSchema = z.object({
  alt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

// Get Media Query Schema
export const GetMediaQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  mimeType: z.string().or(z.array(z.string())).optional(),
  folderId: z.string().nullable().optional(),
  sortBy: z.enum(["createdAt", "size", "originalName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetMediaQuery = z.infer<typeof GetMediaQuerySchema>;

// Media Usage Schema
export const MediaUsageSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  fieldName: z.string().optional(),
});

export type MediaUsageInput = z.infer<typeof MediaUsageSchema>;

// API Response Types
export interface MediaListResponse {
  data: MediaResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MediaDetailResponse {
  data: MediaResponse;
}

export interface MediaUsageResponse {
  entityType: string;
  entityId: string;
  fieldName: string | null;
  createdAt: string;
}

export interface MediaWithUsageResponse extends MediaResponse {
  usages: MediaUsageResponse[];
}

// Media Folder Schemas
export const MediaFolderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  createdBy: z.string(),
  creator: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  _count: z.object({
    media: z.number(),
    children: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MediaFolderResponse = z.infer<typeof MediaFolderResponseSchema>;

export const CreateMediaFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().nullable().optional(),
});

export type CreateMediaFolderInput = z.infer<typeof CreateMediaFolderSchema>;

export const UpdateMediaFolderSchema = z.object({
  name: z.string().min(1).max(255),
});

export type UpdateMediaFolderInput = z.infer<typeof UpdateMediaFolderSchema>;

export const GetMediaFoldersQuerySchema = z.object({
  parentId: z.string().nullable().optional(),
});

export type GetMediaFoldersQuery = z.infer<typeof GetMediaFoldersQuerySchema>;

