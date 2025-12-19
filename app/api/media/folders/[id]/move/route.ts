import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { z } from "zod";

const MoveFolderSchema = z.object({
  parentId: z.string().nullable(),
});

export const PATCH = withPermission(
  "media.manage",
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = MoveFolderSchema.parse(body);

      // Check if folder exists
      const folder = await prisma.mediaFolder.findFirst({
        where: { id, deletedAt: null },
      });

      if (!folder) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Folder not found" },
          { status: 404 }
        );
      }

      // If moving to a parent folder, check if parent exists
      if (validatedData.parentId) {
        const parentFolder = await prisma.mediaFolder.findFirst({
          where: { id: validatedData.parentId, deletedAt: null },
        });

        if (!parentFolder) {
          return NextResponse.json(
            { code: "NOT_FOUND", message: "Parent folder not found" },
            { status: 404 }
          );
        }

        // Prevent moving folder into itself or its descendants
        const isDescendant = await checkIsDescendant(id, validatedData.parentId);
        if (isDescendant || id === validatedData.parentId) {
          return NextResponse.json(
            { code: "VALIDATION_ERROR", message: "Cannot move folder into itself or its descendants" },
            { status: 400 }
          );
        }
      }

      // Move folder
      const updatedFolder = await prisma.mediaFolder.update({
        where: { id },
        data: {
          parentId: validatedData.parentId,
        },
        include: {
          _count: {
            select: {
              media: { where: { deletedAt: null } },
              children: { where: { deletedAt: null } },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ data: updatedFolder });
    } catch (error: any) {
      console.error("Move folder error:", error);

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

// Helper function to check if targetId is a descendant of folderId
async function checkIsDescendant(folderId: string, targetId: string): Promise<boolean> {
  let currentId: string | null = targetId;

  while (currentId) {
    if (currentId === folderId) {
      return true;
    }

    const folder: { parentId: string | null } | null = await prisma.mediaFolder.findFirst({
      where: { id: currentId, deletedAt: null },
      select: { parentId: true },
    });

    currentId = folder?.parentId || null;
  }

  return false;
}

