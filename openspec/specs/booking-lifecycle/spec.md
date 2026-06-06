# Đặc Tả Vòng Đời Booking

## Purpose

Định nghĩa tạo booking, chống đặt trùng, áp dụng khuyến mãi, lịch sử/chi tiết booking, hủy, hết hạn, upload biên lai, duyệt/từ chối, check-in, check-out, dịch vụ phát sinh, event và chuyển trạng thái.

## Requirements

### Requirement: Khách Hàng Tạo Booking

Hệ thống PHẢI (SHALL) cho khách hàng đã đăng nhập tạo booking cho một phòng vật lý trong khoảng ngày hợp lệ.

#### Scenario: Tạo booking hợp lệ

- **CHO** customer đã đăng nhập
- **VÀ** `checkOut` sau `checkIn`
- **VÀ** phòng tồn tại
- **VÀ** loại phòng đang active
- **VÀ** không có booking active overlap cùng phòng
- **KHI** post `/bookings`
- **THÌ** hệ thống PHẢI tính tổng tiền
- **VÀ** áp dụng flash sale nếu có
- **VÀ** áp dụng coupon nếu gửi coupon hợp lệ
- **VÀ** tạo booking status `PENDING_PAYMENT`
- **VÀ** set `paymentDeadline` sau thời điểm tạo 15 phút
- **VÀ** default `checkInTime=14:00`, `checkOutTime=12:00`, adults = 2, children = 0 khi thiếu
- **VÀ** lưu outbox event `booking.created`
- **VÀ** emit `booking.created`.

#### Scenario: Khoảng ngày không hợp lệ

- **CHO** `checkOut` bằng hoặc trước `checkIn`
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Ngày trả phòng phải sau ngày nhận phòng`.

#### Scenario: Không lấy được lock tạo booking

- **CHO** request khác đang giữ Redis lock `booking:lock:<roomId>:<checkIn>:<checkOut>`
- **KHI** customer tạo booking cùng phòng/khoảng ngày
- **THÌ** API PHẢI từ chối với `Phòng này đang được đặt bởi người khác, vui lòng thử lại`.

#### Scenario: Phòng không tồn tại

- **CHO** room id gửi lên không tồn tại
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Phòng không tồn tại`.

#### Scenario: Loại phòng không active

- **CHO** loại phòng của phòng đã chọn inactive
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Loại phòng không còn hoạt động`.

#### Scenario: Booking active overlap

- **CHO** phòng đã có booking ở `PENDING_PAYMENT`, `PAYING`, `CONFIRMED` hoặc `CHECKED_IN`
- **VÀ** booking đó overlap khoảng ngày yêu cầu
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Phòng đã được đặt trong khoảng thời gian này`.

#### Scenario: Luôn giải phóng lock

- **CHO** request tạo booking đã lấy Redis lock
- **KHI** request thành công hoặc thất bại
- **THÌ** hệ thống PHẢI xóa lock key trong finally block.

### Requirement: Thứ Tự Áp Dụng Khuyến Mãi Booking

Hệ thống PHẢI (SHALL) áp dụng khuyến mãi theo thứ tự đang triển khai: giá gốc, flash sale, rồi coupon.

#### Scenario: Flash sale áp dụng trước

- **CHO** có flash sale active cho loại phòng và thời gian hiện tại nằm trong khung sale
- **KHI** tính tổng booking
- **THÌ** hệ thống PHẢI giảm tổng gốc theo phần trăm flash sale
- **VÀ** dùng số tiền sau flash sale làm đầu vào tính coupon.

#### Scenario: Coupon áp dụng sau flash sale

- **CHO** request có coupon code hợp lệ
- **KHI** booking tạo thành công
- **THÌ** hệ thống PHẢI validate coupon theo số tiền hiện tại
- **VÀ** lưu `discountAmount`
- **VÀ** lưu `couponCode`
- **VÀ** tăng usage của coupon
- **VÀ** upsert `UserCoupon` tương ứng thành đã dùng với `usedAt`.

#### Scenario: Không gửi coupon

- **CHO** request không có coupon code
- **KHI** booking được tạo
- **THÌ** hệ thống KHÔNG được thay đổi usage coupon hoặc user coupon state.

### Requirement: Lịch Sử Booking

Hệ thống PHẢI (SHALL) cho khách hàng xem booking của chính mình, phân trang và lọc theo status.

#### Scenario: Xem booking của tôi

- **CHO** customer đã đăng nhập
- **KHI** gọi `/bookings/my?page=1&limit=10`
- **THÌ** API PHẢI trả booking của customer, mới nhất trước
- **VÀ** include room, room type, add-ons, payment, review
- **VÀ** trả `data`, `total`, `page`, `limit`.

#### Scenario: Lọc booking của tôi theo status

- **CHO** customer đã đăng nhập
- **KHI** gọi `/bookings/my?status=CONFIRMED`
- **THÌ** chỉ booking confirmed của customer được trả về.

### Requirement: Phân Quyền Xem Chi Tiết Booking

Hệ thống PHẢI (SHALL) chỉ cho chủ booking, admin và receptionist xem chi tiết booking.

