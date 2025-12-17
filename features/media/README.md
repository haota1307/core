# Media Management System

Hệ thống quản lý media độc lập, cho phép upload, quản lý và sử dụng lại các file media trong toàn bộ ứng dụng.

## 📋 Tính năng

### Core Features
- ✅ **Upload Media**: Upload hình ảnh, video, tài liệu
- ✅ **Media Library**: Xem và quản lý tất cả media
- ✅ **Media Picker**: Component để chọn media từ thư viện
- ✅ **Metadata Management**: Quản lý alt text, title, description
- ✅ **Usage Tracking**: Theo dõi media được sử dụng ở đâu
- ✅ **Permissions**: Phân quyền chi tiết (view, upload, edit, delete, manage)

### Advanced Features
- ✅ **Thumbnail Generation**: Tự động tạo thumbnail cho hình ảnh
- ✅ **Image Processing**: Xử lý và tối ưu hình ảnh với Sharp
- ✅ **Search & Filter**: Tìm kiếm và lọc theo loại file
- ✅ **Soft Delete**: Xóa mềm để tránh mất dữ liệu
- ✅ **Multi-language**: Hỗ trợ đa ngôn ngữ (EN/VI)

## 🗂️ Cấu trúc

```
features/media/
├── actions/           # Server actions
│   └── index.ts
├── components/        # React components
│   ├── media-card.tsx
│   ├── media-upload-dialog.tsx
│   ├── media-edit-dialog.tsx
│   ├── media-delete-dialog.tsx
│   └── media-picker.tsx
├── hooks/            # React Query hooks
│   └── use-media.ts
├── schemas/          # Zod schemas
│   └── index.ts
└── README.md

app/api/media/        # API routes
├── route.ts          # GET (list)
├── upload/
│   └── route.ts      # POST (upload)
└── [id]/
    └── route.ts      # GET, PATCH, DELETE

app/[locale]/dashboard/media/
└── page.tsx          # Media management page
```

## 🚀 Sử dụng

### 1. Upload Media

```typescript
import { useUploadMedia } from "@/features/media/hooks/use-media";

function MyComponent() {
  const uploadMedia = useUploadMedia();

  const handleUpload = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", "My image");
    formData.append("title", "Beautiful sunset");

    uploadMedia.mutate(formData);
  };

  return <button onClick={() => handleUpload(file)}>Upload</button>;
}
```

### 2. Media Picker

```typescript
import { MediaPicker } from "@/features/media/components/media-picker";

function MyComponent() {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (media: MediaResponse) => {
    console.log("Selected media:", media);
    // Use media.url, media.id, etc.
  };

  return (
    <>
      <button onClick={() => setPickerOpen(true)}>Select Media</button>
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        accept="image/*" // Optional: filter by type
      />
    </>
  );
}
```

### 3. Media Library

```typescript
import { useMedia } from "@/features/media/hooks/use-media";

function MyComponent() {
  const { data, isLoading } = useMedia({
    page: 1,
    limit: 20,
    search: "sunset",
    mimeType: "image/",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <div>
      {data?.data.map((media) => (
        <img key={media.id} src={media.url} alt={media.alt || ""} />
      ))}
    </div>
  );
}
```

### 4. Track Media Usage

Khi sử dụng media trong entity khác (User, Post, Product, etc.), tạo record trong `MediaUsage`:

```typescript
// Example: When user updates avatar
await prisma.mediaUsage.create({
  data: {
    mediaId: selectedMedia.id,
    entityType: "User",
    entityId: user.id,
    fieldName: "avatar",
  },
});

// Update usage count
await prisma.media.update({
  where: { id: selectedMedia.id },
  data: { usageCount: { increment: 1 } },
});
```

## 🔐 Permissions

| Permission | Description |
|------------|-------------|
| `media.view` | Xem thư viện media |
| `media.upload` | Upload media mới |
| `media.edit` | Chỉnh sửa metadata |
| `media.delete` | Xóa media |
| `media.manage` | Quản lý toàn bộ (admin) |

## 🗄️ Database Schema

### Media Table
```prisma
model Media {
  id           String       @id @default(cuid())
  filename     String       // Generated filename
  originalName String       // Original filename
  mimeType     String       // MIME type
  size         Int          // File size in bytes
  width        Int?         // Image width
  height       Int?         // Image height
  duration     Int?         // Video duration
  path         String       // File path
  url          String       // Public URL
  thumbnailUrl String?      // Thumbnail URL
  alt          String?      // Alt text
  title        String?      // Title
  description  String?      // Description
  uploadedBy   String       // User ID
  uploader     User         @relation(...)
  usageCount   Int          @default(0)
  mediaUsages  MediaUsage[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?
}
```

### MediaUsage Table
```prisma
model MediaUsage {
  id         String    @id @default(cuid())
  mediaId    String
  media      Media     @relation(...)
  entityType String    // "User", "Post", "Product", etc.
  entityId   String    // ID of the entity
  fieldName  String?   // "avatar", "cover", "gallery", etc.
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?

  @@unique([mediaId, entityType, entityId, fieldName])
}
```

## 📦 API Endpoints

### GET /api/media
Get media list with pagination and filters.

**Query params:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `mimeType`: Filter by MIME type
- `sortBy`: Sort field (createdAt, size, originalName)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### POST /api/media/upload
Upload new media file.

**Body:** FormData
- `file`: File to upload (required)
- `alt`: Alt text (optional)
- `title`: Title (optional)
- `description`: Description (optional)

**Response:**
```json
{
  "data": {
    "id": "...",
    "url": "/uploads/...",
    ...
  }
}
```

### GET /api/media/:id
Get media detail with usage information.

### PATCH /api/media/:id
Update media metadata.

**Body:**
```json
{
  "alt": "New alt text",
  "title": "New title",
  "description": "New description"
}
```

### DELETE /api/media/:id
Delete media (soft delete). Fails if media is in use.

## ⚙️ Configuration

### Upload Settings

Edit `lib/upload.ts` to customize:

```typescript
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  uploadDir: path.join(process.cwd(), "public", "uploads"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
  generateThumbnail: true,
  thumbnailWidth: 300,
  thumbnailHeight: 300,
};
```

## 🔄 Migration to CDN

Hiện tại media được lưu tại `/public/uploads`. Để migrate sang CDN (S3, Cloudinary, etc.):

1. Cập nhật `lib/upload.ts` để upload lên CDN
2. Update `url` và `thumbnailUrl` trong database
3. Giữ nguyên logic còn lại

## 📝 TODO / Future Enhancements

- [ ] Bulk upload
- [ ] Drag & drop reorder
- [ ] Image cropping/editing
- [ ] Video transcoding
- [ ] CDN integration (S3, Cloudinary)
- [ ] Advanced search (by date, uploader, tags)
- [ ] Media categories/folders
- [ ] Duplicate detection
- [ ] Storage analytics
- [ ] Automatic cleanup of unused media

## 🐛 Troubleshooting

### Upload fails with "File size exceeds"
Increase `maxFileSize` in `lib/upload.ts`

### Thumbnail not generated
Check Sharp installation: `npm install sharp`

### Permission denied
Ensure user has `media.upload` permission

### Cannot delete media
Media is in use. Check `mediaUsages` table.

## 📚 Related Documentation

- [Prisma Schema](../../prisma/schema.prisma)
- [Permissions System](../../prisma/README.md)
- [API Routes](../../app/api/media/)

