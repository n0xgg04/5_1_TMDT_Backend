# booking-admin Specification

## Purpose
TBD - created by archiving change admin-features. Update Purpose after archive.
## Requirements
### Requirement: Admin có thể xem danh sách booking
Hệ thống SHALL cho phép Admin xem tất cả booking (mọi trạng thái, mọi khách hàng). Hỗ trợ filter theo trạng thái, khoảng thời gian, từ khóa tìm kiếm.

#### Scenario: Xem tất cả booking
- **WHEN** Admin gọi GET /api/v1/bookings (không có filter)
- **THEN** hệ thống trả về danh sách booking phân trang

#### Scenario: Xem chi tiết booking
- **WHEN** Admin gọi GET /api/v1/bookings/:id
- **THEN** hệ thống trả về chi tiết booking kèm thông tin khách hàng, phòng, thanh toán, dịch vụ phát sinh

### Requirement: Admin có thể duyệt booking (PENDING_APPROVAL)
Hệ thống SHALL cho phép Admin duyệt booking đang ở trạng thái PENDING_APPROVAL (sau khi khách upload biên lai). Khi duyệt, hệ thống SHALL kiểm tra conflict về thời gian trước khi chuyển sang CONFIRMED.

#### Scenario: Duyệt booking thành công
- **WHEN** Admin gửi POST /api/v1/bookings/:id/approve và không có conflict
- **THEN** hệ thống chuyển booking sang CONFIRMED, set approvedById, cập nhật phòng RESERVED

#### Scenario: Duyệt booking có conflict
- **WHEN** Admin gửi POST /api/v1/bookings/:id/approve và phòng đã được đặt bởi booking khác
- **THEN** hệ thống trả về lỗi conflict

### Requirement: Admin có thể từ chối booking (PENDING_APPROVAL)
Hệ thống SHALL cho phép Admin từ chối booking PENDING_APPROVAL kèm lý do. Nếu booking đã thanh toán, hệ thống SHALL tự động chuyển payment sang REFUNDED.

#### Scenario: Từ chối booking chưa thanh toán
- **WHEN** Admin gửi POST /api/v1/bookings/:id/reject với lý do
- **THEN** hệ thống chuyển booking sang REJECTED

#### Scenario: Từ chối booking đã thanh toán
- **WHEN** Admin gửi POST /api/v1/bookings/:id/reject và booking đã có payment
- **THEN** hệ thống chuyển booking sang REJECTED và payment sang REFUNDED

### Requirement: Admin có thể check-in
Hệ thống SHALL cho phép Admin thực hiện check-in cho booking ở trạng thái CONFIRMED. Khi check-in: booking → CHECKED_IN, đặt checkInActual, phòng → OCCUPIED. Tất cả SHALL được thực hiện trong một transaction.

#### Scenario: Check-in thành công
- **WHEN** Admin gửi POST /api/v1/bookings/:id/checkin và booking đang CONFIRMED
- **THEN** hệ thống cập nhật booking sang CHECKED_IN và phòng sang OCCUPIED

#### Scenario: Check-in booking không phải CONFIRMED
- **WHEN** Admin gửi POST /api/v1/bookings/:id/checkin và booking không ở trạng thái CONFIRMED
- **THEN** hệ thống trả về lỗi

### Requirement: Admin có thể check-out
Hệ thống SHALL cho phép Admin thực hiện check-out cho booking ở trạng thái CHECKED_IN. Khi check-out: tính tổng tiền (phòng + dịch vụ phát sinh), booking → CHECKED_OUT, đặt checkOutActual, phòng → DIRTY. Tất cả SHALL được thực hiện trong một transaction.

#### Scenario: Check-out thành công
- **WHEN** Admin gửi POST /api/v1/bookings/:id/checkout và booking đang CHECKED_IN
- **THEN** hệ thống tính tổng tiền, cập nhật booking sang CHECKED_OUT, phòng sang DIRTY, emit event checkout.completed

#### Scenario: Check-out booking không phải CHECKED_IN
- **WHEN** Admin gửi POST /api/v1/bookings/:id/checkout và booking không ở trạng thái CHECKED_IN
- **THEN** hệ thống trả về lỗi

