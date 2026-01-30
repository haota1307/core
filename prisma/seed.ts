import "dotenv/config";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Permissions theo module
const PERMISSIONS = [
  // Dashboard
  { code: "dashboard.view", desc: "Truy cập dashboard" },
  { code: "dashboard.analytics", desc: "Xem analytics tổng quan" },

  // Users Management
  { code: "users.view", desc: "Xem danh sách người dùng" },
  { code: "users.create", desc: "Tạo người dùng" },
  { code: "users.edit", desc: "Chỉnh sửa người dùng" },
  { code: "users.delete", desc: "Xóa người dùng" },
  { code: "users.manage_roles", desc: "Quản lý vai trò người dùng" },

  // Roles & Permissions
  { code: "roles.view", desc: "Xem vai trò" },
  { code: "roles.create", desc: "Tạo vai trò" },
  { code: "roles.edit", desc: "Chỉnh sửa vai trò" },
  { code: "roles.delete", desc: "Xóa vai trò" },
  { code: "roles.manage_permissions", desc: "Quản lý quyền của vai trò" },
  { code: "permissions.view", desc: "Xem quyền" },
  { code: "permissions.manage", desc: "Quản lý quyền" },

  // Courses - Student
  { code: "courses.browse", desc: "Duyệt khóa học" },
  { code: "courses.enroll", desc: "Đăng ký khóa học" },
  { code: "courses.enrolled", desc: "Xem khóa học đã đăng ký" },
  { code: "certificates.view", desc: "Xem chứng chỉ" },

  // Courses - Instructor
  { code: "courses.create", desc: "Tạo khóa học mới" },
  { code: "courses.manage_own", desc: "Quản lý khóa học của mình" },
  { code: "courses.analytics", desc: "Xem thống kê khóa học" },
  { code: "students.view_own", desc: "Xem học viên của mình" },
  { code: "earnings.view", desc: "Xem thu nhập" },

  // Courses - Admin
  { code: "courses.manage_all", desc: "Quản lý tất cả khóa học" },
  { code: "courses.approve", desc: "Duyệt khóa học" },
  { code: "categories.manage", desc: "Quản lý danh mục" },
  { code: "instructors.manage", desc: "Quản lý giảng viên" },

  // Content
  { code: "content.view", desc: "Xem nội dung" },
  { code: "content.create", desc: "Tạo nội dung" },
  { code: "content.edit", desc: "Chỉnh sửa nội dung" },
  { code: "content.delete", desc: "Xóa nội dung" },
  { code: "content.manage", desc: "Quản lý toàn bộ nội dung" },

  // Media
  { code: "media.view", desc: "Xem thư viện media" },
  { code: "media.upload", desc: "Upload media" },
  { code: "media.edit", desc: "Chỉnh sửa media" },
  { code: "media.delete", desc: "Xóa media" },
  { code: "media.manage", desc: "Quản lý toàn bộ media" },

  // Reviews
  { code: "reviews.create", desc: "Tạo đánh giá" },
  { code: "reviews.manage", desc: "Quản lý đánh giá" },

  // Payments
  { code: "payments.view", desc: "Xem giao dịch" },
  { code: "payments.manage", desc: "Quản lý thanh toán" },
  { code: "payouts.manage", desc: "Quản lý chi trả" },
  { code: "refunds.manage", desc: "Quản lý hoàn tiền" },

  // Messages
  { code: "messages.view", desc: "Xem tin nhắn" },
  { code: "messages.send", desc: "Gửi tin nhắn" },

  // Audit Logs
  { code: "audit_logs.view", desc: "Xem nhật ký hệ thống" },
  { code: "audit_logs.delete", desc: "Xóa nhật ký cũ" },

  // Settings
  { code: "settings.view", desc: "Xem cài đặt hệ thống" },
  { code: "settings.edit", desc: "Chỉnh sửa cài đặt hệ thống" },
  { code: "settings.backup", desc: "Sao lưu & khôi phục dữ liệu" },
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
      // Dashboard
      "dashboard.view",
      "dashboard.analytics",
      // Users
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "users.manage_roles",
      // Roles & Permissions
      "roles.view",
      "roles.create",
      "roles.edit",
      "roles.delete",
      "roles.manage_permissions",
      "permissions.view",
      "permissions.manage",
      // Courses Admin
      "courses.browse",
      "courses.manage_all",
      "courses.approve",
      "categories.manage",
      "instructors.manage",
      // Content
      "content.view",
      "content.create",
      "content.edit",
      "content.delete",
      "content.manage",
      // Media
      "media.view",
      "media.upload",
      "media.edit",
      "media.delete",
      "media.manage",
      // Reviews
      "reviews.manage",
      // Payments
      "payments.view",
      "payments.manage",
      "payouts.manage",
      "refunds.manage",
      // Messages
      "messages.view",
      "messages.send",
      // Audit Logs
      "audit_logs.view",
      "audit_logs.delete",
      // Settings
      "settings.view",
      "settings.edit",
      "settings.backup",
    ],
  },
  {
    name: "Instructor",
    desc: "Giảng viên",
    isSystem: true,
    perms: [
      // Dashboard
      "dashboard.view",
      "dashboard.analytics",
      // Courses - Instructor
      "courses.browse",
      "courses.create",
      "courses.manage_own",
      "courses.analytics",
      "students.view_own",
      "earnings.view",
      // Messages
      "messages.view",
      "messages.send",
      // Reviews (read own)
      "reviews.create",
    ],
  },
  {
    name: "User",
    desc: "Học viên",
    isSystem: true,
    perms: [
      // Dashboard
      "dashboard.view",
      // Courses - Student
      "courses.browse",
      "courses.enroll",
      "courses.enrolled",
      "certificates.view",
      // Reviews
      "reviews.create",
      // Messages
      "messages.view",
      "messages.send",
    ],
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
