import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { z } from "zod";

const MoveMediaSchema = z.object({
  folderId: z.string().nullable(),
});

export const PATCH = withPermission(
  "media.edit",
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = MoveMediaSchema.parse(body);

      // Check if media exists
      const media = await prisma.media.findFirst({
        where: { id, deletedAt: null },
      });

      if (!media) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Media not found" },
          { status: 404 }
        );
      }

      // If moving to a folder, check if folder exists
      if (validatedData.folderId) {
        const folder = await prisma.mediaFolder.findFirst({
          where: { id: validatedData.folderId, deletedAt: null },
        });

        if (!folder) {
          return NextResponse.json(
            { code: "NOT_FOUND", message: "Folder not found" },
            { status: 404 }
          );
        }
      }

      // Move media
      const updatedMedia = await prisma.media.update({
        where: { id },
        data: {
          folderId: validatedData.folderId,
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

      return NextResponse.json({ data: updatedMedia });
    } catch (error: any) {
      console.error("Move media error:", error);

      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid input data" },
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