#### Scenario: Chủ booking xem chi tiết

- **CHO** customer sở hữu booking
- **KHI** gọi `/bookings/:id`
- **THÌ** API PHẢI trả booking kèm room, room type, add-ons, payment, review.

#### Scenario: Admin hoặc receptionist xem booking

- **CHO** admin hoặc receptionist đã đăng nhập
- **KHI** gọi `/bookings/:id`
- **THÌ** API PHẢI trả booking dù user không phải customer sở hữu.

#### Scenario: User không có quyền xem booking

- **CHO** user không phải chủ booking và không phải admin/receptionist
- **KHI** gọi `/bookings/:id`
- **THÌ** API PHẢI từ chối với `Không có quyền xem đơn này`.

### Requirement: Khách Hàng Hủy Booking

Hệ thống PHẢI (SHALL) cho customer hủy booking của chính mình trong các trạng thái cho phép.

#### Scenario: Hủy booking chờ hoặc đã xác nhận

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`, `PAYING` hoặc `CONFIRMED`
- **KHI** post `/bookings/:id/cancel`
- **THÌ** hệ thống PHẢI set status `CANCELLED`
- **VÀ** emit `booking.cancelled` với reason đã gửi hoặc `Customer cancelled`.

#### Scenario: Hủy booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** yêu cầu hủy
- **THÌ** API PHẢI từ chối với `Không có quyền hủy đơn này`.

#### Scenario: Hủy booking ở trạng thái không cho phép

- **CHO** booking không ở `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`
- **KHI** yêu cầu hủy
- **THÌ** API PHẢI từ chối với `Không thể hủy đơn ở trạng thái này`.

### Requirement: Xác Nhận Và Hết Hạn Theo Payment Event

Hệ thống PHẢI (SHALL) chuyển trạng thái booking dựa trên domain event thanh toán thành công/thất bại.

#### Scenario: Xác nhận booking sau payment success

- **CHO** booking ở `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `confirmBooking` chạy
- **THÌ** hệ thống PHẢI set status `CONFIRMED`
- **VÀ** emit `booking.confirmed`.

#### Scenario: Confirm idempotent

- **CHO** booking không ở `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `confirmBooking` chạy
- **THÌ** booking PHẢI được trả về nguyên trạng.

#### Scenario: Expire booking chưa thanh toán

- **CHO** booking ở `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống PHẢI set status `EXPIRED`
- **VÀ** emit `booking.expired`.

#### Scenario: Expire idempotent

- **CHO** booking không ở `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống KHÔNG được đổi trạng thái.

#### Scenario: Tìm booking quá hạn

- **CHO** có booking `paymentDeadline` trước hiện tại
- **KHI** cron query booking quá hạn
- **THÌ** chỉ booking đang `PENDING_PAYMENT` được trả về.

### Requirement: Biên Lai Chuyển Khoản Và Duyệt Booking

Hệ thống PHẢI (SHALL) hỗ trợ customer upload biên lai và receptionist/admin duyệt hoặc từ chối.

#### Scenario: Upload biên lai

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **KHI** post `/bookings/:id/upload-receipt` với `receiptImageUrl`
- **THÌ** payment hiện có của booking PHẢI được update receipt image và status `PENDING`
- **VÀ** tạo booking attachment type `receipt`
- **VÀ** booking status thành `PENDING_APPROVAL`
- **VÀ** API trả `Đã upload biên lai, chờ staff xác nhận`.

#### Scenario: Upload biên lai cho booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** upload biên lai
- **THÌ** API PHẢI từ chối với `Không có quyền thao tác`.

#### Scenario: Upload biên lai khi booking không chờ thanh toán

- **CHO** booking không ở `PENDING_PAYMENT`
- **KHI** upload biên lai
- **THÌ** API PHẢI từ chối với `Đơn không ở trạng thái chờ thanh toán`.

#### Scenario: Staff xem booking chờ duyệt

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/bookings/staff/pending`
- **THÌ** API PHẢI trả booking `PENDING_APPROVAL`, cũ nhất trước
- **VÀ** include room, room type, customer summary, payment, attachments
- **VÀ** trả metadata phân trang.

#### Scenario: Duyệt booking chuyển khoản

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **VÀ** không có booking `CONFIRMED` hoặc `CHECKED_IN` khác conflict cùng phòng/ngày
- **KHI** post `/bookings/:id/approve`
- **THÌ** hệ thống PHẢI set booking status `CONFIRMED`
- **VÀ** lưu `approvedById`, `approvedAt`
- **VÀ** set room status `RESERVED`
- **VÀ** emit `booking.approved`.

#### Scenario: Duyệt booking bị conflict

- **CHO** có booking `CONFIRMED` hoặc `CHECKED_IN` khác overlap cùng phòng/ngày
- **KHI** staff duyệt booking pending approval
- **THÌ** API PHẢI từ chối với `Phòng đã có đơn confirmed trong khoảng này`.

#### Scenario: Từ chối booking chuyển khoản

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **KHI** post `/bookings/:id/reject` với reason
- **THÌ** hệ thống PHẢI set booking status `REJECTED`
- **VÀ** lưu `approvedById`, `rejectedReason`
- **VÀ** emit `booking.rejected`
- **VÀ** trả `Đã từ chối booking`.

