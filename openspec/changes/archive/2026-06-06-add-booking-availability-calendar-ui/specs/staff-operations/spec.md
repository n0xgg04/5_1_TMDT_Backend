## ADDED Requirements

### Requirement: Lịch Booking Staff Admin

Hệ thống PHẢI (SHALL) cho receptionist/admin xem lịch booking theo phòng và ngày để nắm lịch thuê, lịch giữ chỗ và lịch chờ duyệt.

#### Scenario: Xem lịch booking theo khoảng ngày

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** gọi endpoint calendar với `from` và `to`
- **THÌ** API PHẢI trả danh sách phòng và booking active overlap trong khoảng ngày đó
- **VÀ** booking PHẢI gồm id, booking code, status, check-in/check-out, customer summary và room summary.

#### Scenario: Calendar phân biệt trạng thái booking

- **CHO** calendar có booking `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED` hoặc `CHECKED_IN`
- **KHI** staff xem lịch
- **THÌ** mỗi booking block PHẢI hiển thị trạng thái bằng màu/nhãn khác nhau
- **VÀ** phải phân biệt rõ chờ duyệt yêu cầu, chờ thanh toán, đang thanh toán, chờ duyệt biên lai, đã xác nhận và đang lưu trú.

#### Scenario: Booking quá hạn không còn giữ lịch

- **CHO** booking `PENDING_HOST_APPROVAL` quá `approvalDeadline`
- **HOẶC** booking `PENDING_PAYMENT` hoặc `PAYING` quá `paymentDeadline`
- **KHI** staff xem calendar
- **THÌ** booking đó KHÔNG được hiển thị như một block đang giữ phòng.

#### Scenario: Điều hướng từ calendar tới xử lý booking

- **CHO** staff click một booking block trên calendar
- **KHI** booking ở `PENDING_HOST_APPROVAL`
- **THÌ** UI PHẢI điều hướng hoặc mở action duyệt yêu cầu đặt chỗ
- **VÀ** nếu booking ở `PENDING_APPROVAL` thì UI PHẢI điều hướng hoặc mở action duyệt biên lai.

#### Scenario: Customer không được xem calendar staff

- **CHO** customer đã đăng nhập
- **KHI** gọi endpoint calendar staff/admin
- **THÌ** API PHẢI từ chối bằng role guard.
