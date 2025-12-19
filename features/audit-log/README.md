# Audit Log Feature

Hệ thống audit log để theo dõi và ghi lại tất cả các hành động của người dùng trong hệ thống.

## Tính năng

- ✅ Tự động ghi log cho các actions quan trọng (login, CRUD operations)
- ✅ Lưu trữ thông tin chi tiết: user, action, entity, changes, IP, User Agent
- ✅ UI để xem và filter audit logs
- ✅ Hỗ trợ phân trang, search, và filter
- ✅ Xem chi tiết changes (before/after)
- ✅ API để cleanup logs cũ

## Cấu trúc

```
features/audit-log/
├── actions/
│   └── index.ts              # API actions
├── components/
│   ├── audit-log-table/
│   │   ├── columns.tsx
│   │   ├── audit-log-data-table.tsx
│   │   └── audit-log-table-toolbar.tsx
│   └── audit-log-detail-dialog.tsx
├── hooks/
│   └── use-audit-logs.ts
├── schemas/
│   └── index.ts
└── README.md
```

## Database Schema

```prisma
model AuditLog {
  id         String    @id @default(cuid())
  userId     String?
  user       User?     @relation(fields: [userId], references: [id])
  action     String    // VD: "user.create", "auth.login"
  entityType String    // VD: "user", "role", "auth"
  entityId   String?
  entityName String?
  changes    Json?     // Object chứa {field: {old, new}}
  metadata   Json?     // Additional data
  ipAddress  String?
  userAgent  String?
  status     String    @default("success") // "success" | "error"
  errorMsg   String?
  createdAt  DateTime  @default(now())
}
```

## Cách sử dụng

### 1. Tích hợp vào API Routes

```typescript
import { createAuditLog, AuditAction, getChanges, formatEntityName } from "@/lib/audit-log";

// Trong API handler
export const POST = withPermission(
  "users.create",
  async (request: NextRequest, context: any, authContext: any) => {
    // ... your logic ...
    
    const user = await prisma.user.create({ ... });
    
    // Ghi audit log
    await createAuditLog(
      {
        userId: authContext.user.id,
        action: AuditAction.USER_CREATE,
        entityType: "user",
        entityId: user.id,
        entityName: formatEntityName(user),
        metadata: {
          email: user.email,
          roleId: user.roleId,
        },
      },
      request
    );
    
    return NextResponse.json({ data: user });
  }
);
```

### 2. Ghi log cho Update với Changes

```typescript
// Trước khi update
const existingUser = await prisma.user.findFirst({ where: { id } });

// Update
const user = await prisma.user.update({ ... });

// Tính toán changes (tự động loại bỏ sensitive fields)
const changes = getChanges(existingUser, updateData);

// Ghi audit log
await createAuditLog(
  {
    userId: authContext.user.id,
    action: AuditAction.USER_UPDATE,
    entityType: "user",
    entityId: user.id,
    entityName: formatEntityName(user),
    changes, // Changes object
  },
  request
);
```

### 3. Ghi log cho Failed Actions

```typescript
await createAuditLog(
  {
    userId: user?.id || null,
    action: AuditAction.LOGIN,
    entityType: "auth",
    entityName: email,
    status: "error",
    errorMsg: "Invalid password",
  },
  request
);
```

## Actions được hỗ trợ

File `lib/audit-log.ts` định nghĩa các action types:

```typescript
export enum AuditAction {
  // Auth
  LOGIN = "auth.login",
  LOGOUT = "auth.logout",
  REGISTER = "auth.register",
  
  // User
  USER_CREATE = "user.create",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",
  USER_VIEW = "user.view",
  
  // Role
  ROLE_CREATE = "role.create",
  ROLE_UPDATE = "role.update",
  ROLE_DELETE = "role.delete",
  
  // Media
  MEDIA_UPLOAD = "media.upload",
  MEDIA_UPDATE = "media.update",
  MEDIA_DELETE = "media.delete",
  
  // ... more
}
```

## Helper Functions

### `createAuditLog(data, request?)`
Tạo audit log entry

### `logSuccess(data, request?)`
Shortcut để log success

### `logError(data, request?)`
Shortcut để log error

### `getChanges(oldData, newData, sensitiveFields?)`
So sánh và trả về changes object, tự động loại bỏ sensitive fields (password, token, ...)

### `formatEntityName(entity)`
Tự động format entity name từ object (name, email, title, filename, id)

## Permissions

- `audit_logs.view` - Xem audit logs
- `audit_logs.delete` - Xóa logs cũ (cleanup)

## API Endpoints

### GET `/api/audit-logs`
Lấy danh sách audit logs với filter

Query params:
- `page` - Số trang
- `limit` - Số records per page
- `search` - Tìm kiếm
- `userId` - Filter theo user
- `action` - Filter theo action
- `entityType` - Filter theo entity type
- `status` - Filter theo status (success/error)
- `startDate` - Từ ngày
- `endDate` - Đến ngày

### GET `/api/audit-logs/stats`
Lấy thống kê audit logs

### DELETE `/api/audit-logs/cleanup?olderThanDays=90`
Xóa logs cũ hơn X ngày

## UI

Page: `/dashboard/audit-logs`

Features:
- Table view với pagination
- Filter theo user, action, entity type, status
- Search
- View detail dialog với full information
- Changes comparison (before/after)

## Best Practices

1. **Luôn log các actions quan trọng**: Create, Update, Delete, Login, Logout
2. **Log failed actions**: Đặc biệt là authentication failures
3. **Không log sensitive data**: Password, tokens đã được auto-exclude
4. **Sử dụng meaningful entity names**: Giúp dễ tra cứu
5. **Include metadata**: Thông tin phụ giúp debug
6. **Cleanup định kỳ**: Setup cron job để xóa logs cũ

## Ví dụ Migration

Để tích hợp audit log vào một API route mới:

```typescript
// Before
export const POST = withPermission("something.create", async (request) => {
  const item = await prisma.item.create({ ... });
  return NextResponse.json({ data: item });
});

// After
import { createAuditLog, AuditAction } from "@/lib/audit-log";

export const POST = withPermission(
  "something.create", 
  async (request, context, authContext) => {
    const item = await prisma.item.create({ ... });
    
    await createAuditLog({
      userId: authContext.user.id,
      action: "item.create", // hoặc thêm vào AuditAction enum
      entityType: "item",
      entityId: item.id,
      entityName: item.name,
    }, request);
    
    return NextResponse.json({ data: item });
  }
);
```

## Performance Considerations

1. Audit log creation không throw error để tránh block main flow
2. Log được ghi async
3. Có indexes trên các trường thường query (userId, action, entityType, createdAt)
4. Recommend setup cleanup job để xóa logs cũ (>90 ngày)

## Roadmap

- [ ] Export audit logs (CSV, JSON)
- [ ] Advanced analytics dashboard
- [ ] Real-time audit log streaming
- [ ] Audit log retention policies
- [ ] Email notifications cho critical actions

