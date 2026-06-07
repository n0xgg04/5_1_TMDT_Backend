## MODIFIED Requirements

### Requirement: Staff Chat Với Khách Trong Lúc Chờ Duyệt

Hệ thống PHẢI (SHALL) cho receptionist/admin chat realtime với customer ngay từ queue yêu cầu đặt chỗ.

#### Scenario: Mở chat từ pending request

- **CHO** receptionist hoặc admin đang xem request `PENDING_HOST_APPROVAL`
- **KHI** chọn hành động chat
- **THÌ** hệ thống PHẢI mở conversation gắn với booking
- **VÀ** assign staff hiện tại nếu conversation chưa có staff.

#### Scenario: Staff nhận tin customer realtime

- **CHO** receptionist hoặc admin đang mở trang hội thoại hoặc queue duyệt yêu cầu đặt chỗ
- **VÀ** conversation gắn với booking `PENDING_HOST_APPROVAL`
- **KHI** customer gửi message mới trong conversation đó
- **THÌ** UI staff/admin PHẢI hiển thị message mới trong conversation đang mở mà không cần reload
- **VÀ** danh sách hội thoại PHẢI cập nhật tin nhắn cuối và thời gian cập nhật.

#### Scenario: Queue duyệt cập nhật conversation summary realtime

- **CHO** receptionist hoặc admin đang xem `/bookings/staff/approval-requests`
- **VÀ** một request `PENDING_HOST_APPROVAL` có conversation
- **KHI** có message mới trong conversation đó
- **THÌ** UI queue PHẢI cập nhật conversation summary hoặc badge có tin mới cho request tương ứng
- **VÀ** không làm thay đổi booking status.

#### Scenario: Staff gửi phản hồi realtime cho customer

- **CHO** receptionist hoặc admin đang mở conversation gắn với booking `PENDING_HOST_APPROVAL`
- **KHI** staff gửi message hợp lệ
- **THÌ** message PHẢI được lưu
- **VÀ** customer đang mở chi tiết booking đó PHẢI nhận message qua realtime stream.

#### Scenario: Chat không làm đổi trạng thái booking

- **CHO** conversation gắn với booking `PENDING_HOST_APPROVAL`
- **KHI** staff hoặc customer gửi message
- **THÌ** booking status PHẢI giữ nguyên.

#### Scenario: Staff fallback khi realtime lỗi

- **CHO** receptionist hoặc admin đang dùng UI chat
- **VÀ** realtime stream bị lỗi hoặc bị ngắt
- **KHI** UI cần tiếp tục hiển thị hội thoại mới nhất
- **THÌ** web app PHẢI fallback sang polling/refetch endpoint conversation hiện có
- **VÀ** khi stream kết nối lại, UI PHẢI refetch list/detail một lần để đồng bộ.
