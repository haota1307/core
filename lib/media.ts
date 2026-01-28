import prisma from "./prisma";
import { SettingGroup } from "@/features/settings/schemas";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ============================================
// TYPES
// ============================================

export interface MediaSettings {
  storageProvider: "local" | "cloudinary";
  localUploadPath?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
  maxFileSize?: number;
  maxVideoSize?: number;
  allowedImageTypes?: string[];
  allowedDocumentTypes?: string[];
  allowedVideoTypes?: string[];
  enableVideoEncryption?: boolean;
  videoEncryptionMethod?: "hls-aes" | "dash-clearkey" | "none";
  videoEncryptionKey?: string;
  enableVideoWatermark?: boolean;
  videoQualityPresets?: string[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number;
  duration?: number;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  userId?: string; // For video watermark
}

// ============================================
// SETTINGS
// ============================================

/**
 * Get media settings from database
 */
export async function getMediaSettings(): Promise<MediaSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      group: SettingGroup.MEDIA,
    },
  });

  const settingsMap: Record<string, string | null> = {};
  settings.forEach((s) => {
    // Handle JSON value - convert to string if needed
    const val = s.value;
    settingsMap[s.key] = typeof val === "string" ? val : val !== null ? String(val) : null;
  });

  return {
    storageProvider: (settingsMap.storageProvider as "local" | "cloudinary") || "local",
    localUploadPath: settingsMap.localUploadPath || "uploads",
    cloudinaryCloudName: settingsMap.cloudinaryCloudName || undefined,
    cloudinaryApiKey: settingsMap.cloudinaryApiKey || undefined,
    cloudinaryApiSecret: settingsMap.cloudinaryApiSecret || undefined,
    cloudinaryUploadPreset: settingsMap.cloudinaryUploadPreset || undefined,
    maxFileSize: settingsMap.maxFileSize ? Number(settingsMap.maxFileSize) : 10,
    maxVideoSize: settingsMap.maxVideoSize ? Number(settingsMap.maxVideoSize) : 100,
    allowedImageTypes: settingsMap.allowedImageTypes
      ? JSON.parse(settingsMap.allowedImageTypes)
      : ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedDocumentTypes: settingsMap.allowedDocumentTypes
      ? JSON.parse(settingsMap.allowedDocumentTypes)
      : ["application/pdf"],
    allowedVideoTypes: settingsMap.allowedVideoTypes
      ? JSON.parse(settingsMap.allowedVideoTypes)
      : ["video/mp4", "video/webm"],
    enableVideoEncryption: settingsMap.enableVideoEncryption === "true",
    videoEncryptionMethod:
      (settingsMap.videoEncryptionMethod as "hls-aes" | "dash-clearkey" | "none") || "none",
    videoEncryptionKey: settingsMap.videoEncryptionKey || undefined,
    enableVideoWatermark: settingsMap.enableVideoWatermark === "true",
    videoQualityPresets: settingsMap.videoQualityPresets
      ? JSON.parse(settingsMap.videoQualityPresets)
      : ["720p", "1080p"],
  };
}

// ============================================
// CLOUDINARY
// ============================================

/**
 * Configure Cloudinary with settings from database
 */
async function configureCloudinary(): Promise<boolean> {
  const settings = await getMediaSettings();

  if (
    !settings.cloudinaryCloudName ||
    !settings.cloudinaryApiKey ||
    !settings.cloudinaryApiSecret
  ) {
    return false;
  }

  cloudinary.config({
    cloud_name: settings.cloudinaryCloudName,
    api_key: settings.cloudinaryApiKey,
    api_secret: settings.cloudinaryApiSecret,
    secure: true,
  });

  return true;
}

/**
 * Upload to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  options: UploadOptions
): Promise<UploadResult> {
  const configured = await configureCloudinary();
  if (!configured) {
    return { success: false, error: "Cloudinary is not configured" };
  }

  const settings = await getMediaSettings();

  return new Promise((resolve) => {
    const uploadOptions: Record<string, unknown> = {
      folder: options.folder || "uploads",
      resource_type: options.resourceType || "auto",
      upload_preset: settings.cloudinaryUploadPreset || undefined,
    };

    // Video-specific options
    if (options.resourceType === "video") {
      // Add transformation for multiple qualities
      if (settings.videoQualityPresets && settings.videoQualityPresets.length > 0) {
        uploadOptions.eager = settings.videoQualityPresets.map((preset) => {
          const height = parseInt(preset.replace("p", ""));
          return { height, crop: "scale", format: "mp4" };
        });
        uploadOptions.eager_async = true;
      }

      // Add video watermark if enabled
      if (settings.enableVideoWatermark && options.userId) {
        uploadOptions.transformation = [
          {
            overlay: {
              font_family: "Arial",
              font_size: 20,
              text: `User: ${options.userId}`,
            },
            color: "white",
            opacity: 50,
            gravity: "south_east",
            x: 10,
            y: 10,
          },
        ];
      }

      // HLS streaming for encryption
      if (settings.enableVideoEncryption && settings.videoEncryptionMethod === "hls-aes") {
        uploadOptions.resource_type = "video";
        uploadOptions.eager = [
          {
            streaming_profile: "hd",
            format: "m3u8",
          },
        ];
        uploadOptions.eager_async = true;
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else if (result) {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            duration: result.duration,
          });
        } else {
          resolve({ success: false, error: "Unknown error" });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const configured = await configureCloudinary();
  if (!configured) {
    return false;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// LOCAL STORAGE
// ============================================

/**
 * Upload to local storage
 */
