import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { z } from "zod";

const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(255),
});

// GET /api/media/folders/:id - Get folder details
export const GET = withPermission(
  "media.view",
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;

      const folder = await prisma.mediaFolder.findFirst({
        where: { id, deletedAt: null },
        include: {
          _count: {
            select: {
              media: true,
              children: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!folder) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Folder not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: folder });
    } catch (error: any) {
      console.error("Get folder detail error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/media/folders/:id - Rename folder
export const PATCH = withPermission(
  "media.manage",
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;

      const existingFolder = await prisma.mediaFolder.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingFolder) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Folder not found" },
          { status: 404 }
        );
      }

      const body = await request.json();
      const validatedData = UpdateFolderSchema.parse(body);

      // Check for duplicate name in same parent
      const duplicateFolder = await prisma.mediaFolder.findFirst({
        where: {
          name: validatedData.name,
          parentId: existingFolder.parentId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicateFolder) {
        return NextResponse.json(
          {
            code: "DUPLICATE",
            message: "Folder with this name already exists",
          },
          { status: 400 }
        );
      }

      const folder = await prisma.mediaFolder.update({
        where: { id },
        data: { name: validatedData.name },
        include: {
          _count: {
            select: {
              media: true,
              children: true,
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

      return NextResponse.json({ data: folder });
    } catch (error: any) {
      console.error("Update folder error:", error);

      if (error.name === "ZodError") {
        return NextResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            errors: error.errors,
          },
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

// Helper function to recursively get all subfolder IDs
async function getAllSubfolderIds(folderId: string): Promise<string[]> {
  const subfolders = await prisma.mediaFolder.findMany({
    where: { parentId: folderId, deletedAt: null },
    select: { id: true },
  });

  const subfolderIds = subfolders.map((f) => f.id);
  
  // Recursively get subfolders of subfolders
  for (const subfolder of subfolders) {
    const nestedIds = await getAllSubfolderIds(subfolder.id);
    subfolderIds.push(...nestedIds);
  }

  return subfolderIds;
}

// DELETE /api/media/folders/:id - Delete folder and all contents
export const DELETE = withPermission(
  "media.manage",
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;

      const existingFolder = await prisma.mediaFolder.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingFolder) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: "Folder not found" },
          { status: 404 }
        );
      }

      // Get all subfolder IDs recursively
      const allSubfolderIds = await getAllSubfolderIds(id);
      const allFolderIds = [id, ...allSubfolderIds];

      // Soft delete all media in this folder and all subfolders
      await prisma.media.updateMany({
        where: { 
          folderId: { in: allFolderIds },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // Soft delete all subfolders
      if (allSubfolderIds.length > 0) {
        await prisma.mediaFolder.updateMany({
          where: { 
            id: { in: allSubfolderIds },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
      }

      // Soft delete the main folder
      await prisma.mediaFolder.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ 
        success: true,
        deletedFolders: allFolderIds.length,
      });
    } catch (error: any) {
      console.error("Delete folder error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
