# admin-dashboard Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Dashboard hiển thị KPI tổng quan
Hệ thống SHALL hiển thị Dashboard cho Admin với các KPI cards: tổng doanh thu (kỳ hiện tại), occupancy rate, số booking mới (hôm nay), số khách đang ở.

#### Scenario: Xem Dashboard thành công
- **WHEN** Admin vào trang /admin/dashboard
- **THEN** hệ thống hiển thị 4 KPI cards: Revenue, Occupancy, New Bookings, In-house Guests

### Requirement: Dashboard hiển thị biểu đồ doanh thu
Hệ thống SHALL hiển thị biểu đồ doanh thu theo thời gian (line chart) với dropdown chọn kỳ (7 ngày, 30 ngày, 6 tháng, 1 năm).

#### Scenario: Xem biểu đồ doanh thu
- **WHEN** Admin vào Dashboard
- **THEN** hệ thống hiển thị line chart doanh thu với dữ liệu mặc định 6 tháng gần nhất

#### Scenario: Thay đổi kỳ báo cáo
- **WHEN** Admin chọn kỳ khác trong dropdown
- **THEN** biểu đồ cập nhật dữ liệu tương ứng

### Requirement: Dashboard hiển thị danh sách booking gần đây
Hệ thống SHALL hiển thị danh sách 5 booking gần đây nhất trên Dashboard, kèm nút "View All" để xem toàn bộ.

#### Scenario: Xem booking gần đây
- **WHEN** Admin vào Dashboard
- **THEN** hệ thống hiển thị 5 booking gần đây với thông tin khách hàng, phòng, trạng thái

### Requirement: Dashboard có các nút hành động nhanh
Hệ thống SHALL cung cấp các nút hành động nhanh: "Generate Report", "New Booking" (tạo booking thủ công).

#### Scenario: Click Generate Report
- **WHEN** Admin nhấn "Generate Report"
- **THEN** chuyển đến trang báo cáo

#### Scenario: Click New Booking
- **WHEN** Admin nhấn "New Booking"
- **THEN** mở form tạo booking mới

