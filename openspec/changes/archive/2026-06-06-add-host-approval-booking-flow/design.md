## Context

Sapphire Stay hiện tạo booking ở `PENDING_PAYMENT`, tính flash sale, áp coupon và consume coupon ngay trong `BookingsService.createBooking`. Thanh toán chỉ được khởi tạo khi booking ở `PENDING_PAYMENT`; payment success chuyển booking sang `CONFIRMED`. Trạng thái `PENDING_APPROVAL` hiện đang dùng cho nhánh khách upload biên lai chuyển khoản và staff duyệt biên lai.

Yêu cầu mới đổi luồng chính thành request-to-book: khách gửi yêu cầu đặt chỗ, admin/receptionist duyệt trong 24 giờ, sau đó khách mới được thanh toán trong 30 phút đến tối đa 2 giờ. Trong giai đoạn chờ duyệt, admin cần xem trạng thái phòng và chat với khách; user cần nhận thông báo trong app, email và realtime khi được duyệt/từ chối/hết hạn.

## Goals / Non-Goals

**Goals:**

- Tách rõ trạng thái chờ duyệt yêu cầu đặt chỗ với trạng thái chờ duyệt biên lai chuyển khoản.
- Chặn mọi luồng thanh toán trước khi yêu cầu đặt chỗ được admin/receptionist duyệt.
- Chuyển việc áp mã giảm giá từ tạo booking sang bước thanh toán.
- Tự động hết hạn yêu cầu chưa duyệt sau 24 giờ và đơn đã duyệt nhưng chưa thanh toán sau deadline ngắn hạn.
- Bổ sung notification in-app, email và realtime delivery cho user khi trạng thái booking thay đổi.
- Bổ sung admin/staff queue để duyệt request, kiểm tra phòng và mở chat với khách trong lúc đơn chờ duyệt.

**Non-Goals:**

- Không xây hệ thống multi-host marketplace đầy đủ với tài khoản host riêng; vai trò duyệt vẫn là `ADMIN` và `RECEPTIONIST` hiện có.
- Không thay thế VNPay/Stripe/Bank Transfer hoặc thay đổi luồng callback gateway ngoài các guard trạng thái mới.
- Không triển khai escrow/payout cho chủ home trong change này.
- Không thay đổi logic check-in/check-out và addon sau khi booking đã `CONFIRMED`.

## Decisions

### 1. Thêm `PENDING_HOST_APPROVAL`, giữ `PENDING_APPROVAL` cho biên lai

Booking mới sẽ tạo ở `PENDING_HOST_APPROVAL`. `PENDING_APPROVAL` tiếp tục chỉ có nghĩa là khách đã upload biên lai chuyển khoản và staff đang duyệt chứng từ thanh toán.

Lý do: tái sử dụng `PENDING_APPROVAL` cho cả hai luồng sẽ khiến endpoint `/bookings/:id/approve` không biết đang duyệt yêu cầu đặt chỗ hay duyệt biên lai. Tách trạng thái giúp query, báo cáo, notification và cron rõ nghĩa hơn.

Phương án khác đã cân nhắc: thêm field `approvalKind` và tiếp tục dùng `PENDING_APPROVAL`. Phương án đó ít migration enum hơn nhưng làm mọi nơi đọc status phải kiểm tra thêm discriminator, dễ sót ở frontend và report.

### 2. Thêm deadline duyệt riêng, payment deadline chỉ có sau khi duyệt

Booking cần `approvalDeadline` để scheduler hủy yêu cầu chưa được xử lý sau 24 giờ. `paymentDeadline` sẽ được set khi request được duyệt, mặc định `now + 30 phút`; cấu hình môi trường có thể cho phép kéo dài tối đa 2 giờ.

Lý do: `paymentDeadline` hiện có nghĩa là hạn thanh toán. Dùng nó cho cả hạn duyệt 24 giờ sẽ làm thông báo và cron sai nghĩa. Nếu schema hiện bắt buộc `paymentDeadline`, migration nên cho phép nullable hoặc backfill rõ ràng.

### 3. Duyệt yêu cầu đặt chỗ dùng endpoint riêng

Tạo endpoint riêng cho request approval, ví dụ:

- `GET /api/v1/bookings/staff/approval-requests`
- `POST /api/v1/bookings/:id/approve-request`
- `POST /api/v1/bookings/:id/reject-request`

Các endpoint biên lai hiện có (`upload-receipt`, pending receipt, approve/reject receipt) nên được giữ hoặc đổi tên dần, nhưng không nên trộn với request approval.

Lý do: hành vi sau approve khác nhau. Duyệt request chuyển booking sang `PENDING_PAYMENT`; duyệt biên lai chuyển booking sang `CONFIRMED`.

### 4. Coupon được reserve ở bước khởi tạo thanh toán

