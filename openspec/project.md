# Bối Cảnh Dự Án Sapphire Stay

## Miền Nghiệp Vụ

Sapphire Stay là hệ thống đặt phòng khách sạn trực tuyến. Hệ thống phục vụ đầy đủ các luồng khách hàng tự đặt phòng, nhân viên vận hành khách sạn và quản trị viên quản lý dữ liệu kinh doanh.

Các nhóm nghiệp vụ chính:

- Khách hàng: đăng ký, đăng nhập, tìm phòng, xem chi tiết loại phòng, lưu wishlist, đặt phòng, thanh toán, hủy đơn, xem lịch sử, nhận ưu đãi, đánh giá sau lưu trú và chat với nhân viên.
- Lễ tân: xem sơ đồ phòng, cập nhật trạng thái phòng, duyệt booking chuyển khoản, check-in, check-out, ghi nhận dịch vụ phát sinh và xử lý hội thoại hỗ trợ.
- Buồng phòng: xem sơ đồ phòng và cập nhật trạng thái dọn dẹp/bảo trì.
- Quản trị viên: quản lý tài khoản, nhân viên, loại phòng, phòng, chi nhánh, quy tắc giá, tài khoản chuyển khoản, coupon, báo cáo và hội thoại hỗ trợ.
- Cổng thanh toán: VNPay và Stripe/VISA xử lý giao dịch và trả kết quả thanh toán.
- Bộ lập lịch: gọi endpoint nội bộ để tự động hết hạn booking chưa thanh toán.

## Công Nghệ

- Monorepo: pnpm workspaces và Turborepo.
- Backend: NestJS 10, TypeScript, Prisma 6, PostgreSQL, JWT/passport, class-validator/class-transformer, Nest throttler, Swagger ngoài production.
- Frontend: Next.js 16 App Router, React 19, Tailwind CSS, React Query, Zustand, axios.
- Hạ tầng/phụ trợ: PostgreSQL, Upstash Redis REST có fallback in-memory khi dev, Resend email, VNPay, Stripe, Vercel/serverless.

## Quy Ước API

- Tất cả REST endpoint backend nằm dưới `/api/v1`.
- Endpoint public phải được đánh dấu `@Public()`.
- Endpoint bảo vệ yêu cầu header `Authorization: Bearer <accessToken>`.
- Wishlist ẩn danh dùng header `x-session-id`; frontend tạo session id và lưu trong `localStorage`.
- CORS lấy origin từ `CORS_ORIGINS`, mặc định `http://localhost:3001`.
- CORS cho phép các header `Content-Type`, `Authorization`, `X-Requested-With`, `x-session-id`.
- Validation toàn cục dùng `ValidationPipe` với `whitelist`, `transform`, `forbidNonWhitelisted`; field lạ trong DTO bị từ chối.
- Response lỗi được chuẩn hóa thành `{ statusCode, timestamp, path, message }`.
- Throttling toàn cục giới hạn 100 request mỗi 60 giây.

## Mô Hình Dữ Liệu Chính

- `User`: tài khoản, role, trạng thái khóa/mở, password hash và refresh token hash.
- `HotelBranch`: chi nhánh khách sạn đang hoạt động.
- `RoomType`: loại phòng thương mại, sức chứa, tiện nghi, ảnh, chính sách, FAQ, sao và trạng thái hoạt động.
- `Room`: phòng vật lý cụ thể, số phòng duy nhất, tầng, chi nhánh, loại phòng và trạng thái vận hành.
- `PricingRule`: quy tắc giá theo ngày, loại giá và độ ưu tiên.
- `Booking`: đơn đặt một phòng trong một khoảng ngày, có deadline thanh toán, trạng thái vòng đời, giảm giá, thông tin duyệt, thời gian check-in/out thực tế, biên lai, payment, addon và review.
- `Payment`: một bản ghi thanh toán cho mỗi booking, gồm phương thức, loại thanh toán, số tiền, gateway, biên lai, thời gian thanh toán, lỗi và hoàn tiền.
- `Coupon` và `UserCoupon`: mã khuyến mãi và trạng thái claim/sử dụng của từng người dùng.
- `FlashSale`: giảm giá phần trăm theo loại phòng trong khung thời gian và số lượng.
- `Wishlist`: loại phòng đã lưu theo user hoặc session ẩn danh.
- `Conversation` và `Message`: hội thoại hỗ trợ khách hàng.
- `Notification`: log gửi email và trạng thái gửi/thất bại.
- `OutboxEvent`: bảng lưu audit/replay cho event tạo booking.

