# Đặc Tả Vận Hành Nhân Viên

## Purpose

Định nghĩa sơ đồ phòng, cập nhật trạng thái phòng, xử lý booking của staff, dịch vụ phát sinh, hội thoại hỗ trợ và quyền của receptionist/housekeeping/admin.

## Requirements

### Requirement: Sơ Đồ Phòng Staff

Hệ thống PHẢI (SHALL) cho receptionist, housekeeping và admin xem sơ đồ phòng với thông tin phòng và booking active gần nhất.

#### Scenario: Xem sơ đồ phòng

- **CHO** user role `RECEPTIONIST`, `HOUSEKEEPING` hoặc `ADMIN` đã đăng nhập
- **KHI** gọi `/staff/room-map`
- **THÌ** API PHẢI trả phòng theo tầng tăng dần rồi số phòng tăng dần
- **VÀ** include tên loại phòng và sức chứa
- **VÀ** include booking mới nhất ở `CONFIRMED` hoặc `CHECKED_IN` kèm họ, tên và số điện thoại customer.

#### Scenario: Xem sơ đồ phòng theo tầng

- **CHO** có query `floor`
- **KHI** gọi `/staff/room-map?floor=<floor>`
- **THÌ** API PHẢI chỉ trả phòng thuộc tầng đó.

#### Scenario: Customer không được xem room map staff

- **CHO** customer đã đăng nhập
- **KHI** gọi `/staff/room-map`
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Cập Nhật Trạng Thái Phòng Staff

Hệ thống PHẢI (SHALL) cho staff role cập nhật trạng thái vận hành của phòng.

#### Scenario: Cập nhật trạng thái phòng

- **CHO** user role `RECEPTIONIST`, `HOUSEKEEPING` hoặc `ADMIN` đã đăng nhập
- **VÀ** phòng tồn tại
- **KHI** patch `/staff/room-map/:roomId` với status
- **THÌ** hệ thống PHẢI cập nhật room status và trả phòng kèm room type.

#### Scenario: Cập nhật phòng không tồn tại

- **CHO** room id không tồn tại
- **KHI** cập nhật status
- **THÌ** API PHẢI từ chối với `Phòng không tồn tại`.

#### Scenario: Housekeeping chuyển phòng bẩn sang đang dọn

- **CHO** housekeeping xem phòng `DIRTY`
- **KHI** patch status thành `CLEANING`
- **THÌ** room status PHẢI thành `CLEANING`.

#### Scenario: Housekeeping đánh dấu phòng sẵn sàng

- **CHO** housekeeping đã dọn xong
- **KHI** patch status thành `AVAILABLE`
- **THÌ** room status PHẢI thành `AVAILABLE`.

### Requirement: Check-In Và Check-Out Của Staff

Hệ thống PHẢI (SHALL) cho receptionist/admin check-in và check-out qua booking endpoints.

#### Scenario: Receptionist check-in booking confirmed

- **CHO** receptionist đã đăng nhập
- **VÀ** booking status `CONFIRMED`
- **KHI** post `/bookings/:id/checkin`
- **THÌ** booking PHẢI thành `CHECKED_IN`
- **VÀ** room PHẢI thành `OCCUPIED`.

#### Scenario: Admin check-out booking checked-in

- **CHO** admin đã đăng nhập
- **VÀ** booking status `CHECKED_IN`
- **KHI** post `/bookings/:id/checkout`
- **THÌ** booking PHẢI thành `CHECKED_OUT`
- **VÀ** room PHẢI thành `DIRTY`.

#### Scenario: Housekeeping không được check-in/out

- **CHO** housekeeping đã đăng nhập
- **KHI** gọi endpoint check-in hoặc checkout
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Duyệt Booking Chờ Xác Nhận

Hệ thống PHẢI (SHALL) cho receptionist/admin duyệt hoặc từ chối booking đã upload biên lai.

#### Scenario: Staff xem booking pending approval

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/bookings/staff/pending`
- **THÌ** API PHẢI trả booking chờ duyệt kèm customer, room, room type, payment và attachment.

#### Scenario: Receptionist duyệt booking chuyển khoản

- **CHO** receptionist đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **KHI** post `/bookings/:id/approve`
- **THÌ** booking PHẢI thành `CONFIRMED`
- **VÀ** room PHẢI thành `RESERVED`.

#### Scenario: Receptionist từ chối booking chuyển khoản

- **CHO** receptionist đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **KHI** post `/bookings/:id/reject` với reason
- **THÌ** booking PHẢI thành `REJECTED`
- **VÀ** reason PHẢI được lưu.

### Requirement: Dịch Vụ Phát Sinh Của Staff

Hệ thống PHẢI (SHALL) cho staff role quản lý addon charge cho booking checked-in.

#### Scenario: Thêm addon

- **CHO** staff-role user đã đăng nhập
- **VÀ** booking ở `CHECKED_IN`
- **KHI** tạo addon với tên dịch vụ, số lượng, đơn giá và note tùy chọn
- **THÌ** addon PHẢI lưu `addedBy` bằng id staff hiện tại
- **VÀ** booking total amount PHẢI tăng theo total addon.

#### Scenario: Cập nhật addon

- **CHO** addon tồn tại
- **KHI** staff patch quantity hoặc note
- **THÌ** quantity/note PHẢI cập nhật
- **VÀ** booking total amount PHẢI điều chỉnh theo chênh lệch nếu quantity đổi.

#### Scenario: Xóa addon

- **CHO** addon tồn tại
- **KHI** staff xóa addon
- **THÌ** booking total amount PHẢI giảm theo total addon
- **VÀ** addon row PHẢI bị xóa.

### Requirement: Queue Hội Thoại Staff

Hệ thống PHẢI (SHALL) cho receptionist/admin xem, nhận xử lý, xem chi tiết và resolve hội thoại hỗ trợ.

#### Scenario: Liệt kê hội thoại staff

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/chat/staff/conversations`
- **THÌ** API PHẢI trả hội thoại theo `updatedAt` giảm dần
- **VÀ** include customer summary và message mới nhất.

#### Scenario: Lọc hội thoại theo status

- **CHO** có query status
- **KHI** gọi `/chat/staff/conversations?status=open`
- **THÌ** chỉ hội thoại có status đó PHẢI được trả về.

#### Scenario: Xem chi tiết hội thoại staff

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/chat/staff/conversations/:id`
- **THÌ** API PHẢI trả customer summary và messages theo thời gian tăng dần.

#### Scenario: Assign hội thoại

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** post `/chat/staff/conversations/:id/assign`
- **THÌ** `staffId` của conversation PHẢI set bằng current user id.

#### Scenario: Resolve hội thoại

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** post `/chat/staff/conversations/:id/resolve`
- **THÌ** conversation status PHẢI thành `resolved`.

#### Scenario: Customer không được xem queue staff

- **CHO** customer đã đăng nhập
- **KHI** gọi bất kỳ endpoint `/chat/staff/*`
- **THÌ** API PHẢI từ chối bằng role guard.