Tạo booking chỉ tính giá phòng và flash sale để hiển thị giá dự kiến; không consume coupon. Khi khách khởi tạo thanh toán sau duyệt, request payment được phép gửi `couponCode`; hệ thống validate coupon theo số tiền hiện tại, lưu `couponCode`, `discountAmount`, cập nhật `totalAmount`/payment amount và reserve coupon usage.

Nếu payment thất bại hoặc booking hết hạn thanh toán, hệ thống phải release reservation coupon. Nếu payment thành công, coupon reservation được giữ như đã sử dụng.

Lý do: áp coupon ở bước thanh toán đúng kỳ vọng e-commerce và tránh giữ coupon 24 giờ cho request chưa chắc được duyệt. Reserve tại payment initiation giảm rủi ro vượt usage limit trong lúc gateway xử lý.

### 5. Notification realtime dùng SSE có polling fallback

Backend thêm notification query endpoint và SSE stream:

- `GET /api/v1/notifications/me`
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/notifications/stream`

Frontend mở SSE khi user đã đăng nhập; nếu stream lỗi hoặc môi trường serverless không giữ kết nối ổn định, notification bar fallback sang polling ngắn hạn bằng React Query.

Lý do: SSE nhẹ hơn WebSocket cho luồng server-to-user một chiều, hợp với notification. Polling fallback giữ UX hoạt động trong deploy serverless.

### 6. Chat gắn với booking trong giai đoạn chờ duyệt

`Conversation.bookingId` đã tồn tại trong schema nhưng service chưa dùng. Change này dùng field đó để mở hoặc lấy conversation theo booking đang `PENDING_HOST_APPROVAL`. Admin/receptionist có thể mở conversation từ approval queue; customer có thể chat trong chi tiết booking khi đơn chờ duyệt.

Lý do: không cần model mới, và việc gắn chat với booking giúp staff nhìn đúng bối cảnh duyệt thay vì một hàng đợi hỗ trợ chung.

## Risks / Trade-offs

- [Risk] Migration enum booking status có thể ảnh hưởng dữ liệu cũ và Prisma generated client. → Mitigation: migration thêm status mới, backfill booking đang pending theo nghĩa hiện tại, chạy `db:generate` và cập nhật mọi switch/status badge.
- [Risk] Coupon reserve tại payment initiation có thể bị kẹt nếu callback không về. → Mitigation: cron expire payment deadline phải release coupon khi booking chuyển `EXPIRED`; payment failed cũng release idempotent.
- [Risk] SSE không ổn định trên một số môi trường serverless. → Mitigation: frontend luôn có polling fallback và backend vẫn persist notification trong DB trước khi phát realtime.
- [Risk] Khóa phòng 24 giờ cho request chưa duyệt làm giảm availability. → Mitigation: conflict check chỉ coi `PENDING_HOST_APPROVAL` là active đến `approvalDeadline`; staff có thể reject sớm và scheduler expire đúng hạn.
- [Risk] Existing `approve/reject` cho biên lai và request approval dễ gây nhầm UI. → Mitigation: đặt label UI rõ “Duyệt yêu cầu đặt chỗ” và “Duyệt biên lai”, đồng thời dùng endpoint riêng.

## Migration Plan

1. Cập nhật Prisma schema: thêm `PENDING_HOST_APPROVAL`, thêm `approvalDeadline`, cân nhắc cho `paymentDeadline` nullable hoặc backfill bằng deadline thanh toán hiện có.
2. Backfill dữ liệu hiện tại: booking `PENDING_PAYMENT` giữ nguyên là đã được phép thanh toán; booking `PENDING_APPROVAL` giữ nguyên là chờ duyệt biên lai.
3. Cập nhật backend booking/payment/coupon/cron/notification/chat theo trạng thái mới.
4. Cập nhật frontend booking/payment/my bookings/admin pending/chat/notification bar.
5. Chạy migration, generate Prisma client, seed/test dữ liệu mẫu.
6. Rollback: nếu cần quay lại luồng cũ, dừng tạo `PENDING_HOST_APPROVAL`, map các request chưa duyệt sang `CANCELLED` hoặc `PENDING_PAYMENT` theo quyết định nghiệp vụ trước khi revert enum/code.

## Open Questions

- Deadline thanh toán sau duyệt nên cố định 30 phút hay cho admin chọn trong khoảng 30 phút đến 2 giờ?
- Customer có được hủy request đang `PENDING_HOST_APPROVAL` không? Thiết kế đề xuất có, vì chưa phát sinh thanh toán.
- Khi nhiều request trùng cùng phòng/ngày cùng chờ duyệt, hệ thống nên chặn ngay từ lúc tạo request hay cho staff chọn một request để duyệt? Thiết kế đề xuất chặn overlap để tránh hàng đợi ảo và giảm kỳ vọng sai cho khách.