#### Scenario: Từ chối booking có payment completed

- **CHO** booking bị từ chối có payment status `COMPLETED`
- **KHI** staff từ chối booking
- **THÌ** payment PHẢI chuyển status `REFUNDED` và set `refundedAt`.

### Requirement: Check-In

Hệ thống PHẢI (SHALL) cho receptionist/admin check-in booking đã xác nhận và chuyển phòng sang đang ở.

#### Scenario: Check-in booking confirmed

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking status `CONFIRMED`
- **KHI** post `/bookings/:id/checkin`
- **THÌ** booking PHẢI thành `CHECKED_IN`
- **VÀ** `checkInActual` được set thời điểm hiện tại
- **VÀ** room status thành `OCCUPIED`
- **VÀ** update booking/room PHẢI nằm trong cùng transaction.

#### Scenario: Check-in booking chưa confirmed

- **CHO** booking không ở `CONFIRMED`
- **KHI** check-in
- **THÌ** API PHẢI từ chối với `Đơn phải ở trạng thái CONFIRMED để check-in`.

### Requirement: Check-Out

Hệ thống PHẢI (SHALL) cho receptionist/admin check-out booking đang ở, cộng addon và chuyển phòng sang bẩn.

#### Scenario: Check-out booking checked-in

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking status `CHECKED_IN`
- **KHI** post `/bookings/:id/checkout`
- **THÌ** booking PHẢI thành `CHECKED_OUT`
- **VÀ** `checkOutActual` được set thời điểm hiện tại
- **VÀ** `totalAmount` PHẢI được set bằng tổng hiện tại cộng tổng addon
- **VÀ** room status thành `DIRTY`
- **VÀ** emit `checkout.completed` với final amount.

#### Scenario: Check-out trước check-in

- **CHO** booking không ở `CHECKED_IN`
- **KHI** checkout
- **THÌ** API PHẢI từ chối với `Khách chưa check-in`.

### Requirement: Dịch Vụ Phát Sinh

Hệ thống PHẢI (SHALL) cho staff quản lý addon service cho booking đang ở.

#### Scenario: Thêm dịch vụ vào booking checked-in

- **CHO** receptionist, housekeeping hoặc admin đã đăng nhập
- **VÀ** booking status `CHECKED_IN`
- **KHI** post `/staff/bookings/:bookingId/addons` với tên dịch vụ, số lượng, đơn giá và note tùy chọn
- **THÌ** hệ thống PHẢI tạo addon
- **VÀ** tính `totalPrice = quantity * unitPrice`
- **VÀ** tăng booking `totalAmount` theo total addon.

#### Scenario: Thêm dịch vụ trước khi check-in

- **CHO** booking không ở `CHECKED_IN`
- **KHI** staff thêm addon
- **THÌ** API PHẢI từ chối với `Chỉ có thể thêm dịch vụ khi khách đang ở`.

#### Scenario: Liệt kê addon

- **CHO** staff-role user đã đăng nhập
- **KHI** gọi `/staff/bookings/:bookingId/addons`
- **THÌ** addon của booking PHẢI trả theo thời gian tạo tăng dần.

#### Scenario: Cập nhật số lượng addon

- **CHO** addon tồn tại
- **KHI** patch `/staff/addons/:id` với quantity mới
- **THÌ** hệ thống PHẢI tính lại total bằng unit price hiện tại
- **VÀ** tăng/giảm booking `totalAmount` theo phần chênh lệch.

#### Scenario: Cập nhật note addon

- **CHO** addon tồn tại
- **KHI** chỉ patch `staffNote`
- **THÌ** note PHẢI được cập nhật và booking `totalAmount` không đổi.

#### Scenario: Xóa addon

- **CHO** addon tồn tại
- **KHI** delete `/staff/addons/:id`
- **THÌ** hệ thống PHẢI giảm booking `totalAmount` theo total addon
- **VÀ** xóa addon row
- **VÀ** trả `Đã xóa dịch vụ`.

### Requirement: Notification Theo Vòng Đời Booking

Hệ thống PHẢI (SHALL) tạo/gửi notification cho customer khi booking có sự kiện chính.

#### Scenario: Thông báo booking confirmed

- **CHO** booking được xác nhận qua payment success
- **KHI** emit `booking.confirmed`
- **THÌ** notification service PHẢI tạo thông báo xác nhận và gửi email nếu có cấu hình.

#### Scenario: Thông báo booking cancelled

- **CHO** customer hủy booking
- **KHI** emit `booking.cancelled`
- **THÌ** notification service PHẢI tạo thông báo hủy, gồm reason nếu có.

#### Scenario: Thông báo booking expired

- **CHO** booking chưa thanh toán bị expire
- **KHI** emit `booking.expired`
- **THÌ** notification service PHẢI tạo thông báo hết hạn.

#### Scenario: Thông báo checkout completed

- **CHO** checkout hoàn tất
- **KHI** emit `checkout.completed`
- **THÌ** notification service PHẢI tạo thông báo dạng hóa đơn, gồm final amount nếu có.
