# Đặc Tả Thanh Toán

## Purpose

Định nghĩa khởi tạo thanh toán, callback VNPay, luồng Stripe/VISA, tài khoản chuyển khoản, phương thức thanh toán đã lưu của user và phân quyền xem payment.

## Requirements

### Requirement: Khởi Tạo Thanh Toán

Hệ thống PHẢI (SHALL) cho customer khởi tạo thanh toán cho booking của chính mình khi booking còn chờ thanh toán.

#### Scenario: Khởi tạo VNPay

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** chưa quá `paymentDeadline`
- **VÀ** chưa có payment `COMPLETED` cho booking
- **KHI** post `/payments/initiate` với method `VNPAY`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment status `PROCESSING`
- **VÀ** set method `VNPAY`, payment type `FULL`, amount bằng total booking
- **VÀ** tạo VNPay gateway URL
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment, gateway URL và amount.

#### Scenario: Khởi tạo phương thức online không phải VNPay

- **CHO** customer sở hữu booking pending
- **KHI** post `/payments/initiate` với method online khác `BANK_TRANSFER`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment `PROCESSING`
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment và amount; gateway URL chỉ có khi method tạo được URL.

#### Scenario: Khởi tạo chuyển khoản

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **KHI** post `/payments/initiate` với method `BANK_TRANSFER`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment status `PROCESSING`
- **VÀ** giữ booking status `PENDING_PAYMENT`
- **VÀ** trả payment, amount và tài khoản ngân hàng active đầu tiên nếu có.

#### Scenario: Thanh toán đặt cọc

- **CHO** service được gọi nội bộ với payment type `DEPOSIT`
- **KHI** tính amount
- **THÌ** amount PHẢI bằng 30% total booking và làm tròn xuống bằng `Math.floor`.

#### Scenario: Booking không tồn tại

- **CHO** booking id không tồn tại
- **KHI** khởi tạo thanh toán
- **THÌ** API PHẢI từ chối với `Đơn đặt phòng không tồn tại`.

#### Scenario: Thanh toán booking của người khác

- **CHO** user không phải customer của booking
- **KHI** khởi tạo thanh toán
- **THÌ** API PHẢI từ chối với `Không có quyền thanh toán đơn này`.

#### Scenario: Booking không ở trạng thái chờ thanh toán

- **CHO** booking status không phải `PENDING_PAYMENT`
- **KHI** khởi tạo thanh toán
- **THÌ** API PHẢI từ chối với `Đơn không ở trạng thái chờ thanh toán`.

#### Scenario: Booking quá hạn thanh toán

- **CHO** thời điểm hiện tại sau `paymentDeadline`
- **KHI** khởi tạo thanh toán
- **THÌ** API PHẢI từ chối với `Đơn đã hết hạn thanh toán`.

#### Scenario: Booking đã thanh toán

- **CHO** payment hiện có của booking có status `COMPLETED`
- **KHI** khởi tạo thanh toán lại
- **THÌ** API PHẢI từ chối với `Đơn đã được thanh toán`.

### Requirement: Tạo URL VNPay

Hệ thống PHẢI (SHALL) tạo URL thanh toán VNPay có chữ ký bằng cấu hình VNPay hoặc giá trị demo.

#### Scenario: Tạo VNPay URL

- **CHO** booking id, amount, order info và IP client
- **KHI** tạo URL VNPay
- **THÌ** URL PHẢI gồm version `2.1.0`, command `pay`, currency VND, order type `hotel`, locale `vn`, return URL, IP client, create date, expire date 15 phút và secure hash.

#### Scenario: Đơn vị tiền VNPay

- **CHO** amount đang là VND
- **KHI** tạo tham số VNPay
- **THÌ** `vnp_Amount` PHẢI bằng amount nhân 100.

#### Scenario: Mã tham chiếu VNPay

- **CHO** booking id
- **KHI** tạo tham số VNPay
- **THÌ** transaction reference PHẢI có dạng `<8 ký tự cuối bookingId>-<timestamp>`.

### Requirement: Xử Lý Callback VNPay

Hệ thống PHẢI (SHALL) verify chữ ký callback VNPay và cập nhật payment/booking qua domain event.

#### Scenario: Chữ ký VNPay không hợp lệ

