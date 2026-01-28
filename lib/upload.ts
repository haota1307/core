import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import prisma from "./prisma";
import { SettingGroup } from "@/features/settings/schemas";

// ============================================
// TYPES
// ============================================

export interface UploadConfig {
  uploadDir: string;
  maxFileSize: number; // bytes
  maxVideoSize: number; // bytes
  allowedMimeTypes: string[];
  generateThumbnail: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export interface MediaSettings {
  storageProvider: "local" | "cloudinary";
  localUploadPath: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
  maxFileSize: number; // MB
  maxVideoSize: number; // MB
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  allowedVideoTypes: string[];
  // Cloudinary image optimization
  enableImageOptimization: boolean;
  imageOptimizationQuality: "auto" | "auto:low" | "auto:eco" | "auto:good" | "auto:best";
  imageOptimizationFormat: "auto" | "webp" | "avif" | "jpg" | "png";
  maxImageWidth: number;
  maxImageHeight: number;
  // Video settings (Cloudinary only)
  enableVideoEncryption: boolean;
  videoEncryptionMethod: string;
  enableVideoWatermark: boolean;
  videoQualityPresets: string[];
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  uploadDir: path.join(process.cwd(), "public", "uploads"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
  generateThumbnail: true,
  thumbnailWidth: 300,
  thumbnailHeight: 300,
};

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  publicId?: string; // For Cloudinary
  storageProvider?: "local" | "cloudinary";
}

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Get media settings from database
 */
async function getMediaSettings(): Promise<MediaSettings> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        group: SettingGroup.MEDIA,
      },
    });

    const settingsMap: Record<string, string | null> = {};
    settings.forEach((s) => {
      const val = s.value;
      settingsMap[s.key] = typeof val === "string" ? val : val !== null ? String(val) : null;
    });

    // Parse JSON arrays safely
    const parseJsonArray = (value: string | null, defaultValue: string[]): string[] => {
      if (!value) return defaultValue;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    return {
      storageProvider: (settingsMap.storageProvider as "local" | "cloudinary") || "local",
      localUploadPath: settingsMap.localUploadPath || "uploads",
      cloudinaryCloudName: settingsMap.cloudinaryCloudName || undefined,
      cloudinaryApiKey: settingsMap.cloudinaryApiKey || undefined,
      cloudinaryApiSecret: settingsMap.cloudinaryApiSecret || undefined,
      cloudinaryUploadPreset: settingsMap.cloudinaryUploadPreset || undefined,
      maxFileSize: settingsMap.maxFileSize ? Number(settingsMap.maxFileSize) : 10,
      maxVideoSize: settingsMap.maxVideoSize ? Number(settingsMap.maxVideoSize) : 100,
      allowedImageTypes: parseJsonArray(
        settingsMap.allowedImageTypes,
        ["image/jpeg", "image/png", "image/gif", "image/webp"]
      ),
      allowedDocumentTypes: parseJsonArray(
        settingsMap.allowedDocumentTypes,
        ["application/pdf"]
      ),
      allowedVideoTypes: parseJsonArray(
        settingsMap.allowedVideoTypes,
        ["video/mp4", "video/webm"]
      ),
      // Cloudinary image optimization
      enableImageOptimization: settingsMap.enableImageOptimization !== "false", // Default true
      imageOptimizationQuality: (settingsMap.imageOptimizationQuality as MediaSettings["imageOptimizationQuality"]) || "auto",
      imageOptimizationFormat: (settingsMap.imageOptimizationFormat as MediaSettings["imageOptimizationFormat"]) || "auto",
      maxImageWidth: settingsMap.maxImageWidth ? Number(settingsMap.maxImageWidth) : 1920,
      maxImageHeight: settingsMap.maxImageHeight ? Number(settingsMap.maxImageHeight) : 1080,
      // Video settings
      enableVideoEncryption: settingsMap.enableVideoEncryption === "true",
      videoEncryptionMethod: settingsMap.videoEncryptionMethod || "none",
      enableVideoWatermark: settingsMap.enableVideoWatermark === "true",
      videoQualityPresets: parseJsonArray(
        settingsMap.videoQualityPresets,
        ["720p", "1080p"]
      ),
    };
  } catch (error) {
    console.error("Error fetching media settings:", error);
    // Return defaults if database error
    return {
      storageProvider: "local",
      localUploadPath: "uploads",
      maxFileSize: 10,
      maxVideoSize: 100,
      allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      allowedDocumentTypes: ["application/pdf"],
      allowedVideoTypes: ["video/mp4", "video/webm"],
      // Image optimization defaults
      enableImageOptimization: true,
      imageOptimizationQuality: "auto",
      imageOptimizationFormat: "auto",
      maxImageWidth: 1920,
      maxImageHeight: 1080,
      // Video defaults
      enableVideoEncryption: false,
      videoEncryptionMethod: "none",
      enableVideoWatermark: false,
      videoQualityPresets: ["720p", "1080p"],
    };
  }
}

