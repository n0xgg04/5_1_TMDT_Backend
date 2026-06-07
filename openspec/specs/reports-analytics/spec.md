# reports-analytics Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể xem báo cáo doanh thu
Hệ thống SHALL cho phép Admin xem báo cáo doanh thu theo khoảng thời gian, có groupBy theo ngày/tuần/tháng. Báo cáo hiển thị: tổng doanh thu, doanh thu theo ngày, doanh thu theo loại phòng.

#### Scenario: Xem báo cáo doanh thu thành công
- **WHEN** Admin gọi GET /api/v1/reports/revenue?from=...&to=...&groupBy=day
- **THEN** hệ thống trả về { total, byRoomType, data: [{date, revenue}] }

#### Scenario: Xem báo cáo doanh thu theo tuần
- **WHEN** Admin gọi GET /api/v1/reports/revenue?from=...&to=...&groupBy=week
- **THEN** hệ thống trả về doanh thu gộp theo tuần

### Requirement: Admin có thể xem báo cáo tỷ lệ lấp phòng (occupancy)
Hệ thống SHALL cho phép Admin xem báo cáo occupancy rate theo khoảng thời gian. Chỉ số: totalRooms, totalRoomNights, occupiedNights, occupancyRate (%).

#### Scenario: Xem báo cáo occupancy thành công
- **WHEN** Admin gọi GET /api/v1/reports/occupancy?from=...&to=...
- **THEN** hệ thống trả về { totalRooms, totalRoomNights, occupiedNights, occupancyRate }

### Requirement: Admin có thể xem tổng hợp trạng thái booking
Hệ thống SHALL cho phép Admin xem tổng hợp số lượng booking theo từng trạng thái trong khoảng thời gian.

#### Scenario: Xem tổng hợp trạng thái booking
- **WHEN** Admin gọi GET /api/v1/reports/bookings/summary?from=...&to=...
- **THEN** hệ thống trả về object với key là trạng thái, value là số lượng

### Requirement: Admin có thể xuất báo cáo ra file
Hệ thống SHALL hỗ trợ xuất báo cáo ra file CSV (và sau đó là Excel/PDF).

#### Scenario: Xuất báo cáo CSV
- **WHEN** Admin yêu cầu xuất báo cáo định dạng CSV
- **THEN** hệ thống tạo file CSV và trả về link tải

