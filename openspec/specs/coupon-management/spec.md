# coupon-management Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể xem danh sách coupon
Hệ thống SHALL cho phép Admin xem tất cả coupon (kể cả inactive). Mỗi coupon hiển thị: mã, loại giảm giá (percentage/fixed), giá trị, ngày hết hạn, số lần đã dùng, trạng thái active.

#### Scenario: Xem danh sách coupon thành công
- **WHEN** Admin gọi GET /api/v1/coupons/admin
- **THEN** hệ thống trả về danh sách coupon kể cả inactive

### Requirement: Admin có thể tạo coupon mới
Hệ thống SHALL cho phép Admin tạo coupon mới với thông tin: mã code, loại giảm giá (percentage/fixed amount), giá trị, số lượng, ngày hết hạn, điều kiện áp dụng (tối thiểu, loại phòng...).

#### Scenario: Tạo coupon thành công
- **WHEN** Admin gửi POST /api/v1/coupons/admin với thông tin hợp lệ
- **THEN** hệ thống tạo coupon mới và trả về thông tin

#### Scenario: Tạo coupon với mã đã tồn tại
- **WHEN** Admin gửi POST /api/v1/coupons/admin với mã code đã tồn tại
- **THEN** hệ thống trả về lỗi

### Requirement: Admin có thể vô hiệu hóa coupon
Hệ thống SHALL cho phép Admin vô hiệu hóa coupon (soft delete).

#### Scenario: Vô hiệu hóa coupon
- **WHEN** Admin gửi PATCH/DELETE coupon để vô hiệu hóa
- **THEN** hệ thống set isActive = false

### Requirement: Coupon công khai cho khách hàng
Hệ thống SHALL cho phép coupon được công khai (gắn user) để khách hàng có thể lưu và sử dụng.

#### Scenario: Khách hàng lưu coupon công khai
- **WHEN** Khách hàng gọi POST /api/v1/coupons/:id/claim
- **THEN** hệ thống gắn coupon vào tài khoản khách hàng

#### Scenario: Áp dụng coupon khi đặt phòng
- **WHEN** Khách hàng gọi POST /api/v1/coupons/apply với mã coupon
- **THEN** hệ thống tính giảm giá và trả về số tiền được giảm