// ============================================
// CLOUDINARY HELPERS
// ============================================

/**
 * Configure Cloudinary with settings
 */
function configureCloudinary(settings: MediaSettings): boolean {
  if (
    !settings.cloudinaryCloudName ||
    !settings.cloudinaryApiKey ||
    !settings.cloudinaryApiSecret
  ) {
    console.error("Cloudinary credentials not configured");
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
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  settings: MediaSettings
): Promise<UploadApiResponse> {
  const isVideo = mimeType.startsWith("video/");
  const isImage = mimeType.startsWith("image/");
  const resourceType = isVideo ? "video" : isImage ? "image" : "raw";

  // Build upload options
  const uploadOptions: Record<string, unknown> = {
    folder: "media",
    resource_type: resourceType,
    public_id: path.basename(filename, path.extname(filename)),
  };

  // Only add upload preset if it's configured AND not empty
  // Note: Upload preset is typically for unsigned uploads from client-side
  // For server-side uploads with API key/secret, it's usually not needed
  if (settings.cloudinaryUploadPreset && settings.cloudinaryUploadPreset.trim() !== "") {
    uploadOptions.upload_preset = settings.cloudinaryUploadPreset;
  }

  // Image optimization (Cloudinary-specific)
  if (isImage && settings.enableImageOptimization) {
    // Build transformation for optimization
    const transformation: Record<string, unknown> = {};

    // Quality optimization
    if (settings.imageOptimizationQuality) {
      transformation.quality = settings.imageOptimizationQuality;
    }

    // Format optimization
    if (settings.imageOptimizationFormat) {
      transformation.fetch_format = settings.imageOptimizationFormat;
    }

    // Resize if image exceeds max dimensions (will be applied during fetch, not upload)
    // We'll set flags to auto-crop/scale during delivery
    if (settings.maxImageWidth > 0 && settings.maxImageHeight > 0) {
      transformation.width = settings.maxImageWidth;
      transformation.height = settings.maxImageHeight;
      transformation.crop = "limit"; // Scale down only if larger, maintains aspect ratio
    }

    // Apply transformation
    if (Object.keys(transformation).length > 0) {
      uploadOptions.transformation = transformation;
      // Also apply eager transformation for generating optimized versions
      uploadOptions.eager = [
        {
          quality: settings.imageOptimizationQuality,
          fetch_format: settings.imageOptimizationFormat,
          width: settings.maxImageWidth,
          height: settings.maxImageHeight,
          crop: "limit",
        },
      ];
      uploadOptions.eager_async = true;
    }
  }

  // Video-specific options
  if (isVideo) {
    // Add transformation for multiple qualities
    if (settings.videoQualityPresets && settings.videoQualityPresets.length > 0) {
      uploadOptions.eager = settings.videoQualityPresets.map((preset) => {
        const height = parseInt(preset.replace("p", ""));
        return { height, crop: "scale", format: "mp4" };
      });
      uploadOptions.eager_async = true;
    }

    // HLS streaming for encryption
    if (settings.enableVideoEncryption && settings.videoEncryptionMethod === "hls-aes") {
      uploadOptions.eager = [
        {
          streaming_profile: "hd",
          format: "m3u8",
        },
      ];
      uploadOptions.eager_async = true;
    }
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(uploadDir: string): Promise<void> {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

/**
 * Generate unique filename
 */
export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * Convert Cloudinary format to MIME type
 */
function getMimeTypeFromFormat(format: string, fallback: string): string {
  const formatToMime: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tiff: "image/tiff",
    // Videos
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    // Documents
    pdf: "application/pdf",
  };

  return formatToMime[format.toLowerCase()] || fallback;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate thumbnail for image
 */
export async function generateThumbnail(
  buffer: Buffer,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  await sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .toFile(outputPath);
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate file against settings
 */
function validateFile(file: File, settings: MediaSettings): void {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isDocument = file.type.startsWith("application/") || file.type.startsWith("text/");

  // Get all allowed types
  const allAllowedTypes = [
    ...settings.allowedImageTypes,
    ...settings.allowedVideoTypes,
    ...settings.allowedDocumentTypes,
  ];

  // Check mime type
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Check file size based on type
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (isVideo) {
    if (fileSizeMB > settings.maxVideoSize) {
      throw new Error(`Video size exceeds maximum allowed size of ${settings.maxVideoSize}MB`);
    }
  } else if (isImage || isDocument) {
    if (fileSizeMB > settings.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${settings.maxFileSize}MB`);
    }
  }
}

// ============================================
// MAIN UPLOAD FUNCTION
// ============================================

/**
 * Upload file - automatically uses Local or Cloudinary based on settings
 */
export async function uploadFile(
  file: File,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<UploadResult> {
  // Get settings from database
  const settings = await getMediaSettings();

  // Validate file against settings
  validateFile(file, settings);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate filename
  const filename = generateFilename(file.name);

  // Upload based on storage provider
  if (settings.storageProvider === "cloudinary") {
    // Configure Cloudinary
    const configured = configureCloudinary(settings);
    if (!configured) {
      console.warn("[UPLOAD] Cloudinary not configured, falling back to local storage");
      return uploadToLocal(buffer, filename, file, config, settings);
    }

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(buffer, filename, file.type, settings);

      // Use Cloudinary's returned values (after optimization) instead of original file values
      // This reflects the actual optimized file size and format
      const optimizedMimeType = cloudinaryResult.format 
        ? getMimeTypeFromFormat(cloudinaryResult.format, file.type)
        : file.type;

      const result: UploadResult = {
        filename: cloudinaryResult.public_id,
        originalName: file.name,
        mimeType: optimizedMimeType, // Use optimized format
        size: cloudinaryResult.bytes || file.size, // Use optimized size from Cloudinary
        path: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        storageProvider: "cloudinary",
      };

      // Add dimensions for images (Cloudinary returns optimized dimensions)
      if (cloudinaryResult.width && cloudinaryResult.height) {
        result.width = cloudinaryResult.width;
        result.height = cloudinaryResult.height;
      }

      // Add duration for videos
      if (cloudinaryResult.duration) {
        result.duration = cloudinaryResult.duration;
      }

      // Cloudinary auto-generates thumbnails
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
        result.thumbnailUrl = cloudinary.url(cloudinaryResult.public_id, {
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "auto" },
          ],
        });
      }

      return result;
    } catch (error) {
      console.error("[UPLOAD] Cloudinary upload failed:", error);
      throw error;
    }
  } else {
    // Upload to local storage
    return uploadToLocal(buffer, filename, file, config, settings);
  }
}

/**
 * Upload to local storage
 */
async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  file: File,
  config: UploadConfig,
  settings: MediaSettings
): Promise<UploadResult> {
  // Build upload directory from settings
  const uploadDir = path.join(process.cwd(), "public", settings.localUploadPath || "uploads");

  // Ensure upload directory exists
  await ensureUploadDir(uploadDir);

  // Write file
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  // Generate URL
  const url = `/${settings.localUploadPath || "uploads"}/${filename}`;

  // Prepare result
  const result: UploadResult = {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    path: filePath,
    url,
    storageProvider: "local",
  };

  // Handle image-specific processing
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    try {
      // Get dimensions
      const dimensions = await getImageDimensions(buffer);
      if (dimensions) {
        result.width = dimensions.width;
        result.height = dimensions.height;
      }

      // Generate thumbnail
      if (config.generateThumbnail) {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);
        await generateThumbnail(
          buffer,
          thumbnailPath,
          config.thumbnailWidth,
          config.thumbnailHeight
        );
        result.thumbnailUrl = `/${settings.localUploadPath || "uploads"}/${thumbnailFilename}`;
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Continue without image metadata
    }
  }

  return result;
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete file - automatically handles Local or Cloudinary
 */
export async function deleteFile(
  filePath: string,
  publicId?: string
): Promise<void> {
  const settings = await getMediaSettings();

  if (settings.storageProvider === "cloudinary" && publicId) {
    // Delete from Cloudinary
    const configured = configureCloudinary(settings);
    if (configured) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Cloudinary delete failed - file might already be deleted
      }
    }
  }

  // Always try to delete local file as fallback
  try {
    await fs.unlink(filePath);
  } catch {
    // File might not exist locally if stored in Cloudinary
  }
}

/**
 * Delete thumbnail
 */
export async function deleteThumbnail(
  originalFilename: string,
  uploadDir: string = DEFAULT_UPLOAD_CONFIG.uploadDir
): Promise<void> {
  const thumbnailFilename = `thumb_${originalFilename}`;
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);
  try {
    await fs.unlink(thumbnailPath);
  } catch {
    // Thumbnail might not exist
  }
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Get current storage provider
 */
export async function getStorageProvider(): Promise<"local" | "cloudinary"> {
  const settings = await getMediaSettings();
  return settings.storageProvider;
}

/**
 * Check if Cloudinary is configured
 */
export async function isCloudinaryConfigured(): Promise<boolean> {
  const settings = await getMediaSettings();
  return !!(
    settings.storageProvider === "cloudinary" &&
    settings.cloudinaryCloudName &&
    settings.cloudinaryApiKey &&
    settings.cloudinaryApiSecret
  );
}
