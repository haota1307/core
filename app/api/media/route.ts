import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/rbac";
import { GetMediaQuerySchema } from "@/features/media/schemas";

export const GET = withPermission(
  "media.view",
  async (request: NextRequest) => {
    try {

      // Parse query params
      const { searchParams } = new URL(request.url);
      const folderId = searchParams.get("folderId");
      
      const queryParams = {
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "20"),
        search: searchParams.get("search") || undefined,
        mimeType: searchParams.get("mimeType") || undefined,
        folderId: folderId !== null ? (folderId === "" ? null : folderId) : undefined,
        sortBy: (searchParams.get("sortBy") || "createdAt") as "createdAt" | "size" | "originalName",
        sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
      };

      // Validate query
      const validatedQuery = GetMediaQuerySchema.parse(queryParams);

      // Build where clause
      const where: any = {
        deletedAt: null,
      };

      // Folder filter
      if (validatedQuery.folderId !== undefined) {
        where.folderId = validatedQuery.folderId;
      }

      // Search filter
      if (validatedQuery.search) {
        where.OR = [
          { originalName: { contains: validatedQuery.search, mode: "insensitive" } },
          { title: { contains: validatedQuery.search, mode: "insensitive" } },
          { description: { contains: validatedQuery.search, mode: "insensitive" } },
        ];
      }

      // MimeType filter
      if (validatedQuery.mimeType) {
        if (Array.isArray(validatedQuery.mimeType)) {
          where.mimeType = { in: validatedQuery.mimeType };
        } else {
          where.mimeType = { startsWith: validatedQuery.mimeType };
        }
      }

      // Get total count
      const total = await prisma.media.count({ where });

      // Get media list
      const media = await prisma.media.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit,
      });

      return NextResponse.json({
        data: media,
        meta: {
          total,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      });
    } catch (error: any) {
      console.error("Get media error:", error);

      if (error.name === "ZodError") {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: "Invalid query parameters", errors: error.errors },
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

