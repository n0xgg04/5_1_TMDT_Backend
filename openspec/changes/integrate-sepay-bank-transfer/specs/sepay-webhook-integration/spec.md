## ADDED Requirements

### Requirement: Endpoint Webhook Sepay

Hệ thống PHẢI (SHALL) cung cấp endpoint public nhận HTTP POST từ Sepay, xác thực chữ ký, chống trùng và phản hồi `{"success": true}` trong 30 giây.

#### Scenario: Webhook nhận giao dịch hợp lệ

- **CHO** Sepay gửi POST đến `/webhooks/sepay`
- **VÀ** header `X-SePay-Signature` hợp lệ (HMAC-SHA256)
- **VÀ** `X-SePay-Timestamp` cách hiện tại không quá 5 phút
- **VÀ** `transferType` là `in`
- **VÀ** transaction id chưa tồn tại trong hệ thống
- **KHI** xử lý webhook
- **THÌ** hệ thống PHẢI phản hồi HTTP 200 `{"success": true}`
- **VÀ** lưu raw payload vào `BankTransaction`
- **VÀ** xử lý khớp giao dịch bất đồng bộ (queue/in-process async).

#### Scenario: Webhook bị replay

- **CHO** transaction id đã tồn tại trong `BankTransaction`
- **KHI** nhận lại webhook cùng id
- **THÌ** hệ thống PHẢI vẫn phản hồi HTTP 200 `{"success": true}`
- **VÀ** KHÔNG xử lý lại business logic.

#### Scenario: Chữ ký không hợp lệ

- **CHO** `X-SePay-Signature` không khớp với chữ ký tính từ raw body và secret
- **KHI** nhận webhook
- **THÌ** hệ thống PHẢI phản hồi HTTP 401
- **VÀ** KHÔNG xử lý payload.

#### Scenario: Timestamp quá cũ

- **CHO** `X-SePay-Timestamp` cách hiện tại quá 5 phút
- **KHI** nhận webhook
- **THÌ** hệ thống PHẢI phản hồi HTTP 401
- **VÀ** message chứa `Request expired`.

#### Scenario: Giao dịch out (tiền ra)

- **CHO** payload có `transferType` là `out`
- **KHI** nhận webhook
- **THÌ** hệ thống PHẢI phản hồi HTTP 200 `{"success": true}`
- **VÀ** lưu transaction nhưng KHÔNG xử lý khớp bill.

### Requirement: Xác Thực HMAC-SHA256

Hệ thống PHẢI (SHALL) xác thực chữ ký webhook Sepay bằng HMAC-SHA256 với raw body.

#### Scenario: Tính chữ ký HMAC

- **CHO** raw body byte gốc và `X-SePay-Timestamp`
- **KHI** xác thực chữ ký
- **THÌ** hệ thống PHẢI tính `HMAC-SHA256(timestamp + "." + rawBody, secret)`
- **VÀ** so sánh constant-time với giá trị trong `X-SePay-Signature` sau prefix `sha256=`
- **VÀ** sử dụng `crypto.timingSafeEqual` để tránh timing attack.

#### Scenario: Raw body không bị parse trước

- **CHO** middleware NestJS mặc định parse JSON body
- **KHI** xử lý webhook route
- **THÌ** route PHẢI dùng raw body parser (`express.raw({ type: 'application/json' })`)
- **VÀ** verify chữ ký trên raw body byte gốc trước khi parse JSON.

### Requirement: Lưu Trữ Và Chống Trùng Giao Dịch

Hệ thống PHẢI (SHALL) lưu toàn bộ payload webhook vào bảng `BankTransaction` với `gatewayTransactionId` là UNIQUE constraint.

#### Scenario: Lưu transaction lần đầu

