## ADDED Requirements

### Requirement: Staff/Admin có thể xem danh sách conversation
Hệ thống SHALL cho phép Staff và Admin xem danh sách conversation của khách hàng, hiển thị thông tin khách hàng, tin nhắn mới nhất, trạng thái (active/resolved), staff phụ trách.

#### Scenario: Xem danh sách conversation
- **WHEN** Admin/Staff gọi GET /api/v1/chat/staff/conversations
- **THEN** hệ thống trả về danh sách conversation (join customer, latest message)

### Requirement: Staff/Admin có thể xem chi tiết conversation
Hệ thống SHALL cho phép Staff/Admin xem chi tiết conversation kèm danh sách tin nhắn.

#### Scenario: Xem chi tiết conversation
- **WHEN** Admin/Staff gọi GET /api/v1/chat/staff/conversations/:id
- **THEN** hệ thống trả về conversation + danh sách messages

### Requirement: Staff/Admin có thể nhận phụ trách conversation
Hệ thống SHALL cho phép Staff/Admin nhấn "Nhận phụ trách" để gán conversation cho mình.

#### Scenario: Nhận phụ trách conversation
- **WHEN** Admin/Staff gọi POST /api/v1/chat/staff/conversations/:id/assign
- **THEN** hệ thống gán staffId vào conversation

### Requirement: Staff/Admin có thể gửi tin nhắn
Hệ thống SHALL cho phép Staff/Admin gửi tin nhắn trong conversation.

#### Scenario: Gửi tin nhắn thành công
- **WHEN** Admin/Staff gửi POST /api/v1/chat/conversation/:id/messages
- **THEN** hệ thống lưu tin nhắn và trả về thành công

### Requirement: Staff/Admin có thể đánh dấu conversation đã giải quyết
Hệ thống SHALL cho phép Staff/Admin đánh dấu conversation là "resolved" khi đã xử lý xong yêu cầu của khách.

#### Scenario: Đánh dấu đã giải quyết
- **WHEN** Admin/Staff gọi POST /api/v1/chat/staff/conversations/:id/resolve
- **THEN** hệ thống cập nhật status = "resolved"
