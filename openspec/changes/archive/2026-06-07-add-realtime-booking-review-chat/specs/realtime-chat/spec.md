## ADDED Requirements

### Requirement: Realtime Stream Cho Conversation

Hệ thống PHẢI (SHALL) cung cấp realtime stream đã xác thực để phát event message mới tới đúng người có quyền trong conversation.

#### Scenario: Customer nhận event conversation của mình

- **CHO** customer đã đăng nhập và mở realtime chat stream
- **VÀ** conversation có `customerId` bằng current user id
- **KHI** message mới được tạo trong conversation đó
- **THÌ** stream PHẢI gửi event `chat.message.created` chứa message mới, conversation id, booking id nếu có và thời gian cập nhật.

#### Scenario: Staff nhận event conversation trong queue

- **CHO** receptionist hoặc admin đã đăng nhập và mở realtime chat stream
- **VÀ** conversation đang `open`
- **KHI** customer hoặc staff tạo message mới trong conversation đó
- **THÌ** stream của receptionist/admin PHẢI nhận event `chat.message.created`
- **VÀ** event PHẢI đủ dữ liệu để cập nhật tin nhắn cuối và `updatedAt` của hội thoại.

#### Scenario: Không phát conversation của customer khác

- **CHO** customer A đang mở realtime chat stream
- **VÀ** message mới thuộc conversation của customer B
- **KHI** message được tạo
- **THÌ** stream của customer A KHÔNG được nhận event đó.

#### Scenario: Customer không nhận staff queue stream

- **CHO** customer đã đăng nhập
- **KHI** customer cố mở stream dành cho staff/admin hoặc nhận event queue staff
- **THÌ** hệ thống PHẢI từ chối bằng role guard hoặc không phát event staff queue cho customer đó.

#### Scenario: Publish sau khi lưu message thành công

- **CHO** request gửi message hợp lệ
- **KHI** API tạo message thành công trong database
- **THÌ** hệ thống PHẢI publish event realtime sau transaction lưu message
- **VÀ** event PHẢI chứa `message.id` để frontend chống append trùng.

#### Scenario: Fallback khi stream lỗi

- **CHO** browser không mở được realtime stream hoặc stream bị ngắt
- **KHI** UI chat cần tiếp tục cập nhật
- **THÌ** web app PHẢI fallback sang refetch hoặc polling endpoint conversation hiện có
- **VÀ** khi stream kết nối lại, UI PHẢI refetch một lần để đồng bộ message bị lỡ.
