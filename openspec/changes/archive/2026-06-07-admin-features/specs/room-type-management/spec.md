## ADDED Requirements

### Requirement: Admin có thể xem danh sách loại phòng
Hệ thống SHALL cho phép Admin xem danh sách tất cả loại phòng (kể cả loại đã bị vô hiệu hóa) với các thông tin: tên loại phòng, diện tích, tiện nghi, số lượng phòng, trạng thái active.

#### Scenario: Xem danh sách loại phòng thành công
- **WHEN** Admin vào trang "Quản lý loại phòng" hoặc gọi GET /api/v1/rooms/types
- **THEN** hệ thống trả về danh sách loại phòng kèm pricing rules

#### Scenario: Lọc danh sách loại phòng (includeInactive)
- **WHEN** Admin gọi GET /api/v1/rooms/types?includeInactive=true
- **THEN** hệ thống trả về tất cả loại phòng kể cả loại đã inactive

### Requirement: Admin có thể tạo loại phòng mới
Hệ thống SHALL cho phép Admin tạo loại phòng mới với các thông tin: tên loại phòng, diện tích, tiện nghi (JSON), ảnh, số lượng phòng.

#### Scenario: Tạo loại phòng thành công
- **WHEN** Admin gửi POST /api/v1/rooms/types với đầy đủ thông tin hợp lệ
- **THEN** hệ thống tạo loại phòng mới và các phòng con tương ứng với số lượng, trả về thông tin loại phòng đã tạo

#### Scenario: Tạo loại phòng với tên đã tồn tại
- **WHEN** Admin gửi POST /api/v1/rooms/types với tên loại phòng đã tồn tại
- **THEN** hệ thống trả về lỗi và không tạo loại phòng

### Requirement: Admin có thể sửa thông tin loại phòng
Hệ thống SHALL cho phép Admin cập nhật thông tin loại phòng: tên, diện tích, tiện nghi, ảnh.

#### Scenario: Sửa loại phòng thành công
- **WHEN** Admin gửi PATCH /api/v1/rooms/types/:id với thông tin hợp lệ
- **THEN** hệ thống cập nhật thông tin và trả về kết quả thành công

### Requirement: Admin có thể xóa (vô hiệu hóa) loại phòng
Hệ thống SHALL cho phép Admin vô hiệu hóa loại phòng. Nếu loại phòng đang có booking active (PENDING_PAYMENT, PAYING, CONFIRMED, CHECKED_IN), hệ thống SHALL không cho xóa và set isActive = false.

#### Scenario: Xóa loại phòng không có booking active
- **WHEN** Admin gửi DELETE /api/v1/rooms/types/:id và loại phòng không có booking active
- **THEN** hệ thống set isActive = false và trả về thành công

#### Scenario: Xóa loại phòng có booking active
- **WHEN** Admin gửi DELETE /api/v1/rooms/types/:id và loại phòng đang có booking active
- **THEN** hệ thống trả về lỗi kèm cảnh báo

### Requirement: Admin có thể xem chi tiết loại phòng
Hệ thống SHALL cho phép Admin xem chi tiết một loại phòng kèm danh sách pricing rules.

#### Scenario: Xem chi tiết loại phòng thành công
- **WHEN** Admin gọi GET /api/v1/rooms/types/:id
- **THEN** hệ thống trả về thông tin loại phòng kèm pricing rules
