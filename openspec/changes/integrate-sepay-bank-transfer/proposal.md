## Why

Hiện tại, luồng thanh toán chuyển khoản yêu cầu khách upload biên lai thủ công, staff phải kiểm tra và duyệt biên lai trước khi xác nhận booking. Quy trình này chậm, dễ sai sót, tốn nhân lực vận hành. Với tích hợp Sepay webhook, hệ thống sẽ tự động nhận diện giao dịch chuyển khoản, khớp với booking và xác nhận thanh toán ngay lập tức — không cần can thiệp thủ công.

## What Changes

- **Tạo module quản lý bill (hóa đơn)**: Mỗi booking khi được duyệt sẽ tự động sinh một bill với mã thanh toán duy nhất (`SS` + bookingCode). Bill lưu số tiền, hạn thanh toán, trạng thái.
- **Tạo module quản lý transaction**: Lưu toàn bộ giao dịch từ Sepay webhook với cơ chế chống trùng qua `gatewayTransactionId` UNIQUE.
- **Tích hợp Sepay webhook**: Endpoint công khai nhận HTTP POST từ Sepay, xác thực HMAC-SHA256, khớp mã thanh toán trong nội dung chuyển khoản với bill, tự động xác nhận booking khi khớp đúng số tiền.
- **Tự động xác nhận booking**: Khi transaction khớp bill (đúng mã + đúng số tiền + đúng tài khoản nhận), booking tự động chuyển `CONFIRMED`, phòng chuyển `RESERVED`.
- **Cron đối soát định kỳ**: Chạy mỗi 15 phút, gọi Sepay API lấy danh sách giao dịch, so sánh với database, bổ sung giao dịch thiếu để tránh mất mát khi webhook không đến.
- **Loại bỏ luồng upload biên lai thủ công**: Trạng thái `PENDING_APPROVAL` không còn dùng cho luồng chuyển khoản ngân hàng. Khách chỉ cần chuyển tiền đúng mã thanh toán — hệ thống tự ghi nhận.

## Capabilities

### New Capabilities

- `bill-management`: Quản lý hóa đơn thanh toán chuyển khoản — tạo bill với mã thanh toán duy nhất, theo dõi trạng thái bill, gán hạn thanh toán.
- `sepay-webhook-integration`: Tích hợp webhook Sepay — endpoint nhận giao dịch, xác thực HMAC-SHA256, chống trùng lặp, khớp giao dịch với bill, tự động xác nhận booking.
- `bank-transfer-reconciliation`: Đối soát định kỳ — cron job gọi Sepay API, phát hiện giao dịch bị bỏ sót, bổ sung vào hệ thống.

### Modified Capabilities

- `payments`: Thay đổi luồng `BANK_TRANSFER` — không còn yêu cầu upload biên lai và duyệt thủ công. Payment `BANK_TRANSFER` khi khởi tạo sẽ yêu cầu khách chuyển khoản với mã thanh toán, hệ thống tự xác nhận qua webhook.
- `booking-lifecycle`: Thêm đường dẫn tự động `PENDING_PAYMENT → CONFIRMED` qua Sepay webhook cho luồng chuyển khoản. Loại bỏ bước `PENDING_APPROVAL` cho luồng BANK_TRANSFER.

## Impact

- **Database**: Thêm bảng `Bill`, `BankTransaction`. Cập nhật bảng `Payment` thêm relation tới `Bill`.
- **API**: Thêm endpoint public `POST /api/v1/webhooks/sepay`. Thêm endpoint quản lý bill cho staff/admin. Sửa đổi behavior của `POST /payments/initiate` với `BANK_TRANSFER`.
- **Cron**: Thêm scheduled job `SepayReconciliationCron` chạy mỗi 15 phút.
- **Environment**: Thêm biến môi trường `SEPAY_WEBHOOK_SECRET`, `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`.
- **Frontend**: Cập nhật trang booking/payment để hiển thị mã thanh toán và hướng dẫn chuyển khoản thay vì form upload biên lai. Bỏ UI duyệt biên lai ở staff dashboard.
