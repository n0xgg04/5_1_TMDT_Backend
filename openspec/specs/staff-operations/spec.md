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

### Requirement: Lịch Booking Staff Admin

Hệ thống PHẢI (SHALL) cho receptionist/admin xem lịch booking theo phòng và ngày để nắm lịch thuê, lịch giữ chỗ và lịch chờ duyệt.

#### Scenario: Xem lịch booking theo khoảng ngày

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi endpoint calendar với `from` và `to`
- **THÌ** API PHẢI trả danh sách phòng và booking active overlap trong khoảng ngày đó
- **VÀ** booking PHẢI gồm id, booking code, status, check-in/check-out, customer summary và room summary.

#### Scenario: Calendar phân biệt trạng thái booking

- **CHO** calendar có booking `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED` hoặc `CHECKED_IN`
- **KHI** staff xem lịch
- **THÌ** mỗi booking block PHẢI hiển thị trạng thái bằng màu/nhãn khác nhau
- **VÀ** phải phân biệt rõ chờ duyệt yêu cầu, chờ thanh toán, đang thanh toán, chờ duyệt biên lai, đã xác nhận và đang lưu trú.

#### Scenario: Booking quá hạn không còn giữ lịch

- **CHO** booking `PENDING_HOST_APPROVAL` quá `approvalDeadline`
- **HOẶC** booking `PENDING_PAYMENT` hoặc `PAYING` quá `paymentDeadline`
- **KHI** staff xem calendar
- **THÌ** booking đó KHÔNG được hiển thị như một block đang giữ phòng.

#### Scenario: Điều hướng từ calendar tới xử lý booking

- **CHO** staff click một booking block trên calendar
- **KHI** booking ở `PENDING_HOST_APPROVAL`
- **THÌ** UI PHẢI điều hướng hoặc mở action duyệt yêu cầu đặt chỗ
- **VÀ** nếu booking ở `PENDING_APPROVAL` thì UI PHẢI điều hướng hoặc mở action duyệt biên lai.

#### Scenario: Customer không được xem calendar staff

- **CHO** customer đã đăng nhập
- **KHI** gọi endpoint calendar staff/admin
- **THÌ** API PHẢI từ chối bằng role guard.