## Trạng Thái Nghiệp Vụ

Trạng thái booking:

- `PENDING_PAYMENT`: booking đã tạo và đang chờ khách thanh toán hoặc upload biên lai chuyển khoản.
- `PAYING`: đã khởi tạo thanh toán online và đang chờ gateway trả kết quả.
- `PENDING_APPROVAL`: khách đã upload biên lai, staff cần duyệt hoặc từ chối.
- `CONFIRMED`: booking đã được xác nhận qua thanh toán thành công hoặc staff duyệt.
- `CHECKED_IN`: khách đã nhận phòng, phòng chuyển sang đang ở.
- `CHECKED_OUT`: khách đã trả phòng, phòng chuyển sang bẩn.
- `CANCELLED`: khách đã hủy booking trong trạng thái cho phép.
- `REJECTED`: staff từ chối booking chờ duyệt.
- `EXPIRED`: booking chưa thanh toán bị hết hạn.

Trạng thái payment:

- `PENDING`: biên lai chuyển khoản đã upload và đang chờ duyệt.
- `PROCESSING`: thanh toán online đã khởi tạo.
- `COMPLETED`: gateway hoặc thẻ xác nhận thanh toán thành công.
- `FAILED`: gateway hoặc thẻ báo thất bại.
- `REFUNDED`: payment được đánh dấu hoàn tiền khi booking bị từ chối trong nhánh cần hoàn.

Trạng thái phòng:

- `AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `RESERVED`.

## Event Và Side Effect

- Hệ thống dùng event bus in-process thay cho consumer broker dài hạn.
- `booking.created` được lưu vào `outbox_events` rồi emit trong process.
- `payment.success` xác nhận booking nếu booking đang `PENDING_PAYMENT` hoặc `PAYING`.
- `payment.failed` hết hạn booking nếu booking đang `PENDING_PAYMENT` hoặc `PAYING`.
- `booking.confirmed`, `booking.cancelled`, `booking.expired`, `checkout.completed` tạo notification và gửi email qua Resend nếu cấu hình có API key.
- Lỗi ở một event handler chỉ được log, không làm dừng các handler còn lại.

## Lệnh Phát Triển

- Cài dependency: `pnpm install`.
- Chạy hạ tầng local: `docker compose up -d postgres redis rabbitmq`.
- Generate Prisma client: `pnpm --filter @hotel/api db:generate`.
- Chạy migration local: `pnpm --filter @hotel/api db:migrate`.
- Seed dữ liệu mẫu: `pnpm --filter @hotel/api db:seed`.
- Chạy API: `pnpm --filter @hotel/api dev`.
- Chạy web: `pnpm --filter @hotel/web dev`.
- Build toàn bộ: `pnpm build`.

## Quy Tắc Viết Tài Liệu

- Tài liệu OpenSpec phải dùng tiếng Việt cho phần mô tả, tên requirement, tên scenario và nội dung scenario.
- Giữ nguyên các token cú pháp OpenSpec bắt buộc như `Requirement` và `Scenario` để CLI validate được.
- Spec mô tả hành vi đã triển khai trong code hiện tại, trừ khi ghi rõ là khoảng trống hoặc thay đổi tương lai.
- Requirement được nhóm theo capability nghiệp vụ, không nhất thiết theo tên Nest module.
- Hành vi có chuyển trạng thái, phân quyền, validation hoặc ảnh hưởng tiền phải có scenario.
- Nếu hành vi hiện tại khác kỳ vọng phổ biến của hệ thống khách sạn, tài liệu phải mô tả đúng hành vi hiện tại thay vì tự giả định chính sách khác.
