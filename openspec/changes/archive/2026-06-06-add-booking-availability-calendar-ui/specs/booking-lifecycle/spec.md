## MODIFIED Requirements

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
