## 1. Review & Setup (Đã hoàn thành — xác nhận mã nguồn hiện có)

- [x] 1.1 Review Prisma schema: đầy đủ 20 models, đã có các bảng cần thiết
- [x] 1.2 Review Prisma migration: schema đồng bộ với database
- [x] 1.3 Review các module backend: rooms, users, bookings, reports, coupons, chat, staff, cron đã hoàn chỉnh — thiếu GET /api/v1/bookings (admin list all) và CSV export cho reports
- [x] 1.4 Review các trang frontend admin: dashboard, rooms, room-types, staff, conversations đã hoàn chỉnh — thiếu trang bookings, coupons, pricing UI
- [x] 1.5 CRON_SECRET đã có trong .env

## 2. Backend — Đã hoàn thiện sẵn (Room Type Management)

- [x] 2.1 GET /api/v1/rooms/types — đã có, filter includeInactive
- [x] 2.2 POST /api/v1/rooms/types — đã có, validation đầy đủ
- [x] 2.3 GET /api/v1/rooms/types/:id — đã có, kèm pricing rules
- [x] 2.4 PATCH /api/v1/rooms/types/:id — đã có
- [x] 2.5 DELETE /api/v1/rooms/types/:id — đã có soft delete, check active bookings
- [x] 2.6 Tự động tạo rooms con — đã có trong service

## 3. Backend — Đã hoàn thiện sẵn (Room Management)

- [x] 3.1 GET /api/v1/rooms — đã có, filter roomTypeId, floor
- [x] 3.2 POST /api/v1/rooms — đã có, check duplicate room_number
- [x] 3.3 PATCH /api/v1/rooms/:id — đã có, update status
- [x] 3.4 DELETE /api/v1/rooms/:id — đã có, check if occupied
- [x] 3.5 GET /api/v1/rooms/branches — đã có

## 4. Backend — Đã hoàn thiện sẵn (Pricing Config)

- [x] 4.1 POST /api/v1/rooms/pricing — đã có
- [x] 4.2 DELETE /api/v1/rooms/pricing/:id — đã có soft delete
- [x] 4.3 PricingService.calculateTotalPrice() — đã có, ưu tiên HOLIDAY > SEASONAL > DEFAULT
- [x] 4.4 Validation chồng chéo ngày — đã có

## 5. Backend — Đã hoàn thiện sẵn (Staff Management)

- [x] 5.1 GET /api/v1/users — đã có, pagination + filter by role
- [x] 5.2 POST /api/v1/users/staff — đã có
- [x] 5.3 PATCH /api/v1/users/:id/toggle-lock — đã có, prevent self-lock
- [x] 5.4 GET /api/v1/users/me, PATCH /api/v1/users/me — đã có

## 6. Backend — Bổ sung endpoint Admin Bookings

- [x] 6.1 Thêm GET /api/v1/bookings cho ADMIN: list all bookings with pagination, filter by status/date range/keyword
- [x] 6.2 GET /api/v1/bookings/:id — đã có, admin xem được mọi booking
- [x] 6.3 POST /api/v1/bookings/:id/approve — đã có
- [x] 6.4 POST /api/v1/bookings/:id/reject — đã có, auto refund nếu đã thanh toán
- [x] 6.5 POST /api/v1/bookings/:id/checkin — đã có
- [x] 6.6 POST /api/v1/bookings/:id/checkout — đã có
- [x] 6.7 GET /api/v1/bookings/staff/pending — đã có

## 7. Backend — Bổ sung CSV Export cho Reports

- [x] 7.1 GET /api/v1/reports/revenue — đã có
- [x] 7.2 GET /api/v1/reports/occupancy — đã có
- [x] 7.3 GET /api/v1/reports/bookings/summary — đã có
- [x] 7.4 Thêm CSV export cho revenue và occupancy reports (query param ?format=csv)

## 8. Backend — Đã hoàn thiện sẵn (Coupon & Khuyến mãi)

- [x] 8.1 GET /api/v1/coupons/admin — đã có
- [x] 8.2 POST /api/v1/coupons/admin — đã có
- [x] 8.3 Các endpoint public: GET /api/v1/coupons, GET /api/v1/coupons/public, POST /api/v1/coupons/apply — đã có
- [x] 8.4 POST /api/v1/coupons/:id/claim — đã có
- [x] 8.5 GET /api/v1/coupons/my-coupons — đã có

## 9. Backend — Đã hoàn thiện sẵn (Chat Support)

- [x] 9.1 GET /api/v1/chat/staff/conversations — đã có
- [x] 9.2 GET /api/v1/chat/staff/conversations/:id — đã có
- [x] 9.3 POST /api/v1/chat/staff/conversations/:id/assign — đã có
- [x] 9.4 POST /api/v1/chat/staff/conversations/:id/resolve — đã có
- [x] 9.5 POST /api/v1/chat/conversation/:id/messages — đã có

