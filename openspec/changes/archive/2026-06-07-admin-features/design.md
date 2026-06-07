## Context

Hệ thống Sapphire Stay hiện tại đã có:
- Backend NestJS với các module: auth, users, rooms (types + rooms + pricing), bookings, payments, reports, coupons, chat, staff.
- Frontend Next.js với layout admin chung (sidebar) và một số trang đã có sườn (dashboard, room-types, rooms, staff, conversations).
- Prisma schema với đầy đủ các bảng liên quan: users, room_types, rooms, hotel_branches, pricing_rules, bookings, payments, booking_addons, coupons, user_coupons, conversations, messages, reviews, notification_templates, notification_logs.

Mục tiêu là hoàn thiện tất cả chức năng Admin dựa trên tài liệu phân tích (UC11-UC14 và các use case staff/chat/coupon) và các API backend đã có.

## Goals / Non-Goals

**Goals:**
- Hoàn thiện tất cả API backend cho admin (rooms, users, bookings, reports, coupons, chat, staff)
- Xây dựng đầy đủ các trang admin frontend (dashboard, room-types, rooms, staff, conversations, bookings, pricing, coupons)
- Tích hợp cron job tự động hết hạn booking quá hạn thanh toán
- Đảm bảo phân quyền chính xác (ADMIN có toàn quyền, RECEPTIONIST/HOUSEKEEPING có quyền giới hạn)

**Non-Goals:**
- Chức năng dành riêng cho Customer (đặt phòng, thanh toán, lịch sử) — đã có ở change khác
- Tích hợp ElasticSearch — chưa nằm trong phạm vi change này
- Module vận chuyển GHTK — là tùy chọn mở rộng
- Tối ưu hiệu năng cho báo cáo với dữ liệu lớn (triệu bản ghi)

## Decisions

### 1. Kiến trúc Module Backend
- **Quyết định:** Mỗi nhóm chức năng là một NestJS module riêng, controller xử lý HTTP, service xử lý business logic, Prisma repository xử lý database.
- **Lý do:** NestJS hỗ trợ modular architecture tự nhiên; việc tách riêng controller/service/repository giúp dễ bảo trì và test.
- **Phân bổ:** rooms (types + rooms + pricing), users (staff management), bookings (admin booking operations), reports, coupons, chat, staff (staff operations).
- **Monolithic hay Microservices:** Monolithic với modular structure. Phù hợp quy mô nhóm 4 người, dễ deploy, một server.

### 2. Phân quyền (Authorization)
- **Quyết định:** Sử dụng JwtAuthGuard + RolesGuard global. Endpoint admin yêu cầu `@Roles(Role.ADMIN)`. Staff operation endpoint yêu cầu `@Roles(Role.ADMIN, Role.RECEPTIONIST)` hoặc `@Roles(Role.ADMIN, Role.HOUSEKEEPING)`.
- **Lý do:** Tận dụng guard hiện có; rõ ràng, dễ maintain. Không cần thêm thư viện phân quyền mới (CASL, NestJS CASL).
- **Alternatives:** Dùng CASL cho phân quyền chi tiết (ability-based). Không cần thiết vì role-based đã đủ cho phạm vi hiện tại.

### 3. Frontend Component Architecture
- **Quyết định:** Mỗi trang admin là một page trong `apps/web/src/app/admin/<page>/page.tsx`. Dùng Layout chung (`admin/layout.tsx`) với Sidebar component. Mỗi page gọi API thông qua React Query hooks.
- **Lý do:** App Router của Next.js hỗ trợ nested layout tự nhiên. React Query cho caching, loading state, error handling.
- **Component Tree mỗi trang:**
  - Layout (sidebar + main content)
  - Page → Data Table / Card Grid / Form
  - Modals cho create/edit
  - KPI Cards cho dashboard

### 4. Xóa mềm (Soft Delete)
- **Quyết định:** Khi xóa loại phòng, set `isActive = false` thay vì xóa khỏi database (nếu có booking active liên quan). Tương tự cho pricing rules.
- **Lý do:** Tránh mất dữ liệu lịch sử; booking cũ vẫn tham chiếu được đến loại phòng/pricing rule.

### 5. Pricing Priority
- **Quyết định:** Khi tính giá, ưu tiên: HOLIDAY > SEASONAL > DEFAULT. Nếu có nhiều rule cùng loại và trùng ngày, lấy rule có `priority` cao hơn hoặc được tạo sau (updatedAt mới hơn).
- **Lý do:** Đơn giản, dễ hiểu, đáp ứng đúng yêu cầu nghiệp vụ.

### 6. Báo cáo (Reports)
- **Quyết định:** Báo cáo được tính real-time từ database (không cache). Có groupBy: day/week/month. Hỗ trợ xuất CSV (đơn giản) trước, Excel/PDF sau.
- **Lý do:** Dữ liệu khách sạn chưa lớn; real-time đảm bảo chính xác. CSV dễ implement.

### 7. Chat Support
- **Quyết định:** Dùng REST API poll-based (không WebSocket) cho chat. Mỗi conversation có status: active/resolved. Staff có thể nhận phụ trách.
- **Lý do:** Đơn giản hóa implementation, không cần thêm infrastructure (Socket.io, Redis pub/sub). Với tần suất chat không cao, polling mỗi 5-10s là đủ.
- **Trade-off:** Real-time kém hơn WebSocket, nhưng đủ cho MVP.

### 8. Cron Job
- **Quyết định:** Endpoint internal `POST /api/v1/internal/cron/expire-bookings` được bảo vệ bằng CRON_SECRET. Gọi từ Vercel Cron (nếu deploy trên Vercel) hoặc cron-job.org. Sử dụng Redis lock để tránh race condition khi có nhiều instance.
- **Lý do:** Đơn giản, tận dụng infrastructure có sẵn, an toàn với distributed lock.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Xóa loại phòng nhưng đang có booking active → mất tham chiếu | Kiểm tra booking active trước khi xóa; chỉ set isActive = false |
| Check-in/Check-out race condition (cùng lúc 2 staff) | Dùng Prisma transaction + lock row; emit event để notify conflict |
| Cron job chạy 2 lần cùng lúc (nhiều instance) | Redis lock với TTL; lock key = "cron:booking:expire" |
| Dữ liệu báo cáo lớn → query chậm | Thêm index cho booking.created_at, payment.completed_at; giới hạn khoảng thời gian tối đa 1 năm |
| Upload ảnh loại phòng không có CDN | Upload lên local filesystem trước; có thể migrate lên S3/Cloudinary sau |
| Chat poll-based không real-time | Nếu cần real-time, upgrade lên Socket.io hoặc Server-Sent Events sau này |
