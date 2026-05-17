# Tài liệu Mô tả Giao diện (UI Screen Specification)

## 1. Mục tiêu
Mô tả cấu trúc màn hình, thành phần giao diện, hành vi validate và điều hướng để Dev FE/Tester UI có cơ sở thống nhất triển khai.

## 2. Danh sách màn hình
| Mã màn hình | Tên màn hình | Actor |
| --- | --- | --- |
| SCR-01 | Đăng ký | Guest |
| SCR-02 | Đăng nhập | Guest/User |
| SCR-03 | Tìm kiếm phòng | Guest/Customer |
| SCR-04 | Chi tiết phòng | Guest/Customer |
| SCR-05 | Form đặt phòng | Customer |
| SCR-06 | Thanh toán | Customer |
| SCR-07 | Lịch sử booking | Customer |
| SCR-08 | Chi tiết booking | Customer/Staff/Admin |
| SCR-09 | Room map vận hành | Staff/Housekeeping/Admin |
| SCR-10 | Quản trị inventory/giá | Admin |
| SCR-11 | Báo cáo | Admin |

## 3. Đặc tả màn hình trọng yếu

### 3.1 SCR-02 - Đăng nhập
- **Field:** email, password.
- **Control:** checkbox ghi nhớ đăng nhập, nút đăng nhập, link quên mật khẩu.
- **Validate:**
  - Email bắt buộc, đúng định dạng.
  - Password bắt buộc.
- **Error message đề xuất:**
  - `Email không hợp lệ.`
  - `Vui lòng nhập mật khẩu.`
  - `Thông tin đăng nhập không đúng.`
- **Điều hướng:** thành công -> trang phù hợp role.

### 3.2 SCR-03 - Tìm kiếm phòng
- **Field:** check-in date, check-out date, số khách, khoảng giá, loại phòng, tiện nghi.
- **Button:** Tìm kiếm, Xóa bộ lọc.
- **Hiển thị:** danh sách card phòng gồm ảnh, tên, sức chứa, giá/đêm, trạng thái khả dụng.
- **Validate:** check-out > check-in; check-in không nhỏ hơn ngày hiện tại.

### 3.3 SCR-05 - Form đặt phòng
- **Field bắt buộc:** họ tên, email, số điện thoại, thông tin lưu trú.
- **Section:** tóm tắt booking, điều khoản sử dụng, tổng tiền tạm tính.
- **Button:** Xác nhận đặt phòng.
- **Hành vi:** submit thành công hiển thị booking code và điều hướng thanh toán.

### 3.4 SCR-09 - Room map
- **Bộ lọc:** tầng, khu vực, trạng thái phòng.
- **Legend trạng thái:** Available, Reserved, Occupied, Dirty, Cleaning, Maintenance.
- **Tương tác:** click phòng để mở popup thao tác nhanh (check-in/check-out/cập nhật trạng thái).

## 4. Quy tắc UI/UX chung
- Field bắt buộc có ký hiệu rõ ràng.
- Disable nút submit trong lúc gửi request để tránh double submit.
- Thông báo lỗi hiển thị gần field và có thông báo tổng quan trên đầu form.
- Responsive: hỗ trợ tối thiểu breakpoint mobile 360px, tablet 768px, desktop >= 1280px.

## 5. Điều hướng tổng quan
`Trang chủ -> Tìm kiếm -> Chi tiết phòng -> Đặt phòng -> Thanh toán -> Kết quả -> Lịch sử`

## 6. Tiêu chí kiểm thử UI
- Kiểm tra field bắt buộc, placeholder, định dạng dữ liệu.
- Kiểm tra trạng thái loading/disabled của button.
- Kiểm tra điều hướng sau hành động thành công/thất bại.
- Kiểm tra hiển thị trên mobile/tablet/desktop.