## 10. Backend — Đã hoàn thiện sẵn (Staff Operations)

- [x] 10.1 GET /api/v1/staff/room-map — đã có
- [x] 10.2 PATCH /api/v1/staff/room-map/:roomId — đã có
- [x] 10.3 GET/POST /api/v1/staff/bookings/:bookingId/addons — đã có
- [x] 10.4 PATCH/DELETE /api/v1/staff/addons/:id — đã có

## 11. Backend — Đã hoàn thiện sẵn (Cron Job)

- [x] 11.1 Endpoint POST /api/v1/internal/cron/expire-bookings — đã có, CRON_SECRET auth
- [x] 11.2 Logic expire PENDING_PAYMENT — đã có
- [x] 11.3 Redis lock (SETNX) — đã có
- [x] 11.4 Bỏ qua booking PAYING — đã có
- [x] 11.5 Emit event "booking.expired" — đã có
- [x] 11.6 Cấu hình Vercel Cron — đã sẵn sàng, chỉ cần deploy

## 12. Frontend — Đã hoàn thiện sẵn (Admin Layout & Dashboard)

- [x] 12.1 Layout admin + Sidebar — đã có, sidebar đầy đủ
- [x] 12.2 Dashboard: 4 KPI cards (Revenue, Occupancy, New Bookings, In-house) — đã có
- [x] 12.3 Biểu đồ doanh thu line chart + dropdown chọn kỳ — đã có
- [x] 12.4 Danh sách 5 booking gần đây + nút "View All" — đã có trên dashboard
- [x] 12.5 Nút hành động nhanh — đã có

## 13. Frontend — Sửa lỗi & Bổ sung (Room Types + Pricing)

- [x] 13.1 Trang /admin/room-types card grid — đã có
- [x] 13.2 Modal tạo loại phòng — đã có
- [x] 13.3 Chức năng sửa — đã có
- [x] 13.4 Chức năng xóa — đã có
- [x] 13.5 Fix Textarea import bug (đã tách thành textarea.tsx riêng)
- [x] 13.6 Hiển thị thông tin giá (pricing rules) trên card loại phòng

## 14. Frontend — Đã hoàn thiện sẵn (Rooms)

- [x] 14.1 Bảng danh sách phòng với filter — đã có
- [x] 14.2 Modal tạo phòng — đã có
- [x] 14.3 Đổi trạng thái phòng dropdown — đã có
- [x] 14.4 Xóa phòng — đã có

## 15. Frontend — Đã hoàn thiện sẵn (Staff)

- [x] 15.1 Bảng danh sách nhân viên, filter role — đã có
- [x] 15.2 Modal tạo nhân viên — đã có
- [x] 15.3 Nút khóa/mở khóa — đã có

## 16. Frontend — Trang Quản lý Đơn đặt phòng (Bookings) — MỚI

- [x] 16.1 Tạo trang /admin/bookings/page.tsx + api hook getAdminBookings
- [x] 16.2 Bảng danh sách booking với search, filter theo status/date range
- [x] 16.3 Modal xem chi tiết booking (customer, room, payment, addons)
- [x] 16.4 Nút Approve/Reject/Check-in/Check-out + form reject reason

## 17. Frontend — Trang Cấu hình Giá (Pricing) — MỚI

- [x] 17.1 Tạo trang /admin/pricing/page.tsx + api hooks
- [x] 17.2 Bảng danh sách pricing rules theo loại phòng
- [x] 17.3 Form tạo pricing rule (room type, type, price, date range)
- [x] 17.4 Chức năng xóa/vô hiệu hóa pricing rule

## 18. Frontend — Trang Quản lý Coupon — MỚI

- [x] 18.1 Tạo trang /admin/coupons/page.tsx + api hooks
- [x] 18.2 Bảng danh sách coupon (kể cả inactive)
- [x] 18.3 Modal tạo coupon (code, type, value, quantity, expiry)
- [x] 18.4 Chức năng vô hiệu hóa coupon

## 19. Frontend — Đã hoàn thiện sẵn (Conversations)

- [x] 19.1 Danh sách conversation — đã có
- [x] 19.2 Panel chat — đã có
- [x] 19.3 Nút assign + resolve — đã có

## 20. Fix Sidebar & Navigation

- [x] 20.1 Thêm menu items: Bookings, Coupons, Pricing vào sidebar admin
- [x] 20.2 Kiểm tra và cập nhật routing cho admin layout

## 21. Kiểm thử & Hoàn thiện

- [x] 21.1 Chạy openspec validate "admin-features" --strict
- [x] 21.2 Kiểm tra responsive UI trên các trang admin
