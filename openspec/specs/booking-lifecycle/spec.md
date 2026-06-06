# Đặc Tả Vòng Đời Booking

## Purpose

Định nghĩa tạo booking, chống đặt trùng, áp dụng khuyến mãi, lịch sử/chi tiết booking, hủy, hết hạn, upload biên lai, duyệt/từ chối, check-in, check-out, dịch vụ phát sinh, event và chuyển trạng thái.
## Requirements
### Requirement: Khách Hàng Tạo Booking

Hệ thống PHẢI (SHALL) cho khách hàng đã đăng nhập tạo yêu cầu đặt chỗ cho một phòng vật lý trong khoảng ngày hợp lệ; yêu cầu này chưa được phép thanh toán cho đến khi admin/receptionist duyệt, và tạo booking PHẢI là guard cuối cùng chống đặt trùng sau khi user đã xem availability.

#### Scenario: Tạo booking hợp lệ

- **CHO** customer đã đăng nhập
- **VÀ** `checkOut` sau `checkIn`
- **VÀ** phòng tồn tại
- **VÀ** loại phòng đang active
- **VÀ** không có booking active overlap cùng phòng
- **KHI** post `/bookings`
- **THÌ** hệ thống PHẢI tính tổng tiền dự kiến
- **VÀ** áp dụng flash sale nếu có
- **VÀ** KHÔNG áp dụng hoặc consume coupon ở bước tạo booking
- **VÀ** tạo booking status `PENDING_HOST_APPROVAL`
- **VÀ** set `approvalDeadline` sau thời điểm tạo 24 giờ
- **VÀ** chưa set quyền thanh toán cho booking cho đến khi duyệt
- **VÀ** default `checkInTime=14:00`, `checkOutTime=12:00`, adults = 2, children = 0 khi thiếu
- **VÀ** lưu outbox event `booking.request.created`
- **VÀ** emit `booking.request.created`.

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

- **CHO** phòng đã có booking active-hold ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED` hoặc `CHECKED_IN`
- **VÀ** booking đó overlap khoảng ngày yêu cầu theo điều kiện `checkIn < requestedCheckOut` và `checkOut > requestedCheckIn`
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Phòng đã được đặt trong khoảng thời gian này`
- **VÀ** response PHẢI đủ rõ để frontend hiển thị dialog cảnh báo lớn giữa màn hình.

#### Scenario: Overlap một phần vẫn bị chặn

- **CHO** phòng đã có booking active từ `2026-06-03` đến `2026-06-06`
- **KHI** customer tạo booking từ `2026-06-01` đến `2026-06-04`
- **THÌ** API PHẢI từ chối vì hai khoảng ngày overlap.

#### Scenario: Coupon gửi khi tạo booking

- **CHO** customer gửi coupon code trong request tạo booking
- **KHI** booking được tạo thành công
- **THÌ** hệ thống KHÔNG được tăng usage coupon
- **VÀ** KHÔNG được đánh dấu `UserCoupon` là đã dùng
- **VÀ** API PHẢI hướng dẫn coupon chỉ được áp dụng ở bước thanh toán.

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

#### Scenario: Hủy booking chờ duyệt, chờ thanh toán hoặc đã xác nhận

- **CHO** customer sở hữu booking ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING` hoặc `CONFIRMED`
- **KHI** post `/bookings/:id/cancel`
- **THÌ** hệ thống PHẢI set status `CANCELLED`
- **VÀ** release coupon reservation nếu booking đang giữ coupon chưa thanh toán thành công
- **VÀ** emit `booking.cancelled` với reason đã gửi hoặc `Customer cancelled`.

#### Scenario: Hủy booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** yêu cầu hủy
- **THÌ** API PHẢI từ chối với `Không có quyền hủy đơn này`.

#### Scenario: Hủy booking ở trạng thái không cho phép

- **CHO** booking không ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING` hoặc `CONFIRMED`
- **KHI** yêu cầu hủy
- **THÌ** API PHẢI từ chối với `Không thể hủy đơn ở trạng thái này`.

### Requirement: Xác Nhận Và Hết Hạn Theo Payment Event

Hệ thống PHẢI (SHALL) chuyển trạng thái booking dựa trên domain event thanh toán thành công/thất bại và deadline của từng giai đoạn duyệt/thanh toán.

#### Scenario: Xác nhận booking sau payment success

- **CHO** booking ở `PAYING`
- **VÀ** booking đã được duyệt yêu cầu đặt chỗ
- **KHI** `confirmBooking` chạy
- **THÌ** hệ thống PHẢI set status `CONFIRMED`
- **VÀ** set room status `RESERVED`
- **VÀ** giữ coupon reservation là đã sử dụng nếu booking có coupon
- **VÀ** emit `booking.confirmed`.

#### Scenario: Confirm idempotent

- **CHO** booking không ở `PAYING`
- **KHI** `confirmBooking` chạy
- **THÌ** booking PHẢI được trả về nguyên trạng.

#### Scenario: Expire yêu cầu đặt chỗ chưa duyệt

- **CHO** booking ở `PENDING_HOST_APPROVAL`
- **VÀ** `approvalDeadline` trước hiện tại
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống PHẢI set status `EXPIRED`
- **VÀ** emit `booking.approval.expired`.

#### Scenario: Expire booking đã duyệt chưa thanh toán

