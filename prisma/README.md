# Database Scripts

## 📋 Permissions & Roles System

### Danh Sách Permissions Chính Thức

Hệ thống sử dụng **14 permissions** được chia thành 4 modules:

#### 👥 USERS Module
- `users.view` - Xem danh sách người dùng
- `users.create` - Tạo người dùng
- `users.edit` - Chỉnh sửa người dùng
- `users.delete` - Xóa người dùng
- `users.manage_roles` - Quản lý vai trò của người dùng

#### 🎭 ROLES Module
- `roles.view` - Xem danh sách vai trò
- `roles.create` - Tạo vai trò mới
- `roles.edit` - Chỉnh sửa vai trò
- `roles.delete` - Xóa vai trò
- `roles.manage_permissions` - Quản lý quyền của vai trò

#### 🔐 PERMISSIONS Module
- `permissions.view` - Xem danh sách quyền
- `permissions.manage` - Quản lý quyền (tạo, sửa, xóa)

#### 📊 DASHBOARD Module
- `dashboard.view` - Truy cập dashboard
- `dashboard.analytics` - Xem analytics

### Vai Trò Mặc Định

#### Super Admin
- Có **tất cả** permissions
- Không thể xóa (isSystem: true)
- Email mặc định: từ `ADMIN_EMAIL` env

#### Admin
- Có hầu hết permissions (trừ `users.delete`)
- Không thể xóa (isSystem: true)
- Dùng cho quản trị viên cấp cao

#### User
- Chỉ có `dashboard.view`
- Không thể xóa (isSystem: true)
- Vai trò mặc định cho người dùng mới

---

## 🛠️ Scripts

### 1. Seed Database
```bash
npm run db:seed
```
**Chức năng:**
- Đồng bộ tất cả permissions
- Tạo/cập nhật 3 roles mặc định
- Tạo Super Admin account
- Gán role "User" cho users chưa có role

**Khi nào dùng:**
- Lần đầu setup database
- Sau khi thêm permissions mới vào `seed.ts`
- Khi cần reset permissions/roles về mặc định

### 2. Update Users Without Role
```bash
npm run db:seed:update
```
**Chức năng:**
- Chỉ gán role "User" cho users chưa có role
- Không thay đổi permissions/roles

**Khi nào dùng:**
- Sau khi import users từ hệ thống cũ
- Khi phát hiện users không có role

### 3. Clean Invalid Permissions
```bash
npm run db:clean
```
**Chức năng:**
- Tìm và xóa permissions không có trong danh sách chính thức
- Xóa các liên kết role-permission liên quan
- Soft delete (set deletedAt)

**Khi nào dùng:**
- Sau khi phát hiện permissions dư thừa
- Trước khi chạy seed để đảm bảo database sạch
- Khi cần audit permissions

### 4. Upgrade User to Admin
```bash
npm run db:seed upgrade <email>
```
**Ví dụ:**
```bash
npm run db:seed upgrade user@example.com
```
**Chức năng:**
- Nâng cấp user lên role "Admin"

---

## 📝 Quy Trình Thêm Permission Mới

### Bước 1: Cập nhật `seed.ts`
Thêm permission vào mảng `PERMISSIONS`:
```typescript
const PERMISSIONS = [
  // ... existing permissions
  { code: "posts.view", desc: "Xem bài viết" },
  { code: "posts.create", desc: "Tạo bài viết" },
];
```

### Bước 2: Cập nhật roles (nếu cần)
Thêm permission vào các roles phù hợp:
```typescript
const ROLES = [
  {
    name: "Super Admin",
    perms: PERMISSIONS.map((p) => p.code), // Tự động có tất cả
  },
  {
    name: "Admin",
    perms: [
      // ... existing permissions
      "posts.view",
      "posts.create",
    ],
  },
];
```

### Bước 3: Chạy seed
```bash
npm run db:seed
```

### Bước 4: Sử dụng trong code
```typescript
// API Route
export const GET = withPermission("posts.view", async (req) => {
  // ...
});

// Component
const canCreatePost = hasPermission(user, "posts.create");
```

---

## 🚨 Lưu Ý Quan Trọng

### ⚠️ Không Tự Ý Tạo Permissions Qua UI
- Permissions phải được định nghĩa trong `seed.ts` trước
- Không tạo permissions trực tiếp qua API/UI
- Luôn chạy `npm run db:clean` để phát hiện permissions dư

### ⚠️ Naming Convention
- Format: `<module>.<action>`
- Module: số nhiều (users, roles, permissions, posts)
- Action: động từ (view, create, edit, delete, manage)
- Ví dụ: `users.view`, `posts.create`, `comments.delete`

### ⚠️ System Roles
- Roles có `isSystem: true` không thể xóa
- Không đổi tên system roles
- Có thể thay đổi permissions của system roles

### ⚠️ Soft Delete
- Permissions và roles dùng soft delete (`deletedAt`)
- Script clean dùng soft delete, không xóa vĩnh viễn
- Có thể restore bằng cách set `deletedAt = null`

---

## 🔍 Troubleshooting

### Vấn đề: Permissions dư thừa trong database
**Giải pháp:**
```bash
npm run db:clean
npm run db:seed
```

### Vấn đề: User không có role
**Giải pháp:**
```bash
npm run db:seed:update
```

### Vấn đề: Role thiếu permissions
**Giải pháp:**
```bash
npm run db:seed  # Seed sẽ đồng bộ lại permissions của roles
```

### Vấn đề: Super Admin không login được
**Kiểm tra:**
1. Check email trong `.env`: `ADMIN_EMAIL`
2. Check password trong `.env`: `ADMIN_PASSWORD`
3. Chạy lại seed: `npm run db:seed`

---

## 📊 Database Schema

```prisma
model Permission {
  id          String   @id @default(cuid())
  code        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}

model RolePermission {
  roleId       String
  permissionId String
  @@id([roleId, permissionId])
}
```

