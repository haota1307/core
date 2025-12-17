import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { z } from "zod";

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
});

// GET /api/media/folders - List all folders
export const GET = withPermission(
  "media.view",
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const parentId = searchParams.get("parentId");

      // Build where clause dynamically
      const where: any = {
        deletedAt: null,
      };

      // Only filter by parentId if explicitly provided
      if (parentId !== null) {
        where.parentId = parentId === "" ? null : parentId;
      }
      // If parentId is null (not provided), fetch ALL folders

      const folders = await prisma.mediaFolder.findMany({
        where,
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
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({ data: folders });
    } catch (error: any) {
      console.error("Get folders error:", error);
      return NextResponse.json(
        { code: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// POST /api/media/folders - Create new folder
export const POST = withPermission(
  "media.manage",
  async (request: NextRequest, _context, authContext) => {
    try {
      if (!authContext) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized" },
          { status: 401 }
        );
      }

      const body = await request.json();
      const validatedData = CreateFolderSchema.parse(body);

      // Check if parent folder exists
      if (validatedData.parentId) {
        const parentFolder = await prisma.mediaFolder.findFirst({
          where: {
            id: validatedData.parentId,
            deletedAt: null,
          },
        });

        if (!parentFolder) {
          return NextResponse.json(
            { code: "NOT_FOUND", message: "Parent folder not found" },
            { status: 404 }
          );
        }
      }

      // Check for duplicate name in same parent
      const existingFolder = await prisma.mediaFolder.findFirst({
        where: {
          name: validatedData.name,
          parentId: validatedData.parentId || null,
          deletedAt: null,
        },
      });

      if (existingFolder) {
        return NextResponse.json(
          { code: "DUPLICATE", message: "Folder with this name already exists" },
          { status: 400 }
        );
      }

      const folder = await prisma.mediaFolder.create({
        data: {
          name: validatedData.name,
          parentId: validatedData.parentId || null,
          createdBy: authContext.user.id,
        },
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

      return NextResponse.json({ data: folder }, { status: 201 });
    } catch (error: any) {
      console.error("Create folder error:", error);

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

