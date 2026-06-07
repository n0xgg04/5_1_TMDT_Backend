## MODIFIED Requirements

### Requirement: Xác Nhận Và Hết Hạn Theo Payment Event

Hệ thống PHẢI (SHALL) chuyển trạng thái booking dựa trên domain event thanh toán thành công/thất bại và deadline của từng giai đoạn duyệt/thanh toán. Với luồng chuyển khoản, payment success được kích hoạt tự động khi Sepay webhook khớp giao dịch.

#### Scenario: Xác nhận booking sau payment success

- **CHO** booking ở `PAYING`
- **VÀ** booking đã được duyệt yêu cầu đặt chỗ
- **KHI** `confirmBooking` chạy
- **THÌ** hệ thống PHẢI set status `CONFIRMED`
- **VÀ** set room status `RESERVED`
- **VÀ** giữ coupon reservation là đã sử dụng nếu booking có coupon
- **VÀ** emit `booking.confirmed`.

#### Scenario: Xác nhận booking chuyển khoản qua Sepay webhook

- **CHO** booking ở `PENDING_PAYMENT`
- **VÀ** payment method là `BANK_TRANSFER`
- **VÀ** Sepay webhook khớp transaction với bill (đúng `paymentCode` và `amount`)
- **KHI** xử lý khớp giao dịch
- **THÌ** hệ thống PHẢI set payment status `COMPLETED`
- **VÀ** emit `payment.success` với booking id, amount và transaction id
- **VÀ** booking PHẢI chuyển sang `CONFIRMED` qua event handler
- **VÀ** set room status `RESERVED`.

#### Scenario: Confirm idempotent

- **CHO** booking không ở `PAYING` hoặc `PENDING_PAYMENT`
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
- **VÀ** emit `booking.payment.expired`
- **VÀ** cập nhật bill status `EXPIRED` nếu có bill liên kết.

#### Scenario: Expire idempotent

- **CHO** booking không ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** `expireBooking` chạy
- **THÌ** hệ thống KHÔNG được đổi trạng thái.

#### Scenario: Tìm booking quá hạn

- **CHO** có booking `approvalDeadline` hoặc `paymentDeadline` trước hiện tại
- **KHI** cron query booking quá hạn
- **THÌ** hệ thống PHẢI trả booking `PENDING_HOST_APPROVAL` quá hạn duyệt
- **VÀ** trả booking `PENDING_PAYMENT` hoặc `PAYING` quá hạn thanh toán.

## REMOVED Requirements

### Requirement: Biên Lai Chuyển Khoản Và Duyệt Booking

**Reason**: Luồng upload biên lai và duyệt thủ công được thay thế bởi Sepay webhook tự động. Giao dịch chuyển khoản được xác nhận tự động khi webhook khớp, không cần staff duyệt biên lai.

**Migration**: 
- Backend giữ lại endpoint `/bookings/:id/upload-receipt` và các endpoint duyệt/từ chối biên lai cho backward compatibility, nhưng không còn dùng cho luồng `BANK_TRANSFER`.
- Staff dashboard ẩn phần duyệt biên lai.
- `PENDING_APPROVAL` status không còn được sử dụng cho luồng mới.
