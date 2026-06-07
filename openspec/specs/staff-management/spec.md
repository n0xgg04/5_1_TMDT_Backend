# staff-management Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể xem danh sách nhân viên
Hệ thống SHALL cho phép Admin xem danh sách nhân viên (role = RECEPTIONIST, HOUSEKEEPING, ADMIN) với phân trang và filter theo role. Mỗi nhân viên hiển thị: email, tên, vai trò, trạng thái active.

#### Scenario: Xem danh sách nhân viên thành công
- **WHEN** Admin gọi GET /api/v1/users?role=&page=&limit=
- **THEN** hệ thống trả về danh sách nhân viên phân trang

#### Scenario: Lọc nhân viên theo role
- **WHEN** Admin gọi GET /api/v1/users?role=RECEPTIONIST
- **THEN** hệ thống trả về danh sách nhân viên có role RECEPTIONIST

### Requirement: Admin có thể tạo tài khoản nhân viên mới
Hệ thống SHALL cho phép Admin tạo tài khoản nhân viên mới với email, tên, mật khẩu, vai trò (RECEPTIONIST/HOUSEKEEPING/ADMIN), số điện thoại. Mật khẩu SHALL được hash bằng bcrypt (12 rounds).

#### Scenario: Tạo nhân viên thành công
- **WHEN** Admin gửi POST /api/v1/users/staff với thông tin hợp lệ
- **THEN** hệ thống tạo tài khoản, hash mật khẩu, và trả về thông tin (không bao gồm password hash)

#### Scenario: Tạo nhân viên với email đã tồn tại
- **WHEN** Admin gửi POST /api/v1/users/staff với email đã tồn tại
- **THEN** hệ thống trả về lỗi

### Requirement: Admin có thể khóa/mở khóa tài khoản nhân viên
Hệ thống SHALL cho phép Admin khóa hoặc mở khóa tài khoản nhân viên. Admin SHALL KHÔNG thể tự khóa chính mình.

#### Scenario: Khóa tài khoản nhân viên khác
- **WHEN** Admin gửi PATCH /api/v1/users/:id/toggle-lock với tài khoản khác
- **THEN** hệ thống toggle trạng thái isActive và trả về thành công

#### Scenario: Tự khóa chính mình
- **WHEN** Admin gửi PATCH /api/v1/users/:id/toggle-lock với chính id của mình
- **THEN** hệ thống trả về lỗi, không cho phép tự khóa

