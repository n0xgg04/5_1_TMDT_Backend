## Context

Hệ thống Sapphire Stay hiện xử lý thanh toán chuyển khoản thủ công: khách upload biên lai → staff kiểm tra → duyệt. Sepay là nền tảng quản lý giao dịch ngân hàng tại Việt Nam, cung cấp webhook real-time khi có giao dịch mới. Tích hợp Sepay giúp tự động hóa hoàn toàn luồng chuyển khoản.

## Goals / Non-Goals

**Goals:**
- Tự động xác nhận booking khi khách chuyển khoản thành công qua Sepay webhook
- Quản lý bill với mã thanh toán duy nhất để khớp giao dịch ngân hàng
- Lưu trữ toàn bộ transaction từ Sepay để audit và đối soát
- Cron đối soát định kỳ đảm bảo không bỏ sót giao dịch
- Loại bỏ bước duyệt biên lai thủ công

**Non-Goals:**
- Không thay đổi luồng thanh toán VNPay, Stripe/VISA
- Không thay đổi luồng duyệt yêu cầu đặt chỗ (PENDING_HOST_APPROVAL)
- Không tích hợp API Sepay ngoài webhook (chỉ dùng API cho đối soát)
- Không xử lý hoàn tiền tự động qua Sepay

## Decisions

### Decision 1: Mã thanh toán = `SS` + bookingCode

**Chọn**: Mỗi bill có `paymentCode` format `SS-XXXXXXXX` (SS prefix + bookingCode).

**Lý do**: BookingCode đã tồn tại và unique. Prefix `SS` (Sapphire Stay) giúp phân biệt với các giao dịch khác trong tài khoản ngân hàng. Độ dài ngắn gọn, dễ nhập khi chuyển khoản.

**Alternative**: UUID ngẫu nhiên — an toàn hơn nhưng dài, khó nhập chính xác khi chuyển khoản.

### Decision 2: HMAC-SHA256 cho xác thực webhook

**Chọn**: Xác thực Sepay webhook bằng HMAC-SHA256 với timestamp check (±5 phút).

**Lý do**: Sepay docs khuyến nghị đây là phương thức an toàn nhất. Bảo vệ chống replay attack và payload tampering. API Key là tối thiểu nhưng không bảo vệ payload.

**Implementation**: Đọc raw body (không parse trước), dùng `express.raw({ type: 'application/json' })` cho route webhook. NestJS cần cấu hình raw body parser riêng cho route này.

### Decision 3: Chống trùng bằng gatewayTransactionId UNIQUE

**Chọn**: `BankTransaction.gatewayTransactionId` là UNIQUE column. Dùng INSERT IGNORE pattern (catch unique constraint violation) thay vì check-then-insert.

**Lý do**: Sepay docs nêu rõ id giao dịch không đổi qua retry/replay. UNIQUE constraint chặn trùng ngay từ database, an toàn cả khi 2 webhook đến đồng thời.

### Decision 4: Khớp giao dịch bằng paymentCode trong content

**Chọn**: Parse `content` hoặc `description` của Sepay payload, tìm pattern `SS-[A-Z0-9]+` để extract paymentCode.

**Lý do**: Sepay cấu hình "Cấu trúc mã thanh toán" cho phép extract code từ nội dung chuyển khoản. `code` field trong payload chứa mã đã parse theo cấu hình này. Nếu `code` null, fallback parse từ `content`.

### Decision 5: Tách bill và payment riêng biệt

**Chọn**: Tạo model `Bill` riêng, có quan hệ 1-1 với `Payment` khi method là `BANK_TRANSFER`.

**Lý do**: 
- Bill chứa thông tin đặc thù của chuyển khoản (mã thanh toán, hạn thanh toán, số tiền cần chuyển)
- Payment vẫn là entity chung cho mọi phương thức
- Dễ mở rộng sau này (nhiều bill cho 1 booking nếu cần thanh toán nhiều đợt)

### Decision 6: Cron đối soát mỗi 15 phút

**Chọn**: Scheduled job gọi Sepay API `/transactions` với khoảng thời gian 15 phút, đối chiếu với `BankTransaction` table.

**Lý do**: Sepay docs khuyến nghị chạy cron 15-30 phút để bổ sung giao dịch thiếu khi webhook không đến (endpoint sập > 5h). 15 phút là an toàn, đủ thời gian xử lý.

## Risks / Trade-offs

- **[Rủi ro] Khách chuyển sai số tiền**: Webhook vẫn nhận giao dịch nhưng amount không khớp bill → không tự động confirm. → **Mitigation**: Staff dashboard hiển thị transaction không khớp, có thể manual link hoặc hoàn tiền.
- **[Rủi ro] Webhook không đến do endpoint sập**: Giao dịch bị bỏ sót. → **Mitigation**: Cron đối soát mỗi 15 phút bổ sung giao dịch thiếu. Sepay retry webhook theo lịch riêng.
- **[Rủi ro] HMAC secret bị lộ**: Attacker có thể gửi webhook giả. → **Mitigation**: Lưu secret trong biến môi trường, không commit. IP whitelist bổ sung nếu cần.
- **[Trade-off] Không còn luồng upload biên lai**: Khách không có internet banking vẫn cần cách thanh toán. → **Mitigation**: Giữ lại `BANK_TRANSFER` không webhook như luồng fallback với manual approval, nhưng ưu tiên Sepay.

## Open Questions

- Có cần hỗ trợ nhiều tài khoản ngân hàng nhận không? (Hiện tại Sepay hỗ trợ nhiều accountNumber trong cùng webhook)
- Có cần thông báo real-time (WebSocket/push) cho staff khi có giao dịch mới không?