- **CHO** secure hash không khớp callback params
- **KHI** gọi `/payments/webhook/vnpay`
- **THÌ** endpoint PHẢI trả `{ code: "97", message: "Invalid signature" }`.

#### Scenario: Không tìm thấy booking VNPay

- **CHO** chữ ký callback hợp lệ
- **VÀ** không resolve được booking từ transaction reference
- **KHI** webhook xử lý
- **THÌ** endpoint PHẢI trả `{ code: "01", message: "Order not found" }`.

#### Scenario: Giao dịch VNPay lặp

- **CHO** payment của booking đã có cùng `gatewayTransactionId`
- **KHI** webhook xử lý lại
- **THÌ** endpoint PHẢI trả `{ code: "00", message: "Already processed" }` và không lặp side effect.

#### Scenario: VNPay thành công

- **CHO** callback hợp lệ
- **VÀ** `vnp_ResponseCode` là `00`
- **KHI** webhook xử lý
- **THÌ** payment PHẢI chuyển `COMPLETED`
- **VÀ** set `gatewayTransactionId`, `paidAt`
- **VÀ** emit `payment.success` với booking id, amount và transaction id
- **VÀ** endpoint trả `{ code: "00", message: "Confirmed" }`.

#### Scenario: VNPay thất bại

- **CHO** callback hợp lệ
- **VÀ** `vnp_ResponseCode` khác `00`
- **KHI** webhook xử lý
- **THÌ** payment PHẢI chuyển `FAILED`
- **VÀ** `failureReason` PHẢI chứa response code của VNPay
- **VÀ** emit `payment.failed`.

### Requirement: Xem Payment Theo Booking

Hệ thống PHẢI (SHALL) cho customer xem payment của booking thuộc về mình.

#### Scenario: Lấy payment theo booking

- **CHO** customer đã đăng nhập sở hữu payment
- **KHI** gọi `/payments/booking/:bookingId`
- **THÌ** API PHẢI trả payment kèm booking.

#### Scenario: Không có payment

- **CHO** không có payment cho booking id
- **KHI** xem payment
- **THÌ** API PHẢI từ chối với `Thông tin thanh toán không tồn tại`.

#### Scenario: User không sở hữu payment

- **CHO** user không phải customer của payment
- **KHI** xem payment
- **THÌ** API PHẢI từ chối với `Không có quyền xem thông tin này`.

### Requirement: Stripe Setup Thẻ

Hệ thống PHẢI (SHALL) cung cấp helper tạo và confirm Stripe setup intent để lưu thẻ.

#### Scenario: Tạo setup intent

- **CHO** user đã đăng nhập
- **KHI** post `/payments/stripe/setup-intent`
- **THÌ** API PHẢI tạo Stripe setup intent với payment method type `card`
- **VÀ** trả client secret.

#### Scenario: Confirm setup thẻ

- **CHO** setup client secret và Stripe payment method id
- **KHI** post `/payments/stripe/confirm-setup`
- **THÌ** API PHẢI confirm setup intent
- **VÀ** retrieve payment method
- **VÀ** trả status, payment method id và last4 của thẻ.

### Requirement: Thanh Toán Stripe/VISA

Hệ thống PHẢI (SHALL) cho customer thanh toán booking pending bằng user payment method đã lưu có Stripe payment method id.

#### Scenario: Tạo Stripe payment intent

- **CHO** customer sở hữu booking `PENDING_PAYMENT` và chưa quá hạn
- **VÀ** user payment method thuộc customer
- **VÀ** details của method có `paymentMethodId`
- **KHI** post `/payments/stripe/payment-intent`
- **THÌ** hệ thống PHẢI tạo Stripe payment intent với amount bằng total booking nhân 100, currency VND
- **VÀ** tạo hoặc update payment method `VISA`, type `FULL`, status `PROCESSING`, amount và Stripe payment intent id
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment, client secret và amount.

#### Scenario: Không tìm thấy user payment method

- **CHO** id user payment method không thuộc customer
- **KHI** khởi tạo Stripe payment
- **THÌ** API PHẢI từ chối với `Không tìm thấy phương thức thanh toán`.

#### Scenario: Thẻ chưa liên kết Stripe

- **CHO** user payment method tồn tại nhưng details không có `paymentMethodId`
- **KHI** khởi tạo Stripe payment
- **THÌ** API PHẢI từ chối với `Thẻ chưa được liên kết với Stripe`.

