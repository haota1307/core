import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { UpdateMediaSchema } from "@/features/media/schemas";
import { deleteFile, deleteThumbnail } from "@/lib/upload";

export const GET = withPermission(
  "media.view",
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      // Get media with usage information
      const media = await prisma.media.findFirst({
        where: { id, deletedAt: null },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mediaUsages: {
            where: { deletedAt: null },
            select: {
              entityType: true,
              entityId: true,
              fieldName: true,
              createdAt: true,
            },
          },
        },
      });

      if (!media) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Media not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: media });
    } catch (error: any) {
      console.error("Get media detail error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

export const PATCH = withPermission(
  "media.edit",
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      // Check if media exists
      const existingMedia = await prisma.media.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingMedia) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Media not found" },
          { status: 404 }
        );
      }

      // Parse and validate body
      const body = await request.json();
      const validatedData = UpdateMediaSchema.parse(body);

      // Update media
      const media = await prisma.media.update({
        where: { id },
        data: {
          alt: validatedData.alt,
          title: validatedData.title,
          description: validatedData.description,
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

      return NextResponse.json({ data: media });
    } catch (error: any) {
      console.error("Update media error:", error);

      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid input", errors: error.errors },
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

export const DELETE = withPermission(
  "media.delete",
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      // Check if media exists
      const existingMedia = await prisma.media.findFirst({
        where: { id, deletedAt: null },
        include: {
          mediaUsages: {
            where: { deletedAt: null },
          },
        },
      });

      if (!existingMedia) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Media not found" },
          { status: 404 }
        );
      }

      // Check if media is in use
      if (existingMedia.mediaUsages.length > 0) {
        return NextResponse.json(
          {
            code: "MEDIA_IN_USE",
            message: "Cannot delete media that is currently in use",
            usageCount: existingMedia.mediaUsages.length,
          },
          { status: 400 }
        );
      }

      // Soft delete media
      await prisma.media.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Delete physical files (optional - can be done by background job)
      try {
        await deleteFile(existingMedia.path);
        if (existingMedia.thumbnailUrl) {
          await deleteThumbnail(existingMedia.filename);
        }
      } catch (error) {
        console.error("Error deleting physical files:", error);
        // Continue even if file deletion fails
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Delete media error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

