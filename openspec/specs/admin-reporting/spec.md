# Đặc Tả Quản Trị Và Báo Cáo

## Purpose

Định nghĩa báo cáo admin và tổng hợp các quyền quản trị: user/staff, inventory, tài khoản chuyển khoản, coupon, hội thoại và duyệt booking.
## Requirements
### Requirement: Báo Cáo Doanh Thu Admin

Hệ thống PHẢI (SHALL) cho admin xem doanh thu từ payment completed trong khoảng ngày.

#### Scenario: Báo cáo doanh thu theo khoảng ngày

- **CHO** admin đã đăng nhập
- **VÀ** tồn tại payment `COMPLETED` có `paidAt` trong khoảng ngày
- **KHI** gọi `/reports/revenue?from=<date>&to=<date>`
- **THÌ** API PHẢI cộng payment amount thành `total` và `totalRevenue`
- **VÀ** đếm payment completed thành `totalBookings`
- **VÀ** group revenue/count theo tên room type
- **VÀ** trả daily revenue points theo ngày tăng dần.

#### Scenario: Ngày kết thúc inclusive

- **CHO** query `to` là một ngày
- **KHI** tính revenue report
- **THÌ** ngày kết thúc PHẢI được chỉnh về 23:59:59.999 để filter inclusive.

#### Scenario: Tham số groupBy hiện tại

- **CHO** gửi `groupBy=day`, `week` hoặc `month`
- **KHI** tính revenue report
- **THÌ** implementation hiện tại vẫn PHẢI trả `data` theo từng ngày.

#### Scenario: Non-admin xem revenue

- **CHO** user không phải admin đã đăng nhập
- **KHI** gọi `/reports/revenue`
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Báo Cáo Tỷ Lệ Lấp Phòng

Hệ thống PHẢI (SHALL) cho admin tính occupancy theo khoảng ngày.

#### Scenario: Báo cáo occupancy

- **CHO** admin đã đăng nhập
- **KHI** gọi `/reports/occupancy?from=<date>&to=<date>`
- **THÌ** API PHẢI đếm tổng số phòng
- **VÀ** đếm booking ở `CHECKED_IN` hoặc `CHECKED_OUT` có check-in/check-out nằm trong range
- **VÀ** tính số ngày bằng ceiling của chênh lệch ngày
- **VÀ** tính total room nights bằng total rooms nhân số ngày
- **VÀ** tính occupancy rate bằng occupied booking count chia total room nights nhân 100
- **VÀ** làm tròn occupancy rate đến 2 chữ số thập phân.

#### Scenario: Không có room night

- **CHO** total room nights bằng 0
- **KHI** tính occupancy
- **THÌ** occupancy rate PHẢI bằng 0.

### Requirement: Tổng Hợp Trạng Thái Booking

Hệ thống PHẢI (SHALL) cho admin tổng hợp booking theo status trong khoảng ngày tạo.

#### Scenario: Summary status booking

- **CHO** admin đã đăng nhập
- **KHI** gọi `/reports/bookings/summary?from=<date>&to=<date>`
- **THÌ** API PHẢI group booking theo status với `createdAt` trong range inclusive
- **VÀ** trả map từ status sang số lượng.

### Requirement: Admin Quản Lý Nhân Viên

Hệ thống PHẢI (SHALL) cho admin quản lý tài khoản staff.

#### Scenario: Admin tạo staff

- **CHO** admin đã đăng nhập
- **KHI** post `/users/staff` với role staff hợp lệ
- **THÌ** hệ thống PHẢI tạo account active cho receptionist, housekeeping hoặc admin.

#### Scenario: Admin khóa tài khoản

- **CHO** admin đã đăng nhập
- **KHI** patch `/users/:id/toggle-lock` cho user khác
- **THÌ** active state của user PHẢI được toggle.

### Requirement: Admin Quản Lý Inventory

Hệ thống PHẢI (SHALL) cho admin quản lý loại phòng, phòng vật lý và pricing rule.

#### Scenario: Admin quản lý loại phòng

- **CHO** admin đã đăng nhập
- **KHI** gọi endpoint tạo/cập nhật/xóa loại phòng
- **THÌ** thao tác PHẢI được cho phép nếu thỏa các ràng buộc nghiệp vụ của loại phòng.

#### Scenario: Admin quản lý phòng vật lý

- **CHO** admin đã đăng nhập
- **KHI** gọi endpoint tạo/cập nhật/xóa phòng
- **THÌ** thao tác PHẢI được cho phép nếu thỏa các ràng buộc nghiệp vụ của phòng.

#### Scenario: Admin quản lý quy tắc giá

- **CHO** admin đã đăng nhập
- **KHI** gọi endpoint tạo/xóa pricing rule
- **THÌ** thao tác PHẢI được cho phép nếu thỏa ràng buộc tồn tại của pricing rule.

