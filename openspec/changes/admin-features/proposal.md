## Why

Hệ thống Sapphire Stay cần một bộ chức năng quản trị (Admin) hoàn chỉnh để quản lý toàn bộ hoạt động của khách sạn. Dựa trên tài liệu phân tích hệ thống và mã nguồn backend hiện có, Admin cần được trang bị đầy đủ các công cụ để quản lý danh mục phòng, giá cả, nhân viên, đơn đặt phòng, báo cáo, khuyến mãi và hỗ trợ khách hàng. Các chức năng này đã được đặc tả chi tiết trong use case (UC11-UC14) và một số API backend đã được xây dựng. Mục tiêu của change này là hoàn thiện tất cả chức năng Admin để đưa hệ thống vào vận hành thực tế.

## What Changes

1. **Quản lý Loại phòng (Room Types)** — CRUD loại phòng với thông tin: tên, diện tích, tiện nghi, ảnh, số lượng phòng. Kiểm tra booking active trước khi xóa (set isActive = false thay vì xóa cứng).
2. **Quản lý Phòng (Rooms)** — CRUD phòng cụ thể (số phòng, tầng, loại phòng, trạng thái). Hỗ trợ filter theo loại phòng, tầng, chi nhánh.
3. **Cấu hình Giá phòng (Pricing Rules)** — Tạo quy tắc giá linh hoạt (mặc định, theo mùa, ngày lễ) với cơ chế ưu tiên HOLIDAY > SEASONAL > DEFAULT.
4. **Quản lý Nhân viên (Staff Management)** — CRUD tài khoản nhân viên (RECEPTIONIST, HOUSEKEEPING, ADMIN), khóa/mở khóa, phân quyền. Không cho phép tự khóa chính mình.
5. **Quản lý Đơn đặt phòng (Bookings)** — Xem tất cả đơn, duyệt/từ chối booking (PENDING_APPROVAL), check-in/check-out, xem dịch vụ phát sinh.
6. **Báo cáo & Thống kê (Reports)** — Báo cáo doanh thu (theo ngày/tuần/tháng), tỷ lệ lấp phòng (occupancy rate), tổng hợp trạng thái đơn. Hỗ trợ xuất file.
7. **Quản lý Coupon & Khuyến mãi** — CRUD coupon, áp dụng/gỡ coupon cho booking, công khai coupon cho khách hàng.
8. **Hỗ trợ trò chuyện (Chat/Conversations)** — Danh sách conversation, nhận phụ trách, gửi tin nhắn, đánh dấu đã giải quyết.
9. **Staff Operations (Admin cũng có thể thực hiện)** — Xem Room Map, cập nhật trạng thái phòng, ghi nhận dịch vụ phát sinh (addons).
10. **Dashboard (Admin UI)** — Trang tổng quan với KPI doanh thu, occupancy, biểu đồ xu hướng, danh sách booking gần đây.
11. **Cron Jobs tự động** — Tự động hết hạn booking khi quá hạn thanh toán (PENDING_PAYMENT).

## Capabilities

### New Capabilities
- `room-type-management`: CRUD loại phòng, upload ảnh, kiểm tra ràng buộc booking trước khi xóa
- `room-management`: CRUD phòng cụ thể, filter theo loại phòng/tầng/chi nhánh, cập nhật trạng thái
- `pricing-config`: Tạo/xóa quy tắc giá theo mùa/lễ/mặc định, tính giá tự động khi đặt phòng
- `staff-management`: CRUD tài khoản nhân viên, khóa/mở khóa, phân quyền RECEPTIONIST/HOUSEKEEPING/ADMIN
- `booking-admin`: Xem/duyệt/từ chối booking, check-in/check-out, quản lý dịch vụ phát sinh
- `reports-analytics`: Báo cáo doanh thu, occupancy, trạng thái đơn, xuất file Excel/PDF
- `coupon-management`: CRUD coupon, áp dụng coupon cho booking, công khai coupon
- `chat-support`: Danh sách conversation, nhận phụ trách, gửi tin nhắn, đánh dấu giải quyết
- `admin-dashboard`: Trang tổng quan admin với KPI cards, biểu đồ, booking gần đây
- `cron-auto-expire`: Cron job tự động hết hạn booking PENDING_PAYMENT quá hạn

### Modified Capabilities
<!-- Không có spec hiện có nào bị thay đổi yêu cầu -->

## Impact

- **Backend API** (`apps/api/src/`): Các module hiện có (rooms, users, bookings, reports, coupons, chat, staff) cần được kiểm tra và hoàn thiện nếu thiếu endpoint. Thêm endpoint internal cho cron job.
- **Frontend Admin** (`apps/web/src/app/admin/`): Cần xây dựng hoặc hoàn thiện các trang: dashboard, room-types, rooms, staff, conversations, bookings, pricing, coupons. Layout chung với Sidebar.
- **Prisma Schema**: Các bảng liên quan admin: users, room_types, rooms, hotel_branches, pricing_rules, bookings, payments, booking_addons, coupons, user_coupons, conversations, messages, reviews — cần review migration hiện tại.
- **Authentication/Authorization**: Sử dụng JwtAuthGuard + RolesGuard hiện có; tất cả endpoint admin đều yêu cầu role ADMIN.
- **Cron job**: Cần Vercel Cron hoặc cron-job.org để gọi endpoint expire-bookings định kỳ.
