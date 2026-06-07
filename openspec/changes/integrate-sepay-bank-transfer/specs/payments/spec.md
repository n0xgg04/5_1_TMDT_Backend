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

#### Scenario: Khởi tạo chuyển khoản ngân hàng

- **CHO** customer sở hữu booking ở `PENDING_PAYMENT`
- **VÀ** booking đã được duyệt
- **KHI** post `/payments/initiate` với method `BANK_TRANSFER`
- **THÌ** hệ thống PHẢI tạo hoặc cập nhật payment status `PROCESSING`
- **VÀ** giữ booking status `PENDING_PAYMENT`
- **VÀ** tạo bill với `paymentCode` format `SS-<bookingCode>` nếu chưa có
- **VÀ** trả payment, amount, `paymentCode`, thông tin tài khoản ngân hàng nhận (tên ngân hàng, số tài khoản, chủ tài khoản) từ cấu hình Sepay
- **VÀ** trả nội dung chuyển khoản mẫu chứa `paymentCode`.

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

### Requirement: Xem Payment Theo Booking

Hệ thống PHẢI (SHALL) cho customer xem payment của booking thuộc về mình, kèm bill và trạng thái chuyển khoản nếu có.

#### Scenario: Lấy payment theo booking kèm bill

- **CHO** customer đã đăng nhập sở hữu payment
- **KHI** gọi `/payments/booking/:bookingId`
- **THÌ** API PHẢI trả payment kèm booking
- **VÀ** nếu method là `BANK_TRANSFER`, PHẢI kèm bill với `paymentCode`, `status`, thông tin tài khoản nhận.

#### Scenario: Không có payment

- **CHO** không có payment cho booking id
- **KHI** xem payment
- **THÌ** API PHẢI từ chối với `Thông tin thanh toán không tồn tại`.

#### Scenario: User không sở hữu payment

- **CHO** user không phải customer của payment
- **KHI** xem payment
- **THÌ** API PHẢI từ chối với `Không có quyền xem thông tin này`.