### Requirement: Admin Quản Lý Tài Khoản Chuyển Khoản

Hệ thống PHẢI (SHALL) cho admin quản lý tài khoản ngân hàng dùng cho payment chuyển khoản.

#### Scenario: Admin tạo payment method info

- **CHO** admin đã đăng nhập
- **KHI** post thông tin tài khoản ngân hàng
- **THÌ** hệ thống PHẢI lưu tài khoản để public trong luồng chuyển khoản khi active.

#### Scenario: Admin xem tài khoản inactive

- **CHO** admin đã đăng nhập
- **KHI** gọi `/payment-methods/admin`
- **THÌ** response PHẢI bao gồm cả bản ghi inactive.

### Requirement: Admin Quản Lý Coupon

Hệ thống PHẢI (SHALL) cho admin tạo và xem coupon dùng trong luồng khuyến mãi.

#### Scenario: Admin tạo coupon

- **CHO** admin đã đăng nhập
- **KHI** post `/coupons/admin`
- **THÌ** coupon PHẢI được lưu với code chuẩn hóa và default value theo service.

#### Scenario: Admin xem toàn bộ coupon

- **CHO** admin đã đăng nhập
- **KHI** gọi `/coupons/admin`
- **THÌ** mọi coupon PHẢI được trả về, không phụ thuộc active/current status.

### Requirement: Admin Xử Lý Hội Thoại

Hệ thống PHẢI (SHALL) cho admin tham gia workflow hỗ trợ giống receptionist.

#### Scenario: Admin xem danh sách hội thoại

- **CHO** admin đã đăng nhập
- **KHI** gọi `/chat/staff/conversations`
- **THÌ** admin PHẢI xem được queue hội thoại staff.

#### Scenario: Admin resolve hội thoại

- **CHO** admin đã đăng nhập
- **KHI** post `/chat/staff/conversations/:id/resolve`
- **THÌ** conversation PHẢI được đánh dấu `resolved`.

### Requirement: Admin Duyệt Booking

Hệ thống PHẢI (SHALL) cho admin duyệt hoặc từ chối booking chuyển khoản đang chờ.

#### Scenario: Admin duyệt booking chuyển khoản

- **CHO** admin đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **KHI** post `/bookings/:id/approve`
- **THÌ** booking PHẢI được confirmed và lưu id admin là người duyệt.

#### Scenario: Admin từ chối booking chuyển khoản

- **CHO** admin đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **KHI** post `/bookings/:id/reject` với reason
- **THÌ** booking PHẢI bị rejected và reason được lưu.

### Requirement: Admin Theo Dõi Luồng Duyệt Booking

Hệ thống PHẢI (SHALL) cho admin nhìn được số lượng booking theo các trạng thái mới của luồng duyệt trước thanh toán.

#### Scenario: Summary bao gồm chờ duyệt yêu cầu đặt chỗ

- **CHO** có booking ở `PENDING_HOST_APPROVAL`
- **KHI** admin gọi `/reports/bookings/summary`
- **THÌ** response PHẢI bao gồm key `PENDING_HOST_APPROVAL` với số lượng tương ứng.

#### Scenario: Summary phân biệt chờ duyệt và chờ thanh toán

- **CHO** có booking `PENDING_HOST_APPROVAL` và booking `PENDING_PAYMENT`
- **KHI** admin xem dashboard booking summary
- **THÌ** hệ thống PHẢI hiển thị hai nhóm riêng: chờ duyệt yêu cầu và chờ thanh toán.

#### Scenario: Revenue không tính request chưa thanh toán

- **CHO** booking ở `PENDING_HOST_APPROVAL` hoặc `PENDING_PAYMENT`
- **KHI** admin gọi báo cáo doanh thu
- **THÌ** các booking này KHÔNG được tính vào doanh thu
- **VÀ** chỉ payment `COMPLETED` mới được cộng doanh thu như hiện tại.

### Requirement: Admin Theo Dõi SLA Duyệt Yêu Cầu

Hệ thống PHẢI (SHALL) cho admin xem các yêu cầu đặt chỗ gần hết hạn duyệt để xử lý kịp trong 24 giờ.

#### Scenario: Đếm yêu cầu sắp hết hạn

- **CHO** có booking `PENDING_HOST_APPROVAL` có `approvalDeadline` trong tương lai gần
- **KHI** admin xem dashboard hoặc queue duyệt
- **THÌ** hệ thống PHẢI hiển thị số lượng hoặc nhãn cảnh báo yêu cầu sắp hết hạn.

#### Scenario: Không cảnh báo yêu cầu đã xử lý

- **CHO** booking đã chuyển khỏi `PENDING_HOST_APPROVAL`
- **KHI** admin xem cảnh báo SLA
- **THÌ** booking đó KHÔNG được tính vào nhóm sắp hết hạn duyệt.

