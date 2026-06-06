## ADDED Requirements

### Requirement: Admin Theo Dõi Luồng Duyệt Booking

Hệ thống PHẢI (SHALL) cho admin nhìn được số lượng booking theo các trạng thái mới của luồng duyệt trước thanh toán.

#### Scenario: Summary bao gồm chờ duyệt yêu cầu đặt chỗ

- **CHO** có booking ở `PENDING_HOST_APPROVAL`
- **KHI** admin gọi `/reports/bookings/summary`
- **THÌ** response PHẢI bao gồm key `PENDING_HOST_APPROVAL` với số lượng tương ứng.

#### Scenario: Summary phân biệt chờ duyệt và chờ thanh toán

- **CHO** có booking `PENDING_HOST_APPROVAL` và booking `PENDING_PAYMENT`
- **KHI** admin xem dashboard booking summary
- **THÌ** hệ thống PHẢI hiển thị hai nhóm riêng: chờ duyệt yêu cầu và chờ thanh toán.

#### Scenario: Revenue không tính request chưa thanh toán

- **CHO** booking ở `PENDING_HOST_APPROVAL` hoặc `PENDING_PAYMENT`
- **KHI** admin gọi báo cáo doanh thu
- **THÌ** các booking này KHÔNG được tính vào doanh thu
- **VÀ** chỉ payment `COMPLETED` mới được cộng doanh thu như hiện tại.

### Requirement: Admin Theo Dõi SLA Duyệt Yêu Cầu

Hệ thống PHẢI (SHALL) cho admin xem các yêu cầu đặt chỗ gần hết hạn duyệt để xử lý kịp trong 24 giờ.

#### Scenario: Đếm yêu cầu sắp hết hạn

- **CHO** có booking `PENDING_HOST_APPROVAL` có `approvalDeadline` trong tương lai gần
- **KHI** admin xem dashboard hoặc queue duyệt
- **THÌ** hệ thống PHẢI hiển thị số lượng hoặc nhãn cảnh báo yêu cầu sắp hết hạn.

#### Scenario: Không cảnh báo yêu cầu đã xử lý

- **CHO** booking đã chuyển khỏi `PENDING_HOST_APPROVAL`
- **KHI** admin xem cảnh báo SLA
- **THÌ** booking đó KHÔNG được tính vào nhóm sắp hết hạn duyệt.