#### Scenario: Confirm Stripe thành công

- **CHO** Stripe payment intent id map tới payment hiện có
- **VÀ** Stripe trả status `succeeded`
- **KHI** post `/payments/stripe/confirm-payment`
- **THÌ** payment PHẢI chuyển `COMPLETED`
- **VÀ** set `paidAt`
- **VÀ** emit `payment.success`
- **VÀ** endpoint trả `{ success: true, status: "succeeded" }`.

#### Scenario: Confirm Stripe thất bại

- **CHO** Stripe payment intent id map tới payment hiện có
- **VÀ** Stripe trả status khác `succeeded`
- **KHI** confirm payment
- **THÌ** payment PHẢI chuyển `FAILED`
- **VÀ** `failureReason` PHẢI chứa Stripe status
- **VÀ** emit `payment.failed`.

#### Scenario: Không tìm thấy giao dịch Stripe

- **CHO** không có payment có Stripe payment intent id đã gửi
- **KHI** confirm Stripe
- **THÌ** API PHẢI từ chối với `Không tìm thấy giao dịch`.

### Requirement: Quản Lý Tài Khoản Chuyển Khoản

Hệ thống PHẢI (SHALL) public tài khoản ngân hàng active và cho admin quản lý toàn bộ bản ghi.

#### Scenario: Danh sách tài khoản public

- **CHO** tồn tại payment method info active
- **KHI** gọi `/payment-methods`
- **THÌ** API PHẢI trả tài khoản active, mới nhất trước.

#### Scenario: Admin xem tất cả tài khoản

- **CHO** admin đã đăng nhập
- **KHI** gọi `/payment-methods/admin`
- **THÌ** API PHẢI trả cả active và inactive, mới nhất trước.

#### Scenario: Admin tạo tài khoản

- **CHO** admin đã đăng nhập
- **KHI** post `/payment-methods` với ngân hàng, số tài khoản, chủ tài khoản và tùy chọn chi nhánh/QR/active
- **THÌ** hệ thống PHẢI tạo payment method info.

#### Scenario: Admin cập nhật tài khoản

- **CHO** admin đã đăng nhập
- **VÀ** bản ghi tài khoản tồn tại
- **KHI** put `/payment-methods/:id`
- **THÌ** hệ thống PHẢI cập nhật field đã gửi.

#### Scenario: Admin xóa tài khoản

- **CHO** admin đã đăng nhập
- **VÀ** bản ghi tài khoản tồn tại
- **KHI** delete `/payment-methods/:id`
- **THÌ** hệ thống PHẢI xóa bản ghi.

### Requirement: Phương Thức Thanh Toán Của User

Hệ thống PHẢI (SHALL) cho user đã đăng nhập quản lý phương thức thanh toán đã lưu của chính mình.

#### Scenario: Liệt kê phương thức của user

- **CHO** user đã đăng nhập
- **KHI** gọi `/user-payment-methods`
- **THÌ** API PHẢI trả method active của user
- **VÀ** sắp xếp method default trước, sau đó mới nhất trước.

#### Scenario: Tạo method default

- **CHO** user đã đăng nhập
- **KHI** tạo user payment method với `isDefault=true`
- **THÌ** tất cả method hiện có của user PHẢI set `isDefault=false`
- **VÀ** method mới được tạo là default.

#### Scenario: Tạo method không default

- **CHO** user đã đăng nhập
- **KHI** tạo method không gửi `isDefault`
- **THÌ** method PHẢI được tạo với `isDefault=false` và `isActive=true`.

#### Scenario: Cập nhật method thành default

- **CHO** method thuộc user đã đăng nhập
- **KHI** patch với `isDefault=true`
- **THÌ** tất cả method khác của user PHẢI bỏ default
- **VÀ** target method được cập nhật.

#### Scenario: Cập nhật method của người khác

- **CHO** method id không thuộc user đã đăng nhập
- **KHI** cập nhật
- **THÌ** API PHẢI từ chối với `Không tìm thấy phương thức`.

#### Scenario: Xóa method của user

- **CHO** method thuộc user đã đăng nhập
- **KHI** delete `/user-payment-methods/:id`
- **THÌ** hệ thống PHẢI soft-delete bằng cách set `isActive=false`.
