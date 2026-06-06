## ADDED Requirements

### Requirement: Staff Duyệt Yêu Cầu Đặt Chỗ

Hệ thống PHẢI (SHALL) cho receptionist/admin xử lý queue yêu cầu đặt chỗ trước thanh toán.

#### Scenario: Liệt kê yêu cầu đặt chỗ chờ duyệt

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/bookings/staff/approval-requests`
- **THÌ** API PHẢI trả booking `PENDING_HOST_APPROVAL` theo `createdAt` tăng dần
- **VÀ** include customer summary, room, room type, branch, room status, approval deadline và conversation summary.

#### Scenario: Kiểm tra trạng thái phòng trong queue duyệt

- **CHO** staff đang xem một yêu cầu đặt chỗ
- **KHI** response queue được trả về
- **THÌ** mỗi item PHẢI cho biết phòng đang `AVAILABLE`, `RESERVED`, `OCCUPIED`, `DIRTY`, `CLEANING` hoặc `MAINTENANCE`
- **VÀ** cho biết có booking active overlap khác hay không.

#### Scenario: Receptionist duyệt yêu cầu đặt chỗ

- **CHO** receptionist đã đăng nhập
- **VÀ** booking ở `PENDING_HOST_APPROVAL`
- **KHI** post `/bookings/:id/approve-request`
- **THÌ** booking PHẢI thành `PENDING_PAYMENT`
- **VÀ** user nhận notification yêu cầu thanh toán.

#### Scenario: Admin từ chối yêu cầu đặt chỗ

- **CHO** admin đã đăng nhập
- **VÀ** booking ở `PENDING_HOST_APPROVAL`
- **KHI** post `/bookings/:id/reject-request` với reason
- **THÌ** booking PHẢI thành `REJECTED`
- **VÀ** user nhận notification từ chối.

#### Scenario: Housekeeping không được duyệt yêu cầu

- **CHO** housekeeping đã đăng nhập
- **KHI** gọi endpoint duyệt hoặc từ chối yêu cầu đặt chỗ
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Staff Chat Với Khách Trong Lúc Chờ Duyệt

Hệ thống PHẢI (SHALL) cho receptionist/admin chat với customer ngay từ queue yêu cầu đặt chỗ.

#### Scenario: Mở chat từ pending request

- **CHO** receptionist hoặc admin đang xem request `PENDING_HOST_APPROVAL`
- **KHI** chọn hành động chat
- **THÌ** hệ thống PHẢI mở conversation gắn với booking
- **VÀ** assign staff hiện tại nếu conversation chưa có staff.

#### Scenario: Chat không làm đổi trạng thái booking

- **CHO** conversation gắn với booking `PENDING_HOST_APPROVAL`
- **KHI** staff hoặc customer gửi message
- **THÌ** booking status PHẢI giữ nguyên.
