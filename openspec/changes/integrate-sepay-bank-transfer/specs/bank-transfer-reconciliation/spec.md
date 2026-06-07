## ADDED Requirements

### Requirement: Cron Đối Soát Định Kỳ

Hệ thống PHẢI (SHALL) chạy scheduled job mỗi 15 phút để gọi Sepay API lấy danh sách giao dịch, so sánh với database và bổ sung giao dịch thiếu.

#### Scenario: Cron chạy thành công

- **CHO** cron được kích hoạt mỗi 15 phút
- **VÀ** có API key Sepay hợp lệ
- **KHI** cron thực thi
- **THÌ** hệ thống PHẢI gọi Sepay API `/transactions` với khoảng thời gian 15 phút gần nhất
- **VÀ** với mỗi transaction, kiểm tra `gatewayTransactionId` đã tồn tại trong `BankTransaction`
- **VÀ** insert transaction chưa có
- **VÀ** xử lý khớp bill như webhook bình thường.

#### Scenario: Cron không gọi lại transaction đã có

- **CHO** transaction id đã tồn tại trong `BankTransaction`
- **KHI** cron quét về
- **THÌ** hệ thống PHẢI bỏ qua transaction đó.

#### Scenario: Cron gặp lỗi API

- **CHO** Sepay API trả lỗi hoặc timeout
- **KHI** cron thực thi
- **THÌ** hệ thống PHẢI log lỗi
- **VÀ** retry ở lần chạy tiếp theo (15 phút sau).

#### Scenario: Cron không chạy chồng lấn

- **CHO** lần chạy cron trước chưa hoàn tất
- **KHI** đến lịch chạy tiếp theo
- **THÌ** hệ thống PHẢI bỏ qua lần chạy mới
- **VÀ** log cảnh báo.

### Requirement: Cấu Hình Sepay

Hệ thống PHẢI (SHALL) lưu cấu hình Sepay (API key, webhook secret, account number) trong biến môi trường và có fallback an toàn.

#### Scenario: Thiếu cấu hình Sepay

- **CHO** biến môi trường `SEPAY_WEBHOOK_SECRET` hoặc `SEPAY_API_KEY` chưa được set
- **KHI** khởi động ứng dụng
- **THÌ** hệ thống PHẢI log cảnh báo
- **VÀ** webhook endpoint vẫn khả dụng nhưng từ chối mọi request
- **VÀ** cron đối soát bị disable.
