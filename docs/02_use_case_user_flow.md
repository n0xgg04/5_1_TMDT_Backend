# Tài liệu Use Case và User Flow

## 1. Mục tiêu
Mô tả luồng sử dụng hệ thống theo từng actor, giúp BA chuẩn hóa nghiệp vụ, Dev triển khai đúng flow và Tester thiết kế kịch bản end-to-end.

## 2. Danh sách use case
| Mã | Tên use case | Actor chính | Độ ưu tiên |
| --- | --- | --- | --- |
| UC-01 | Đăng ký tài khoản | Guest | Cao |
| UC-02 | Đăng nhập | Guest/Customer/Staff/Admin | Cao |
| UC-03 | Tìm kiếm và lọc phòng | Guest/Customer | Cao |
| UC-04 | Tạo booking | Customer | Cao |
| UC-05 | Thanh toán booking | Customer + Payment Gateway | Cao |
| UC-06 | Xem lịch sử và chi tiết booking | Customer | Cao |
| UC-07 | Hủy booking | Customer/Admin | Trung bình |
| UC-08 | Check-in | Staff | Cao |
| UC-09 | Check-out | Staff | Cao |
| UC-10 | Cập nhật trạng thái phòng | Staff/Housekeeping | Cao |
| UC-11 | Quản lý inventory và giá phòng | Admin | Cao |
| UC-12 | Xem báo cáo vận hành | Admin | Trung bình |

## 3. Use case chi tiết

### UC-04: Tạo booking
- **Mục tiêu:** tạo đơn đặt phòng hợp lệ và giữ phòng tạm thời.
- **Tiền điều kiện:** user đã đăng nhập; phòng đang khả dụng.
- **Hậu điều kiện:** booking được tạo ở trạng thái `PendingPayment`, có hạn thanh toán.

#### Luồng chính
1. User chọn phòng từ danh sách tìm kiếm.
2. User nhập thông tin liên hệ và xác nhận điều khoản.
3. Hệ thống kiểm tra lại availability theo khoảng ngày.
4. Hệ thống tính tổng tiền theo pricing rule hiệu lực.
5. Hệ thống tạo booking + giữ inventory tạm thời.
6. Hệ thống trả về mã booking và chuyển sang bước thanh toán.

#### Luồng thay thế/ngoại lệ
- **A1:** Phòng vừa hết chỗ -> trả lỗi `BOOKING_CONFLICT`.
- **A2:** Giá thay đổi tại thời điểm đặt -> trả giá mới và yêu cầu xác nhận lại.
- **A3:** Dữ liệu đầu vào sai -> trả lỗi `VALIDATION_*`.

### UC-05: Thanh toán booking
- **Mục tiêu:** ghi nhận thanh toán thành công và cập nhật trạng thái đơn.
- **Tiền điều kiện:** booking tồn tại và đang `PendingPayment`.
- **Hậu điều kiện:** booking chuyển `Paid` nếu thanh toán thành công.

#### Luồng chính
1. User chọn phương thức thanh toán.
2. Hệ thống tạo transaction và chuyển hướng sang gateway.
3. User xác nhận thanh toán tại gateway.
4. Gateway gọi callback về hệ thống.
5. Hệ thống verify chữ ký callback.
6. Hệ thống cập nhật transaction và booking.
7. Hệ thống gửi thông báo kết quả cho user.

#### Ngoại lệ
- Callback không hợp lệ chữ ký -> từ chối cập nhật, ghi audit.
- Callback lặp -> xử lý idempotent, không nhân bản giao dịch.
- Booking đã timeout khi callback về -> chuyển luồng đối soát tranh chấp.

### UC-08: Check-in
- **Tiền điều kiện:** booking `Paid`, chưa check-in, phòng sẵn sàng nhận khách.
- **Luồng chính:** Staff tìm booking -> xác minh khách -> xác nhận check-in -> booking `CheckedIn`, phòng `Occupied`.
- **Ngoại lệ:** booking chưa thanh toán đủ, booking đã hủy, phòng đang `Maintenance`.

### UC-09: Check-out
- **Tiền điều kiện:** booking đang `CheckedIn`.
- **Luồng chính:** Staff tổng hợp tiền phòng + dịch vụ phát sinh -> xác nhận check-out -> booking `Completed`, phòng `Dirty`.
- **Ngoại lệ:** còn công nợ/chưa hoàn tất thanh toán phụ phí.

## 4. User flow theo vai trò

### 4.1 Customer flow
`Landing -> Search -> Room Detail -> Booking Form -> Payment -> Booking Success -> Booking History -> Review`

### 4.2 Staff flow
`Login Staff -> Room Map -> Check-in/Check-out -> Extra Service -> Update Room Status`

### 4.3 Admin flow
`Login Admin -> Inventory -> Pricing Rule -> User & Role -> Reports -> Audit Logs`

## 5. Điểm kiểm thử trọng tâm
- Trạng thái booking chuyển đúng theo từng hành động.
- Luồng timeout và callback trễ không làm sai inventory.
- Role-based access không cho phép thao tác vượt quyền.
