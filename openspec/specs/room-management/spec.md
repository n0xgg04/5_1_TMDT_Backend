# room-management Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể xem danh sách phòng
Hệ thống SHALL cho phép Admin xem danh sách phòng với filter theo loại phòng (roomTypeId), tầng (floor), chi nhánh (branchId). Mỗi phòng hiển thị: số phòng, tầng, loại phòng, trạng thái, cleaning status.

#### Scenario: Xem danh sách phòng thành công
- **WHEN** Admin gọi GET /api/v1/rooms
- **THEN** hệ thống trả về danh sách phòng kèm thông tin loại phòng và chi nhánh

#### Scenario: Lọc phòng theo loại phòng
- **WHEN** Admin gọi GET /api/v1/rooms?roomTypeId=1
- **THEN** hệ thống trả về danh sách phòng thuộc loại phòng có id=1

#### Scenario: Lọc phòng theo tầng
- **WHEN** Admin gọi GET /api/v1/rooms?floor=2
- **THEN** hệ thống trả về danh sách phòng ở tầng 2

### Requirement: Admin có thể tạo phòng mới
Hệ thống SHALL cho phép Admin tạo phòng mới với thông tin: số phòng, tầng, loại phòng. Số phòng SHALL là duy nhất.

#### Scenario: Tạo phòng thành công
- **WHEN** Admin gửi POST /api/v1/rooms với số phòng chưa tồn tại
- **THEN** hệ thống tạo phòng mới và trả về thông tin phòng

#### Scenario: Tạo phòng với số phòng trùng
- **WHEN** Admin gửi POST /api/v1/rooms với số phòng đã tồn tại
- **THEN** hệ thống trả về lỗi

### Requirement: Admin có thể cập nhật trạng thái phòng
Hệ thống SHALL cho phép Admin cập nhật trạng thái phòng: AVAILABLE, OCCUPIED, DIRTY, CLEANING, MAINTENANCE, RESERVED.

#### Scenario: Cập nhật trạng thái phòng thành công
- **WHEN** Admin gửi PATCH /api/v1/rooms/:id với trạng thái mới
- **THEN** hệ thống cập nhật trạng thái và trả về kết quả

### Requirement: Admin có thể xóa phòng
Hệ thống SHALL cho phép Admin xóa phòng. Nếu phòng đang có khách (OCCUPIED), hệ thống SHALL không cho xóa.

#### Scenario: Xóa phòng không có khách
- **WHEN** Admin gửi DELETE /api/v1/rooms/:id và phòng không có khách
- **THEN** hệ thống xóa phòng và trả về thành công

#### Scenario: Xóa phòng đang có khách
- **WHEN** Admin gửi DELETE /api/v1/rooms/:id và phòng đang OCCUPIED
- **THEN** hệ thống trả về lỗi

### Requirement: Admin có thể xem danh sách chi nhánh
Hệ thống SHALL cung cấp endpoint GET /api/v1/rooms/branches để lấy danh sách chi nhánh khách sạn.

#### Scenario: Xem danh sách chi nhánh thành công
- **WHEN** Admin gọi GET /api/v1/rooms/branches
- **THEN** hệ thống trả về danh sách chi nhánh

