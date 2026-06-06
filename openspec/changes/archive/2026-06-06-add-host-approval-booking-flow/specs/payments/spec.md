## MODIFIED Requirements

### Requirement: Khởi Tạo Thanh Toán

Hệ thống PHẢI (SHALL) cho customer khởi tạo thanh toán cho booking của chính mình chỉ sau khi yêu cầu đặt chỗ đã được duyệt và booking còn trong hạn thanh toán.

#### Scenario: Khởi tạo VNPay sau khi được duyệt

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** booking đã có `approvedAt`
- **VÀ** chưa quá `paymentDeadline`
- **VÀ** chưa có payment `COMPLETED` cho booking
- **KHI** post `/payments/initiate` với method `VNPAY`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment status `PROCESSING`
- **VÀ** set method `VNPAY`, payment type `FULL`, amount bằng tổng tiền cuối cùng của booking
- **VÀ** tạo VNPay gateway URL
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment, gateway URL và amount.

#### Scenario: Khởi tạo thanh toán có coupon

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** request thanh toán có coupon code hợp lệ
- **KHI** post `/payments/initiate`
- **THÌ** hệ thống PHẢI validate coupon theo tổng tiền hiện tại
- **VÀ** lưu `couponCode`, `discountAmount` và tổng tiền sau giảm vào booking
- **VÀ** reserve coupon usage cho user
- **VÀ** tạo payment amount bằng tổng tiền sau giảm.

#### Scenario: Khởi tạo phương thức online không phải VNPay

- **CHO** customer sở hữu booking pending đã được duyệt
- **KHI** post `/payments/initiate` với method online khác `BANK_TRANSFER`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment `PROCESSING`
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment và amount; gateway URL chỉ có khi method tạo được URL.

#### Scenario: Khởi tạo chuyển khoản

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** booking đã được duyệt
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

#### Scenario: Booking chưa được duyệt

- **CHO** booking status `PENDING_HOST_APPROVAL`
- **KHI** khởi tạo thanh toán
- **THÌ** API PHẢI từ chối với `Đơn chưa được duyệt để thanh toán`.

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

### Requirement: Thanh Toán Stripe/VISA

Hệ thống PHẢI (SHALL) cho customer thanh toán booking pending đã được duyệt bằng user payment method đã lưu có Stripe payment method id.

#### Scenario: Tạo Stripe payment intent

- **CHO** customer sở hữu booking `PENDING_PAYMENT` và chưa quá hạn
- **VÀ** booking đã được duyệt yêu cầu đặt chỗ
- **VÀ** user payment method thuộc customer
- **VÀ** details của method có `paymentMethodId`
- **KHI** post `/payments/stripe/payment-intent`
- **THÌ** hệ thống PHẢI tạo Stripe payment intent với amount bằng total booking nhân 100, currency VND
- **VÀ** tạo hoặc update payment method `VISA`, type `FULL`, status `PROCESSING`, amount và Stripe payment intent id
- **VÀ** set booking status `PAYING`
- **VÀ** trả payment, client secret và amount.

#### Scenario: Tạo Stripe payment intent có coupon

- **CHO** customer sở hữu booking `PENDING_PAYMENT`
- **VÀ** request có coupon code hợp lệ
- **KHI** tạo Stripe payment intent
- **THÌ** hệ thống PHẢI áp dụng và reserve coupon trước khi tạo payment intent
- **VÀ** Stripe amount PHẢI bằng tổng tiền sau giảm nhân 100.

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
- **VÀ** release coupon reservation nếu có
- **VÀ** emit `payment.failed`.

#### Scenario: Không tìm thấy giao dịch Stripe

- **CHO** không có payment có Stripe payment intent id đã gửi
- **KHI** confirm Stripe
- **THÌ** API PHẢI từ chối với `Không tìm thấy giao dịch`.