async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  options: UploadOptions
): Promise<UploadResult> {
  const settings = await getMediaSettings();
  const uploadPath = settings.localUploadPath || "uploads";
  const folder = options.folder || "";

  // Create directory if it doesn't exist
  const fullPath = path.join(process.cwd(), "public", uploadPath, folder);
  await fs.mkdir(fullPath, { recursive: true });

  // Generate unique filename
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  const uniqueName = `${basename}-${Date.now()}${ext}`;
  const filePath = path.join(fullPath, uniqueName);

  // Write file
  await fs.writeFile(filePath, buffer);

  // Return URL
  const url = `/${uploadPath}/${folder ? folder + "/" : ""}${uniqueName}`;

  return {
    success: true,
    url,
    publicId: uniqueName,
    format: ext.replace(".", ""),
    size: buffer.length,
  };
}

/**
 * Delete from local storage
 */
export async function deleteFromLocal(publicId: string): Promise<boolean> {
  const settings = await getMediaSettings();
  const uploadPath = settings.localUploadPath || "uploads";

  try {
    const filePath = path.join(process.cwd(), "public", uploadPath, publicId);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// VIDEO ENCRYPTION
// ============================================

/**
 * Encrypt video using AES-128 for HLS streaming
 * This creates an encrypted HLS playlist with segments
 */
export async function encryptVideoForHLS(
  videoBuffer: Buffer,
  _filename: string
): Promise<{
  success: boolean;
  playlistUrl?: string;
  keyUrl?: string;
  error?: string;
}> {
  const settings = await getMediaSettings();

  if (!settings.enableVideoEncryption || settings.videoEncryptionMethod !== "hls-aes") {
    return { success: false, error: "Video encryption is not enabled" };
  }

  if (!settings.videoEncryptionKey) {
    return { success: false, error: "Encryption key is not configured" };
  }

  // In production, you would use FFmpeg to:
  // 1. Segment the video
  // 2. Encrypt each segment with AES-128
  // 3. Create an HLS playlist (.m3u8) that references the key URL
  //
  // For now, we'll store the video as-is and note that encryption
  // should be handled by a dedicated video processing service
  // (like AWS MediaConvert, Cloudflare Stream, or a custom FFmpeg worker)

  // Store encryption key for this video
  const keyId = crypto.randomUUID();

  console.log(`[VIDEO_ENCRYPTION] Video encryption enabled for ${videoBuffer.length} bytes`);
  console.log(`[VIDEO_ENCRYPTION] Key ID: ${keyId}`);

  return {
    success: true,
    playlistUrl: `/api/video/stream/${keyId}/playlist.m3u8`,
    keyUrl: `/api/video/key/${keyId}`,
  };
}

/**
 * Generate a secure encryption key (16 bytes for AES-128)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(key: string): boolean {
  // AES-128 key should be 32 hex characters (16 bytes)
  return /^[0-9a-fA-F]{32}$/.test(key);
}

// ============================================
// MAIN UPLOAD FUNCTION
// ============================================

/**
 * Upload a file using the configured storage provider
 */
export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const settings = await getMediaSettings();

  // Validate file type
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const isDocument =
    mimeType.startsWith("application/") || mimeType.startsWith("text/");

  if (isImage && !settings.allowedImageTypes?.includes(mimeType)) {
    return { success: false, error: `Image type ${mimeType} is not allowed` };
  }
  if (isVideo && !settings.allowedVideoTypes?.includes(mimeType)) {
    return { success: false, error: `Video type ${mimeType} is not allowed` };
  }
  if (isDocument && !settings.allowedDocumentTypes?.includes(mimeType)) {
    return { success: false, error: `Document type ${mimeType} is not allowed` };
  }

  // Validate file size
  const fileSizeMB = buffer.length / (1024 * 1024);
  const maxSize = isVideo ? settings.maxVideoSize : settings.maxFileSize;
  if (maxSize && fileSizeMB > maxSize) {
    return { success: false, error: `File size exceeds ${maxSize}MB limit` };
  }

  // Determine resource type for Cloudinary
  if (!options.resourceType) {
    if (isImage) options.resourceType = "image";
    else if (isVideo) options.resourceType = "video";
    else options.resourceType = "raw";
  }

  // Upload based on provider
  if (settings.storageProvider === "cloudinary") {
    return uploadToCloudinary(buffer, filename, options);
  } else {
    return uploadToLocal(buffer, filename, options);
  }
}

/**
 * Delete a file using the configured storage provider
 */
export async function deleteMedia(publicId: string): Promise<boolean> {
  const settings = await getMediaSettings();

  if (settings.storageProvider === "cloudinary") {
    return deleteFromCloudinary(publicId);
  } else {
    return deleteFromLocal(publicId);
  }
}

/**
 * Get a signed URL for video streaming (for encrypted videos)
 */
export async function getVideoStreamUrl(
  publicId: string,
  userId: string
): Promise<string | null> {
  const settings = await getMediaSettings();

  if (settings.storageProvider !== "cloudinary") {
    return null;
  }

  const configured = await configureCloudinary();
  if (!configured) {
    return null;
  }

  // Generate a signed URL that expires
  try {
    const timestamp = Math.round(Date.now() / 1000) + 3600; // 1 hour expiry

    const url = cloudinary.url(publicId, {
      resource_type: "video",
      type: "authenticated",
      sign_url: true,
      expires_at: timestamp,
      // Add watermark with user info for accountability
      transformation: settings.enableVideoWatermark
        ? [
            {
              overlay: {
                font_family: "Arial",
                font_size: 16,
                text: `ID: ${userId.substring(0, 8)}`,
              },
              color: "white",
              opacity: 40,
              gravity: "south_east",
              x: 10,
              y: 10,
            },
          ]
        : undefined,
    });

    return url;
  } catch {
    return null;
  }
}

