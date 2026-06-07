## Context

Sapphire Stay đã có conversation và message cho hỗ trợ khách hàng, bao gồm conversation gắn với booking `PENDING_HOST_APPROVAL`. Customer có thể mở chat trong chi tiết booking; admin/receptionist có thể mở chat từ queue duyệt và trang conversations. Tuy nhiên dữ liệu hiện được lấy qua request thường: staff/admin page dùng polling 5 giây, customer booking detail không subscribe event và chỉ invalidate sau khi chính customer gửi tin.

Hệ thống đã có pattern realtime bằng NestJS `@Sse` cho notifications, dùng in-memory map user id -> stream subject và frontend có React Query để cập nhật cache. Change này nên tái sử dụng cách đó cho chat để giảm rủi ro, không đổi schema `Conversation`/`Message`, không đổi booking lifecycle và vẫn giữ quyền chỉ chat khi booking đang `PENDING_HOST_APPROVAL`.

## Goals / Non-Goals

**Goals:**

- Phát message mới tới đúng các browser đang liên quan đến conversation ngay sau khi `sendMessage` lưu DB thành công.
- Cho customer đang mở chi tiết booking chờ duyệt thấy phản hồi admin/receptionist ngay.
- Cho admin/receptionist đang mở staff/admin conversations hoặc queue review thấy tin nhắn customer mới ngay, cập nhật list/detail và tin nhắn cuối.
- Giữ fallback polling khi SSE lỗi, reconnect chậm hoặc browser không hỗ trợ stream ổn định.
- Giữ kiểm soát quyền: customer chỉ nhận conversation của chính mình; staff/admin chỉ nhận stream staff nếu có role `RECEPTIONIST` hoặc `ADMIN`.

**Non-Goals:**

- Không thêm hệ thống presence, typing indicator, read receipts nâng cao hoặc push notification ngoài browser.
- Không hỗ trợ chat sau khi booking rời trạng thái `PENDING_HOST_APPROVAL`, trừ các conversation hỗ trợ chung hiện có.
- Không thêm Redis pub/sub, RabbitMQ hoặc WebSocket gateway trong change này.
- Không thay đổi schema database nếu không phát sinh yêu cầu lưu metadata mới.

## Decisions

### Decision 1: Dùng SSE cho realtime chat thay vì WebSocket

Backend sẽ bổ sung stream authenticated dưới `/api/v1/chat/stream` hoặc endpoint tương đương, phát event `chat.message.created` sau khi tạo message. SSE phù hợp vì nhu cầu chính là server đẩy message event xuống client; gửi message vẫn qua REST hiện có.

Alternative considered: WebSocket gateway. Không chọn cho change này vì cần thêm connection lifecycle, auth handshake, room membership và dependency vận hành lớn hơn trong khi dự án đã có SSE cho notifications.

### Decision 2: Tách stream chat khỏi stream notification

Notification stream hiện chỉ phát notification theo user. Chat stream nên nằm trong `ChatModule` hoặc shared realtime helper để event payload rõ ràng, tránh làm `/notifications/stream` mang thêm nhiều loại event không cùng trách nhiệm.

Alternative considered: nhét chat event vào `/notifications/stream`. Không chọn vì tên endpoint và spec hiện tại đang ràng buộc notification; trộn chat vào đó làm client khó phân quyền và khó test.

### Decision 3: Publish theo conversation membership

Khi `sendMessage(conversationId, senderId, content)` thành công, `ChatService` publish payload gồm conversation id, booking id, customer id, staff id, sender id, message, latest message và updatedAt. Customer stream chỉ nhận event nếu `conversation.customerId === currentUser.id`. Staff/admin stream nhận event cho conversation open trong queue staff, đặc biệt conversation có `bookingId` và booking còn `PENDING_HOST_APPROVAL`.

Alternative considered: broadcast mọi message tới mọi staff/admin client rồi filter frontend. Không chọn vì làm lộ metadata conversation và tăng tải client không cần thiết.

### Decision 4: Frontend cập nhật React Query cache theo event, polling là fallback

Customer booking detail sẽ subscribe khi booking ở `PENDING_HOST_APPROVAL` và đã có conversation id. Staff/admin conversations page sẽ subscribe khi user có role staff/admin; event cập nhật list `staff-conversations`, detail `staff-conversation/<id>` và booking approval queue conversation summary nếu đang mở. Nếu stream lỗi hoặc đóng, UI bật lại `refetchInterval` 5 giây hoặc refetch thủ công theo query hiện có.

Alternative considered: luôn polling nhanh hơn 5 giây. Không chọn vì vẫn tạo độ trễ, tốn request và không giải quyết đúng yêu cầu realtime.

### Decision 5: Không đổi message persistence contract

`Message` hiện đã có `conversationId`, `senderId`, `content`, `isRead`, `createdAt`; change này chỉ phát event sau khi ghi DB. Không cần migration để đáp ứng realtime chat cơ bản.

Alternative considered: thêm bảng outbox cho chat event. Không chọn ở scope này vì event chỉ phục vụ UI realtime trong tiến trình app hiện tại; nếu cần multi-instance production có thể nâng cấp sau.

## Risks / Trade-offs

- [Risk] SSE in-memory không phát xuyên nhiều instance backend. -> Mitigation: chấp nhận cho môi trường hiện tại; nếu deploy nhiều instance, nâng cấp ChatRealtimeService sang Redis pub/sub hoặc event bus phân tán.
- [Risk] EventSource không gửi header Authorization trực tiếp trong browser. -> Mitigation: dùng helper tạo SSE bằng `fetch` streaming có Bearer token, hoặc endpoint nhận token an toàn theo cơ chế hiện có; tránh đưa refresh token lên URL.
- [Risk] Staff/admin có thể nhận nhiều conversation event không liên quan. -> Mitigation: backend lọc theo role và conversation status/booking state; frontend vẫn kiểm tra conversation id trước khi cập nhật detail.
- [Risk] Mất event khi tab sleep hoặc network ngắt. -> Mitigation: reconnect/refetch khi stream mở lại và giữ fallback polling.
- [Risk] Duplicate message trong cache khi optimistic update và event cùng tới. -> Mitigation: merge theo `message.id` thay vì append mù.

## Migration Plan

1. Bổ sung realtime chat service trong backend để quản lý stream và publish message events.
2. Thêm endpoint SSE/stream cho chat, được bảo vệ bằng JWT và role guard cho staff stream nếu tách endpoint.
3. Cập nhật `ChatService.sendMessage` để include đủ conversation context và publish event sau khi message tạo thành công.
4. Thêm frontend chat stream client/hook dùng access token hiện có, reconnect/refetch và cleanup khi unmount.
5. Cập nhật customer booking detail, staff/admin conversations và pending booking review UI để update React Query cache từ event.
6. Validate bằng API/web build và manual test hai browser: customer gửi -> admin thấy ngay, admin gửi -> customer thấy ngay.

Rollback strategy: có thể tắt subscription frontend để quay lại polling hiện tại; backend REST chat và database không đổi.

## Open Questions

- Có cần hiển thị trạng thái “đang online/đang nhập” trong chat reviewing không? Scope đề xuất chưa làm.
- Khi booking được approve/reject, conversation nên tự resolve hay chỉ khóa gửi message? Hiện scope giữ nguyên hành vi conversation và chỉ realtime trong lúc `PENDING_HOST_APPROVAL`.
