import "dotenv/config";
import prisma from "@/lib/prisma";

/**
 * Script để dọn dẹp permissions dư thừa
 * Xóa các permissions không có trong danh sách chính thức
 */

// Danh sách permissions chính thức (phải khớp với seed.ts)
const VALID_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.manage_roles",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "roles.manage_permissions",
  "permissions.view",
  "permissions.manage",
  "dashboard.view",
  "dashboard.analytics",
  "media.view",
  "media.upload",
  "media.edit",
  "media.delete",
  "media.manage",
];

async function main() {
  console.log("🧹 Cleaning up permissions...\n");

  // Lấy tất cả permissions hiện tại
  const allPermissions = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, description: true },
  });

  console.log(`📊 Total permissions in database: ${allPermissions.length}`);
  console.log(`📋 Valid permissions defined: ${VALID_PERMISSIONS.length}\n`);

  // Tìm permissions dư (không có trong danh sách hợp lệ)
  const invalidPermissions = allPermissions.filter(
    (p) => !VALID_PERMISSIONS.includes(p.code)
  );

  if (invalidPermissions.length === 0) {
    console.log("✅ No invalid permissions found. Database is clean!");
    return;
  }

  console.log(`⚠️  Found ${invalidPermissions.length} invalid permissions:\n`);
  invalidPermissions.forEach((p) => {
    console.log(`   - ${p.code} (${p.description || "no description"})`);
  });

  console.log("\n🗑️  Deleting invalid permissions...");

  // Xóa rolePermissions liên quan trước
  for (const perm of invalidPermissions) {
    const rolePermCount = await prisma.rolePermission.count({
      where: { permissionId: perm.id },
    });

    if (rolePermCount > 0) {
      console.log(
        `   Removing ${rolePermCount} role-permission links for: ${perm.code}`
      );
      await prisma.rolePermission.deleteMany({
        where: { permissionId: perm.id },
      });
    }
  }

  // Soft delete permissions
  const deleteResult = await prisma.permission.updateMany({
    where: {
      id: { in: invalidPermissions.map((p) => p.id) },
    },
    data: {
      deletedAt: new Date(),
    },
  });

  console.log(`\n✅ Deleted ${deleteResult.count} invalid permissions`);
  console.log("\n💡 Tip: Run 'npm run db:seed' to ensure all valid permissions exist");
}

main()
  .catch((e) => {
    console.error("❌ Clean failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

