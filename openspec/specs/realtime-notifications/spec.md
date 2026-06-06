# realtime-notifications Specification

## Purpose
Quy định việc lưu, liệt kê và phát thông báo in-app/realtime cho user để các thay đổi quan trọng của booking được nhìn thấy kịp thời, có fallback polling khi realtime stream không khả dụng.
## Requirements
### Requirement: Lưu Và Liệt Kê Thông Báo In-App

Hệ thống PHẢI (SHALL) lưu notification cho user và cho user xem các notification của chính mình.

#### Scenario: Tạo notification khi yêu cầu được duyệt

- **CHO** booking được duyệt từ `PENDING_HOST_APPROVAL` sang `PENDING_PAYMENT`
- **KHI** emit `booking.request.approved`
- **THÌ** hệ thống PHẢI tạo notification cho customer
- **VÀ** gửi email yêu cầu thanh toán nếu email provider được cấu hình
- **VÀ** notification data PHẢI chứa booking id, booking code và payment deadline.

#### Scenario: Tạo notification khi yêu cầu bị từ chối

- **CHO** booking bị từ chối từ `PENDING_HOST_APPROVAL`
- **KHI** emit `booking.request.rejected`
- **THÌ** hệ thống PHẢI tạo notification cho customer
- **VÀ** notification data PHẢI chứa reason nếu có.

#### Scenario: User xem notification của mình

- **CHO** customer đã đăng nhập
- **KHI** gọi `/notifications/me`
- **THÌ** API PHẢI trả notifications của customer đó, mới nhất trước
- **VÀ** KHÔNG trả notification của user khác.

#### Scenario: Đánh dấu đã đọc

- **CHO** customer sở hữu notification chưa đọc
- **KHI** patch `/notifications/:id/read`
- **THÌ** notification PHẢI được đánh dấu đã đọc.

### Requirement: Realtime Delivery Cho Notification

Hệ thống PHẢI (SHALL) phát notification mới tới browser của user đã đăng nhập bằng realtime channel và có polling fallback.

#### Scenario: User nhận notification qua stream

- **CHO** customer đã đăng nhập và mở `/notifications/stream`
- **KHI** hệ thống tạo notification mới cho customer đó
- **THÌ** stream PHẢI gửi event chứa notification mới tới browser.

#### Scenario: Không gửi notification của user khác

- **CHO** customer A đang mở stream
- **VÀ** notification mới thuộc customer B
- **KHI** notification được tạo
- **THÌ** stream của customer A KHÔNG được nhận notification đó.

#### Scenario: Fallback polling khi stream lỗi

- **CHO** browser không mở được realtime stream hoặc stream bị ngắt
- **KHI** notification bar cần cập nhật
- **THÌ** web app PHẢI fallback sang polling `/notifications/me`.