- **CHO** transaction id chưa tồn tại
- **KHI** insert vào `BankTransaction`
- **THÌ** hệ thống PHẢI lưu toàn bộ fields: `gatewayTransactionId`, `gateway` (ngân hàng), `transactionDate`, `accountNumber`, `subAccount`, `code`, `content`, `transferType`, `description`, `transferAmount`, `accumulated`, `referenceCode`, `rawPayload` (JSON gốc).

#### Scenario: Insert trùng transaction id

- **CHO** transaction id đã tồn tại
- **KHI** insert vào `BankTransaction`
- **THÌ** database PHẢI throw unique constraint violation
- **VÀ** hệ thống bắt lỗi và phản hồi `{"success": true}`.

### Requirement: Khớp Giao Dịch Với Bill

Hệ thống PHẢI (SHALL) tự động khớp `BankTransaction` với `Bill` dựa trên `paymentCode` và `transferAmount`.

#### Scenario: Khớp transaction với bill thành công

- **CHO** `BankTransaction` mới được lưu với `transferType` là `in`
- **VÀ** parse được `paymentCode` từ `code` hoặc `content` của transaction
- **VÀ** tìm thấy `Bill` có `paymentCode` khớp và `status` là `PENDING`
- **VÀ** `transferAmount` bằng `bill.amount`
- **KHI** xử lý khớp giao dịch
- **THÌ** hệ thống PHẢI cập nhật bill `status` thành `PAID`, set `paidAt`
- **VÀ** cập nhật payment `status` thành `COMPLETED`
- **VÀ** emit `payment.success` để xác nhận booking.

#### Scenario: Khớp transaction sai số tiền

- **CHO** `paymentCode` khớp với bill
- **VÀ** `transferAmount` khác `bill.amount`
- **KHI** xử lý khớp giao dịch
- **THÌ** hệ thống PHẢI lưu transaction với `status` là `MISMATCH`
- **VÀ** KHÔNG tự động confirm booking
- **VÀ** tạo notification cho staff về giao dịch sai số tiền.

#### Scenario: Không tìm thấy bill cho paymentCode

- **CHO** parse được `paymentCode` từ transaction
- **VÀ** không có `Bill` nào có `paymentCode` khớp
- **KHI** xử lý khớp giao dịch
- **THÌ** hệ thống PHẢI lưu transaction với `status` là `UNMATCHED`
- **VÀ** KHÔNG thay đổi booking nào.

#### Scenario: Bill đã hết hạn hoặc đã hủy

- **CHO** `paymentCode` khớp với bill
- **VÀ** bill `status` là `EXPIRED` hoặc `CANCELLED`
- **KHI** xử lý khớp giao dịch
- **THÌ** hệ thống PHẢI lưu transaction với `status` là `LATE_PAYMENT`
- **VÀ** KHÔNG tự động confirm booking
- **VÀ** tạo notification cho staff xem xét.

#### Scenario: Parse paymentCode từ content

- **CHO** transaction có `code` là null
- **VÀ** `content` chứa pattern `SS-[A-Z0-9]+`
- **KHI** parse paymentCode
- **THÌ** hệ thống PHẢI extract paymentCode từ regex `SS-[A-Z0-9]+` trong `content`.

### Requirement: Xử Lý Bất Đồng Bộ Webhook

Hệ thống PHẢI (SHALL) phản hồi webhook ngay lập tức (trong 30 giây) và xử lý business logic bất đồng bộ.

#### Scenario: Phản hồi nhanh

- **CHO** nhận được webhook request
- **KHI** lưu raw payload thành công
- **THÌ** endpoint PHẢI phản hồi HTTP 200 `{"success": true}` ngay
- **VÀ** business logic (khớp bill, emit event) chạy bất đồng bộ.

#### Scenario: Lỗi khi lưu transaction

- **CHO** lưu raw payload thất bại (không phải do duplicate)
- **KHI** xử lý webhook
- **THÌ** endpoint PHẢI phản hồi HTTP 500
- **VÀ** KHÔNG trả `{"success": true}`
- **VÀ** Sepay sẽ retry theo lịch retry của Sepay.
