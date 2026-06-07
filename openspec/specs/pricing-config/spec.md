# pricing-config Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể tạo quy tắc giá mới
Hệ thống SHALL cho phép Admin tạo quy tắc giá với các thông tin: loại phòng, loại giá (DEFAULT/SEASONAL/HOLIDAY), giá theo đêm, ngày bắt đầu, ngày kết thúc, priority. Cơ chế ưu tiên: HOLIDAY > SEASONAL > DEFAULT.

#### Scenario: Tạo quy tắc giá thành công
- **WHEN** Admin gửi POST /api/v1/rooms/pricing với thông tin hợp lệ
- **THEN** hệ thống tạo quy tắc giá và trả về thông tin quy tắc đã tạo

#### Scenario: Tạo quy tắc giá trùng ngày
- **WHEN** Admin gửi POST /api/v1/rooms/pricing và khoảng ngày trùng với quy tắc khác
- **THEN** hệ thống tạo thành công và áp dụng cơ chế ưu tiên để giải quyết trùng lặp

### Requirement: Admin có thể xóa quy tắc giá
Hệ thống SHALL cho phép Admin vô hiệu hóa (soft delete) quy tắc giá.

#### Scenario: Xóa quy tắc giá thành công
- **WHEN** Admin gửi DELETE /api/v1/rooms/pricing/:id
- **THEN** hệ thống set isActive = false và trả về thành công

### Requirement: Hệ thống tự động tính giá dựa trên quy tắc giá
Khi khách đặt phòng hoặc xem giá, hệ thống SHALL tính giá dựa trên các quy tắc giá hiện có. Ưu tiên: HOLIDAY > SEASONAL > DEFAULT. Nếu nhiều rule cùng loại và trùng ngày, ưu tiên rule có priority cao hơn hoặc updatedAt mới hơn.

#### Scenario: Tính giá cho khoảng ngày có nhiều loại quy tắc
- **WHEN** khách tìm kiếm phòng trong khoảng ngày có cả HOLIDAY, SEASONAL và DEFAULT
- **THEN** hệ thống tính giá theo HOLIDAY (ưu tiên cao nhất) cho các ngày lễ, SEASONAL cho các ngày trong mùa, DEFAULT cho các ngày còn lại

#### Scenario: Tính giá không có quy tắc nào
- **WHEN** khách tìm kiếm phòng trong khoảng ngày không có quy tắc giá nào
- **THEN** hệ thống báo lỗi hoặc dùng giá mặc định từ room_types

