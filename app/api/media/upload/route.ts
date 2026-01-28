import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { uploadFile } from "@/lib/upload";

export const POST = withPermission(
  "media.upload",
  async (request: NextRequest, _context, authContext) => {
    try {
      if (!authContext) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get form data
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const alt = formData.get("alt") as string | null;
      const title = formData.get("title") as string | null;
      const description = formData.get("description") as string | null;
      const folderId = formData.get("folderId") as string | null;

      if (!file) {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "File is required" },
          { status: 400 }
        );
      }

      // Upload file
      const uploadResult = await uploadFile(file);

      // Save to database
      const media = await prisma.media.create({
        data: {
          filename: uploadResult.filename,
          originalName: uploadResult.originalName,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          width: uploadResult.width || null,
          height: uploadResult.height || null,
          duration: uploadResult.duration || null,
          path: uploadResult.path,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl || null,
          publicId: uploadResult.publicId || null,
          storageProvider: uploadResult.storageProvider || "local",
          alt: alt || null,
          title: title || null,
          description: description || null,
          folderId: folderId || null,
          uploadedBy: authContext.user.id,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ data: media }, { status: 201 });
    } catch (error: any) {
      console.error("Upload media error:", error);

      if (error.message.includes("File size exceeds") || error.message.includes("not allowed")) {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.message },
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

