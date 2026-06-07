# cron-auto-expire Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Hệ thống tự động hết hạn booking quá hạn thanh toán
Hệ thống SHALL cung cấp endpoint internal POST /api/v1/internal/cron/expire-bookings được bảo vệ bởi CRON_SECRET. Endpoint này SHALL truy vấn các booking có status = PENDING_PAYMENT và paymentDeadline < now, sau đó chuyển sang EXPIRED và giải phóng phòng.

#### Scenario: Cron job chạy thành công
- **WHEN** Cron job gọi POST /api/v1/internal/cron/expire-bookings với CRON_SECRET hợp lệ
- **THEN** hệ thống xử lý tất cả booking quá hạn và trả về { processed: N }

### Requirement: Cron job có cơ chế chống chạy trùng (distributed lock)
Hệ thống SHALL sử dụng Redis lock (SETNX) để đảm bảo chỉ một instance xử lý cron job tại một thời điểm. Lock key = "cron:booking:expire" với TTL 50 giây.

#### Scenario: Lock acquired
- **WHEN** Instance đầu tiên lấy được lock
- **THEN** instance đó xử lý booking và release lock sau khi hoàn thành

#### Scenario: Lock not acquired
- **WHEN** Instance thứ hai gọi cron job khi lock đang được giữ
- **THEN** hệ thống trả về { skipped: true }

### Requirement: Cron job không xử lý booking đang trong quá trình thanh toán
Hệ thống SHALL bỏ qua các booking có status = PAYING (đang xử lý thanh toán, callback chưa về).

#### Scenario: Bỏ qua booking đang PAYING
- **WHEN** Cron job truy vấn booking quá hạn
- **THEN** chỉ xử lý booking có status = PENDING_PAYMENT, bỏ qua PAYING

### Requirement: Cron job emit event khi hết hạn booking
Sau khi xử lý mỗi booking, hệ thống SHALL emit event "booking.expired" để các module khác (notification, email) xử lý.

#### Scenario: Emit event sau khi hết hạn
- **WHEN** Cron job hết hạn một booking
- **THEN** hệ thống emit event "booking.expired" kèm bookingId

