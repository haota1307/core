import "dotenv/config";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Permissions theo module
const PERMISSIONS = [
  { code: "users.view", desc: "Xem danh sách người dùng" },
  { code: "users.create", desc: "Tạo người dùng" },
  { code: "users.edit", desc: "Chỉnh sửa người dùng" },
  { code: "users.delete", desc: "Xóa người dùng" },
  { code: "users.manage_roles", desc: "Quản lý vai trò" },
  { code: "roles.view", desc: "Xem vai trò" },
  { code: "roles.create", desc: "Tạo vai trò" },
  { code: "roles.edit", desc: "Chỉnh sửa vai trò" },
  { code: "roles.delete", desc: "Xóa vai trò" },
  { code: "roles.manage_permissions", desc: "Quản lý quyền" },
  { code: "permissions.view", desc: "Xem quyền" },
  { code: "permissions.manage", desc: "Quản lý quyền" },
  { code: "dashboard.view", desc: "Truy cập dashboard" },
  { code: "dashboard.analytics", desc: "Xem analytics" },
];

// Roles với permissions
const ROLES = [
  {
    name: "Super Admin",
    desc: "Toàn quyền hệ thống",
    isSystem: true,
    perms: PERMISSIONS.map((p) => p.code),
  },
  {
    name: "Admin",
    desc: "Quản trị viên",
    isSystem: true,
    perms: [
      "users.view",
      "users.create",
      "users.edit",
      "users.manage_roles",
      "roles.view",
      "dashboard.view",
      "dashboard.analytics",
    ],
  },
  {
    name: "User",
    desc: "Người dùng thông thường",
    isSystem: true,
    perms: ["dashboard.view"],
  },
];

// Seed chính
async function seedRolesAndPermissions() {
  console.log("📝 Syncing permissions...");
  const permMap = new Map<string, string>();

  for (const p of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.desc },
      create: { code: p.code, description: p.desc },
    });
    permMap.set(p.code, created.id);
  }
  console.log(`✅ ${PERMISSIONS.length} permissions synced`);

  console.log("👥 Syncing roles...");
  const roleMap = new Map<string, string>();

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.desc, isSystem: r.isSystem },
      create: { name: r.name, description: r.desc, isSystem: r.isSystem },
    });
    roleMap.set(r.name, role.id);

    // Đồng bộ permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const pCode of r.perms) {
      const pId = permMap.get(pCode);
      if (pId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: pId },
        });
      }
    }
  }
  console.log(`✅ ${ROLES.length} roles synced`);

  return roleMap;
}

// Tạo Super Admin
async function createSuperAdmin(roleMap: Map<string, string>) {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const roleId = roleMap.get("Super Admin");

  if (!roleId) throw new Error("Super Admin role not found");

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: await bcrypt.hash(password, 10),
      roleId,
      name: "Super Admin",
      emailVerified: new Date(),
    },
    create: {
      email,
      password: await bcrypt.hash(password, 10),
      roleId,
      name: "Super Admin",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Super Admin: ${email}`);
  return user;
}

// Update users không có role
async function updateUsersWithoutRole() {
  const userRole = await prisma.role.findUnique({ where: { name: "User" } });
  if (!userRole) throw new Error("User role not found! Run seed first.");

  const result = await prisma.user.updateMany({
    where: { roleId: null, deletedAt: null },
    data: { roleId: userRole.id },
  });

  if (result.count > 0) {
    console.log(`✅ Updated ${result.count} users with User role`);
  }
}

// Nâng cấp user lên Admin
async function upgradeToAdmin(email: string) {
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (!adminRole) throw new Error("Admin role not found! Run seed first.");

  const user = await prisma.user.update({
    where: { email },
    data: { roleId: adminRole.id },
  });

  console.log(`✅ ${email} → Admin role`);
  return user;
}

// Main
async function main() {
  const mode = process.argv[2]; // full | update | upgrade

  console.log("🌱 Database Seed\n");

  if (mode === "update") {
    // Chỉ update users không có role
    await updateUsersWithoutRole();
  } else if (mode === "upgrade") {
    // Nâng cấp user lên Admin
    const email = process.argv[3];
    if (!email) {
      console.error("❌ Usage: npm run db:seed upgrade <email>");
      process.exit(1);
    }
    await upgradeToAdmin(email);
  } else {
    // Full seed (default)
    const roleMap = await seedRolesAndPermissions();
    await createSuperAdmin(roleMap);
    await updateUsersWithoutRole();
    console.log("\n✨ Seed completed!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
