## ADDED Requirements

### Requirement: Tạo Bill Khi Duyệt Yêu Cầu Đặt Chỗ

Hệ thống PHẢI (SHALL) tự động tạo bill với mã thanh toán duy nhất khi staff duyệt yêu cầu đặt chỗ và khách chọn phương thức thanh toán `BANK_TRANSFER`.

#### Scenario: Tạo bill tự động khi duyệt booking

- **CHO** staff duyệt yêu cầu đặt chỗ thành công
- **KHI** booking chuyển sang `PENDING_PAYMENT`
- **THÌ** hệ thống PHẢI tạo bill với `paymentCode` format `SS-<bookingCode>`
- **VÀ** `amount` bằng tổng tiền booking
- **VÀ** `status` mặc định là `PENDING`
- **VÀ** `paymentDeadline` giống booking `paymentDeadline`
- **VÀ** lưu `accountNumber` từ cấu hình Sepay active.

#### Scenario: Bill đã tồn tại không tạo trùng

- **CHO** booking đã có bill thuộc về nó
- **KHI** duyệt lại booking
- **THÌ** hệ thống KHÔNG được tạo bill mới.

### Requirement: Tra Cứu Bill Theo Booking

Hệ thống PHẢI (SHALL) cho phép customer và staff xem bill của booking.

#### Scenario: Customer xem bill của mình

- **CHO** customer sở hữu booking
- **KHI** gọi `/bookings/:id/bill`
- **THÌ** API PHẢI trả bill kèm `paymentCode`, `amount`, `status`, `paymentDeadline`, thông tin tài khoản nhận.

#### Scenario: Staff xem bill bất kỳ

- **CHO** admin hoặc receptionist đã đăng nhập
- **KHI** gọi `/bookings/:id/bill`
- **THÌ** API PHẢI trả bill của booking.

### Requirement: Cập Nhật Trạng Thái Bill

Hệ thống PHẢI (SHALL) tự động cập nhật trạng thái bill khi transaction khớp hoặc khi booking thay đổi trạng thái.

#### Scenario: Bill chuyển PAID khi có transaction khớp

- **CHO** bill ở trạng thái `PENDING`
- **VÀ** nhận được Sepay transaction khớp `paymentCode` và `amount`
- **KHI** xử lý khớp giao dịch
- **THÌ** bill PHẢI chuyển `PAID`
- **VÀ** lưu `paidAt` là thời điểm giao dịch
- **VÀ** liên kết với `BankTransaction`.

#### Scenario: Bill chuyển EXPIRED khi booking hết hạn

- **CHO** booking bị expire
- **KHI** trạng thái booking chuyển `EXPIRED`
- **THÌ** bill PHẢI chuyển `EXPIRED`.

#### Scenario: Bill chuyển CANCELLED khi booking bị hủy

- **CHO** booking bị cancel
- **KHI** trạng thái booking chuyển `CANCELLED`
- **THÌ** bill PHẢI chuyển `CANCELLED`.

### Requirement: Hiển Thị Hướng Dẫn Chuyển Khoản Cho Khách

Hệ thống PHẢI (SHALL) trả về thông tin chuyển khoản đầy đủ khi khách chọn phương thức `BANK_TRANSFER`.

#### Scenario: Khởi tạo thanh toán chuyển khoản

- **CHO** customer khởi tạo payment `BANK_TRANSFER`
- **KHI** gọi `POST /payments/initiate`
- **THÌ** API PHẢI trả `paymentCode`, `accountNumber`, `bankName`, `accountHolder`, `amount`, `paymentDeadline`
- **VÀ** nội dung chuyển khoản mẫu chứa `paymentCode`.