- **CHO** booking ở `PENDING_PAYMENT` hoặc `PAYING`
- **VÀ** `paymentDeadline` trước hiện tại
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống PHẢI set status `EXPIRED`
- **VÀ** release coupon reservation nếu có
- **VÀ** emit `booking.payment.expired`.

#### Scenario: Expire idempotent

- **CHO** booking không ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống KHÔNG được đổi trạng thái.

#### Scenario: Tìm booking quá hạn

- **CHO** có booking `approvalDeadline` hoặc `paymentDeadline` trước hiện tại
- **KHI** cron query booking quá hạn
- **THÌ** hệ thống PHẢI trả booking `PENDING_HOST_APPROVAL` quá hạn duyệt
- **VÀ** trả booking `PENDING_PAYMENT` hoặc `PAYING` quá hạn thanh toán.

### Requirement: Biên Lai Chuyển Khoản Và Duyệt Booking

Hệ thống PHẢI (SHALL) hỗ trợ customer upload biên lai sau khi yêu cầu đặt chỗ đã được duyệt và receptionist/admin duyệt hoặc từ chối biên lai thanh toán; luồng này PHẢI tách biệt với duyệt yêu cầu đặt chỗ.

#### Scenario: Upload biên lai

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** booking đã được duyệt yêu cầu đặt chỗ
- **KHI** post `/bookings/:id/upload-receipt` với `receiptImageUrl`
- **THÌ** payment hiện có của booking PHẢI được update receipt image và status `PENDING`
- **VÀ** tạo booking attachment type `receipt`
- **VÀ** booking status thành `PENDING_APPROVAL`
- **VÀ** API trả `Đã upload biên lai, chờ staff xác nhận`.

#### Scenario: Upload biên lai cho booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** upload biên lai
- **THÌ** API PHẢI từ chối với `Không có quyền thao tác`.

#### Scenario: Upload biên lai khi booking chưa được duyệt yêu cầu đặt chỗ

- **CHO** booking ở `PENDING_HOST_APPROVAL`
- **KHI** upload biên lai
- **THÌ** API PHẢI từ chối với `Đơn chưa được duyệt để thanh toán`.

#### Scenario: Upload biên lai khi booking không chờ thanh toán

- **CHO** booking không ở `PENDING_PAYMENT`
- **KHI** upload biên lai
- **THÌ** API PHẢI từ chối với `Đơn không ở trạng thái chờ thanh toán`.

#### Scenario: Staff xem booking chờ duyệt biên lai

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi endpoint danh sách biên lai chờ duyệt
- **THÌ** API PHẢI trả booking `PENDING_APPROVAL`, cũ nhất trước
- **VÀ** include room, room type, customer summary, payment, attachments
- **VÀ** trả metadata phân trang.

#### Scenario: Duyệt booking chuyển khoản

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking ở `PENDING_APPROVAL`
- **VÀ** không có booking `CONFIRMED` hoặc `CHECKED_IN` khác conflict cùng phòng/ngày
- **KHI** staff duyệt biên lai
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
- **KHI** staff từ chối biên lai với reason
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

### Requirement: Duyệt Yêu Cầu Đặt Chỗ Trước Thanh Toán

Hệ thống PHẢI (SHALL) cho admin/receptionist duyệt hoặc từ chối yêu cầu đặt chỗ trong 24 giờ trước khi khách được phép thanh toán.

#### Scenario: Staff xem yêu cầu đặt chỗ chờ duyệt

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi `/bookings/staff/approval-requests`
- **THÌ** API PHẢI trả booking `PENDING_HOST_APPROVAL`, cũ nhất trước
- **VÀ** include room, room type, branch, customer summary, trạng thái phòng và conversation nếu có
- **VÀ** trả metadata phân trang.

#### Scenario: Duyệt yêu cầu đặt chỗ

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking ở `PENDING_HOST_APPROVAL`
- **VÀ** `approvalDeadline` chưa quá hạn
- **VÀ** không có booking active khác conflict cùng phòng/ngày
- **KHI** post `/bookings/:id/approve-request`
- **THÌ** hệ thống PHẢI set booking status `PENDING_PAYMENT`
- **VÀ** lưu `approvedById`, `approvedAt`
- **VÀ** set `paymentDeadline` sau thời điểm duyệt 30 phút theo mặc định
- **VÀ** payment deadline KHÔNG được vượt quá 2 giờ sau thời điểm duyệt
- **VÀ** emit `booking.request.approved`.

#### Scenario: Duyệt yêu cầu đã quá hạn

- **CHO** booking ở `PENDING_HOST_APPROVAL`
- **VÀ** `approvalDeadline` đã quá hạn
- **KHI** staff duyệt yêu cầu
- **THÌ** API PHẢI từ chối với `Yêu cầu đặt phòng đã hết hạn duyệt`.

#### Scenario: Duyệt yêu cầu bị conflict

- **CHO** có booking active khác overlap cùng phòng/ngày
- **KHI** staff duyệt yêu cầu
- **THÌ** API PHẢI từ chối với `Phòng đã được đặt trong khoảng thời gian này`.

#### Scenario: Từ chối yêu cầu đặt chỗ

- **CHO** receptionist hoặc admin đã đăng nhập
- **VÀ** booking ở `PENDING_HOST_APPROVAL`
- **KHI** post `/bookings/:id/reject-request` với reason
- **THÌ** hệ thống PHẢI set booking status `REJECTED`
- **VÀ** lưu `approvedById`, `rejectedReason`
- **VÀ** emit `booking.request.rejected`.

