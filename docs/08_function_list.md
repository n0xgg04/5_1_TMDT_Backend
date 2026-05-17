# Tài liệu Danh sách Chức năng (Functional List)

## 1. Mục tiêu
Liệt kê đầy đủ module và chức năng chi tiết để làm baseline mapping cho BA, Dev, Tester và PM.

## 2. Cấu trúc module
| Module | Mục tiêu | Đối tượng dùng |
| --- | --- | --- |
| Auth & Profile | Quản lý định danh và thông tin tài khoản | Guest/Customer/Staff/Admin |
| Room Discovery | Tìm và chọn phòng phù hợp | Guest/Customer |
| Booking & Payment | Tạo đơn, thanh toán, cập nhật giao dịch | Customer |
| Booking Lifecycle | Theo dõi và xử lý vòng đời booking | Customer/Staff/Admin/System |
| Operations | Tác nghiệp tại khách sạn | Staff/Housekeeping |
| Admin Management | Quản trị dữ liệu và cấu hình | Admin |
| Reporting | Báo cáo kinh doanh và vận hành | Admin |
| Notification & Scheduler | Tự động hóa thông báo và timeout | System/Admin |

## 3. Danh sách chức năng chi tiết

### 3.1 Auth & Profile
- Đăng ký tài khoản bằng email.
- Đăng nhập và cấp token phiên.
- Cập nhật hồ sơ cá nhân.
- Khóa/mở khóa tài khoản (admin).

### 3.2 Room Discovery
- Tìm kiếm phòng theo ngày ở.
- Lọc theo loại phòng, giá, tiện nghi, sức chứa.
- Xem chi tiết phòng và chính sách liên quan.

### 3.3 Booking & Payment
- Tạo booking và giữ chỗ tạm thời.
- Khởi tạo thanh toán qua gateway.
- Nhận callback và cập nhật trạng thái thanh toán.

### 3.4 Booking Lifecycle
- Xem lịch sử booking theo user.
- Hủy booking theo chính sách.
- Theo dõi trạng thái từ tạo đơn đến hoàn tất/hủy.

### 3.5 Operations
- Xem room map theo tầng/khu vực.
- Check-in/check-out booking.
- Cập nhật trạng thái phòng.
- Ghi nhận dịch vụ phát sinh.

### 3.6 Admin Management
- CRUD room type, room, tiện nghi.
- Cấu hình pricing rules theo mùa/sự kiện.
- Quản trị tài khoản staff và phân quyền.

### 3.7 Reporting
- Báo cáo doanh thu theo kỳ.
- Báo cáo occupancy theo ngày/tuần/tháng.
- Phân tích doanh thu theo loại phòng/kênh thanh toán.

### 3.8 Notification & Scheduler
- Gửi email xác nhận đặt phòng/thanh toán.
- Gửi nhắc nhở trước hạn thanh toán.
- Tự động hủy booking quá hạn thanh toán.

## 4. Mapping chức năng cho tester
| Module | Loại testcase ưu tiên |
| --- | --- |
| Auth | Positive/Negative/Brute-force/Session |
| Booking | Concurrency/Boundary/State transition |
| Payment | Callback/Error/Idempotency |
| Operations | Workflow end-to-end theo vai trò |
| Admin | RBAC/Audit/Validation |
