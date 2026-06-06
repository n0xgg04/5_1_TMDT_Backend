## MODIFIED Requirements

### Requirement: Khách Hàng Tạo Booking

Hệ thống PHẢI (SHALL) cho khách hàng đã đăng nhập tạo yêu cầu đặt chỗ cho một phòng vật lý trong khoảng ngày hợp lệ; yêu cầu này chưa được phép thanh toán cho đến khi admin/receptionist duyệt.

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

- **CHO** phòng đã có booking ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED` hoặc `CHECKED_IN`
- **VÀ** booking đó overlap khoảng ngày yêu cầu
- **KHI** customer tạo booking
- **THÌ** API PHẢI từ chối với `Phòng đã được đặt trong khoảng thời gian này`.

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

## ADDED Requirements

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
