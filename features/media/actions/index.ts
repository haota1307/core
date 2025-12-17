"use server";

import { http } from "@/lib/http";
import {
  MediaResponse,
  MediaListResponse,
  MediaDetailResponse,
  UpdateMediaInput,
  GetMediaQuery,
  MediaWithUsageResponse,
} from "../schemas";

export async function getMediaAction(query: GetMediaQuery) {
  try {
    const params = new URLSearchParams();
    params.append("page", query.page.toString());
    params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.mimeType) {
      if (Array.isArray(query.mimeType)) {
        query.mimeType.forEach((type) => params.append("mimeType", type));
      } else {
        params.append("mimeType", query.mimeType);
      }
    }
    if (query.folderId !== undefined) {
      params.append("folderId", query.folderId || "");
    }
    params.append("sortBy", query.sortBy);
    params.append("sortOrder", query.sortOrder);

    const response = await http.get<MediaListResponse>(
      `/api/media?${params.toString()}`
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Get media error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch media",
    };
  }
}

export async function getMediaDetailAction(id: string) {
  try {
    const response = await http.get<{ data: MediaWithUsageResponse }>(
      `/api/media/${id}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Get media detail error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch media detail",
    };
  }
}

export async function updateMediaAction(id: string, data: UpdateMediaInput) {
  try {
    const response = await http.patch<MediaDetailResponse>(
      `/api/media/${id}`,
      data
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Update media error:", error);
    return {
      success: false,
      error: error.message || "Failed to update media",
    };
  }
}

export async function deleteMediaAction(id: string) {
  try {
    await http.delete(`/api/media/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete media error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete media",
    };
  }
}
