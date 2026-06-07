## MODIFIED Requirements

### Requirement: Chat Theo Booking Đang Chờ Duyệt

Hệ thống PHẢI (SHALL) cho customer và admin/receptionist trao đổi realtime trong conversation gắn với booking khi booking đang chờ duyệt yêu cầu đặt chỗ.

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

#### Scenario: Customer nhận phản hồi realtime từ admin

- **CHO** customer đang mở chi tiết booking `PENDING_HOST_APPROVAL`
- **VÀ** customer đã mở conversation của booking đó
- **KHI** admin hoặc receptionist gửi message mới trong conversation
- **THÌ** web app PHẢI hiển thị message mới trong khung chat mà không cần reload trang
- **VÀ** không được yêu cầu customer tự gửi message hoặc refetch thủ công trước khi thấy phản hồi.

#### Scenario: Customer gửi tin và staff nhận realtime

- **CHO** customer đang mở conversation của booking `PENDING_HOST_APPROVAL`
- **KHI** customer gửi message hợp lệ
- **THÌ** message PHẢI được lưu
- **VÀ** staff/admin đang mở conversation hoặc queue liên quan PHẢI nhận event realtime cho message đó.

#### Scenario: Không mở chat booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** customer yêu cầu conversation theo booking đó
- **THÌ** API PHẢI từ chối bằng quyền truy cập.

#### Scenario: Customer fallback khi realtime lỗi

- **CHO** customer đang mở chat booking chờ duyệt
- **VÀ** realtime stream bị lỗi hoặc bị ngắt
- **KHI** có khả năng message mới phát sinh
- **THÌ** web app PHẢI fallback sang refetch hoặc polling conversation hiện có
- **VÀ** khi stream kết nối lại, khung chat PHẢI đồng bộ lại messages theo `message.id`.
