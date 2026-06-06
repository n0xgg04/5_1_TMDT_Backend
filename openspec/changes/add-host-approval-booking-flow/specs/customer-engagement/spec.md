## ADDED Requirements

### Requirement: Thanh Thông Báo Booking Cho User

Web app PHẢI (SHALL) hiển thị thanh thông báo cho user đã đăng nhập khi booking cần hành động hoặc vừa đổi trạng thái quan trọng.

#### Scenario: Hiển thị yêu cầu thanh toán sau khi duyệt

- **CHO** customer có booking vừa được duyệt sang `PENDING_PAYMENT`
- **KHI** web app nhận notification `booking.request.approved`
- **THÌ** thanh thông báo PHẢI hiển thị nội dung đã được duyệt
- **VÀ** có hành động điều hướng tới bước thanh toán của booking đó
- **VÀ** hiển thị deadline thanh toán.

#### Scenario: Hiển thị từ chối yêu cầu đặt chỗ

- **CHO** customer có booking bị `REJECTED` do staff từ chối yêu cầu đặt chỗ
- **KHI** web app nhận notification `booking.request.rejected`
- **THÌ** thanh thông báo PHẢI hiển thị lý do nếu có
- **VÀ** không hiển thị hành động thanh toán.

#### Scenario: Hiển thị hết hạn yêu cầu hoặc thanh toán

- **CHO** customer có booking chuyển `EXPIRED`
- **KHI** web app nhận notification hết hạn
- **THÌ** thanh thông báo PHẢI nêu rõ đơn hết hạn do quá hạn duyệt hoặc quá hạn thanh toán.

### Requirement: Chat Theo Booking Đang Chờ Duyệt

Hệ thống PHẢI (SHALL) cho customer và admin/receptionist trao đổi trong conversation gắn với booking khi booking đang chờ duyệt yêu cầu đặt chỗ.

#### Scenario: Customer mở chat của booking chờ duyệt

- **CHO** customer sở hữu booking ở `PENDING_HOST_APPROVAL`
- **KHI** customer mở chat từ chi tiết booking
- **THÌ** hệ thống PHẢI tạo hoặc trả conversation có `bookingId` của booking đó
- **VÀ** chỉ trả messages thuộc conversation đó.

#### Scenario: Staff mở chat từ queue duyệt

- **CHO** receptionist hoặc admin đang xem booking ở `PENDING_HOST_APPROVAL`
- **KHI** staff mở chat của booking
- **THÌ** hệ thống PHẢI trả conversation gắn với booking và customer tương ứng
- **VÀ** cho phép staff gửi message trong conversation đó.

#### Scenario: Không mở chat booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** customer yêu cầu conversation theo booking đó
- **THÌ** API PHẢI từ chối bằng quyền truy cập.
