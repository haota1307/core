import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export interface UploadConfig {
  uploadDir: string;
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  generateThumbnail: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  uploadDir: path.join(process.cwd(), "public", "uploads"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
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
}

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
 * Validate file
 */
export function validateFile(
  file: File,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): void {
  // Check file size
  if (file.size > config.maxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
    );
  }

  // Check mime type
  if (!config.allowedMimeTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
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

/**
 * Upload file to local storage
 */
export async function uploadFile(
  file: File,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<UploadResult> {
  // Validate file
  validateFile(file, config);

  // Ensure upload directory exists
  await ensureUploadDir(config.uploadDir);

  // Generate filename
  const filename = generateFilename(file.name);
  const filePath = path.join(config.uploadDir, filename);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write file
  await fs.writeFile(filePath, buffer);

  // Generate URL (relative to public folder)
  const url = `/uploads/${filename}`;

  // Prepare result
  const result: UploadResult = {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    path: filePath,
    url,
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
        const thumbnailPath = path.join(config.uploadDir, thumbnailFilename);
        await generateThumbnail(
          buffer,
          thumbnailPath,
          config.thumbnailWidth,
          config.thumbnailHeight
        );
        result.thumbnailUrl = `/uploads/${thumbnailFilename}`;
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Continue without image metadata
    }
  }

  return result;
}

/**
 * Delete file from local storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
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
  await deleteFile(thumbnailPath);
}

