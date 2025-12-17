import prisma from "@/lib/prisma";

/**
 * Invalidate tất cả refresh tokens của users có role cụ thể
 * Được gọi khi role permissions thay đổi để force users phải refresh token và nhận permissions mới
 */
export async function invalidateRefreshTokensByRoleId(roleId: string) {
  try {
    // Tìm tất cả users có role này
    const users = await prisma.user.findMany({
      where: {
        roleId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const userIds = users.map((user) => user.id);

    if (userIds.length === 0) {
      return { count: 0 };
    }

    // Soft delete tất cả refresh tokens của các users này
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId: { in: userIds },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { count: result.count };
  } catch (error) {
    console.error("Failed to invalidate refresh tokens:", error);
    throw error;
  }
}

/**
 * Invalidate refresh tokens của một user cụ thể
 */
export async function invalidateRefreshTokensByUserId(userId: string) {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { count: result.count };
  } catch (error) {
    console.error("Failed to invalidate refresh tokens:", error);
    throw error;
  }
}
