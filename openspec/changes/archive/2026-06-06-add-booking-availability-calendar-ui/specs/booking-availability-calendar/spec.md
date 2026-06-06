## ADDED Requirements

### Requirement: Lịch Availability Public

Hệ thống PHẢI (SHALL) cung cấp dữ liệu lịch trống/bận theo phòng hoặc loại phòng để customer biết ngày nào có thể đặt trước khi gửi yêu cầu.

#### Scenario: Xem lịch availability của một phòng

- **CHO** user gửi `roomId`, `from` và `to` hợp lệ
- **KHI** gọi endpoint availability public
- **THÌ** API PHẢI trả danh sách ngày trong khoảng `from` đến `to`
- **VÀ** mỗi ngày PHẢI có trạng thái `available`, `held` hoặc `booked`
- **VÀ** các ngày có booking active overlap PHẢI được đánh dấu không thể đặt.

#### Scenario: Xem lịch availability theo loại phòng

- **CHO** user gửi `roomTypeId`, `from` và `to` hợp lệ
- **KHI** gọi endpoint availability public theo loại phòng
- **THÌ** API PHẢI trả từng ngày với số phòng còn có thể đặt
- **VÀ** ngày chỉ PHẢI bị đánh dấu full khi toàn bộ phòng active của loại phòng đều bị giữ hoặc không khả dụng.

#### Scenario: Booking overlap làm ngày không thể đặt

- **CHO** phòng có booking từ `2026-06-03` đến `2026-06-06`
- **KHI** user kiểm tra range `2026-06-01` đến `2026-06-04`
- **THÌ** API PHẢI báo range này có conflict
- **VÀ** chỉ rõ booking overlap bắt đầu từ `2026-06-03`.

#### Scenario: Booking không active không chặn lịch

- **CHO** phòng có booking `CANCELLED`, `REJECTED`, `EXPIRED` hoặc `CHECKED_OUT`
- **KHI** user xem availability cho khoảng ngày overlap booking đó
- **THÌ** booking đó KHÔNG được làm ngày bị đánh dấu không thể đặt.

#### Scenario: Deadline hết hạn không chặn lịch

- **CHO** phòng có booking `PENDING_HOST_APPROVAL` đã quá `approvalDeadline`
- **HOẶC** booking `PENDING_PAYMENT` hoặc `PAYING` đã quá `paymentDeadline`
- **KHI** user xem availability cho khoảng ngày overlap booking đó
- **THÌ** booking đó KHÔNG được làm ngày bị đánh dấu không thể đặt.

### Requirement: Kiểm Tra Range Availability

Hệ thống PHẢI (SHALL) cung cấp kiểm tra range ngày để frontend biết ngay range user chọn có thể đặt hay không.

#### Scenario: Range hợp lệ

- **CHO** phòng không có booking active overlap range được chọn
- **KHI** frontend kiểm tra availability range
- **THÌ** API PHẢI trả `available=true`
- **VÀ** không trả conflict blocking.

#### Scenario: Range bị thuê một phần

- **CHO** phòng đã có booking active từ `2026-06-03` đến `2026-06-06`
- **KHI** user chọn `2026-06-01` đến `2026-06-04`
- **THÌ** API PHẢI trả `available=false`
- **VÀ** trả danh sách conflict có `checkIn=2026-06-03`, `checkOut=2026-06-06`
- **VÀ** frontend PHẢI dùng dữ liệu này để hiển thị dialog cảnh báo rõ ràng.

#### Scenario: Range không hợp lệ

- **CHO** `to` bằng hoặc trước `from`
- **KHI** kiểm tra range availability
- **THÌ** API PHẢI từ chối với thông báo `Ngày trả phòng phải sau ngày nhận phòng`.

### Requirement: Calendar Admin Staff

Hệ thống PHẢI (SHALL) cho receptionist/admin xem lịch thuê theo phòng và ngày để biết phòng nào đang được giữ, chờ duyệt, chờ thanh toán hoặc đã xác nhận.

#### Scenario: Staff xem lịch theo tháng

- **CHO** receptionist hoặc admin đã đăng nhập
- **KHI** mở calendar booking theo tháng
- **THÌ** UI PHẢI hiển thị danh sách phòng theo hàng và ngày theo cột
- **VÀ** cell có booking active PHẢI hiển thị trạng thái booking, mã booking và tên khách khi có quyền xem.

#### Scenario: Staff lọc lịch theo loại phòng hoặc tầng

- **CHO** staff đang xem calendar
- **KHI** chọn loại phòng hoặc tầng
- **THÌ** calendar PHẢI chỉ hiển thị phòng khớp bộ lọc
- **VÀ** dữ liệu booking trong lịch PHẢI refresh theo bộ lọc.

#### Scenario: Staff xem chi tiết booking từ calendar

- **CHO** một cell hoặc booking block trên calendar có booking active
- **KHI** staff click booking đó
- **THÌ** UI PHẢI mở chi tiết booking hoặc điều hướng tới màn xử lý phù hợp theo status.

### Requirement: Calendar User Khi Chọn Ngày

Web app PHẢI (SHALL) hiển thị lịch ngày trống/bận cho customer ở trang chi tiết phòng và luồng đặt phòng.

#### Scenario: User thấy ngày không thể đặt

- **CHO** user đang xem loại phòng hoặc phòng cụ thể
- **KHI** availability được tải
- **THÌ** calendar PHẢI đánh dấu rõ ngày không thể đặt
- **VÀ** không được để user hiểu nhầm ngày bị thuê là ngày khả dụng.

#### Scenario: User chọn range có ngày bị thuê

- **CHO** user chọn range có ít nhất một ngày bị conflict
- **KHI** frontend detect conflict từ availability hoặc range check
- **THÌ** UI PHẢI mở dialog lớn giữa màn hình
- **VÀ** dialog PHẢI nêu khoảng ngày đã chọn không thể đặt
- **VÀ** dialog PHẢI có hành động chọn lại ngày hoặc tìm phòng khác.

#### Scenario: User submit sau khi availability thay đổi

- **CHO** user đã xem calendar lúc phòng còn trống
- **VÀ** sau đó booking active khác được tạo overlap cùng phòng/ngày
- **KHI** user gửi yêu cầu đặt phòng
- **THÌ** backend PHẢI từ chối request
- **VÀ** frontend PHẢI hiển thị lỗi bằng dialog lớn giữa màn hình.
