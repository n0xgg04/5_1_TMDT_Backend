## Why

Luồng chat theo booking đang chờ duyệt hiện đã có API gửi/lấy tin nhắn, nhưng phía admin/receptionist và customer chưa nhận tin nhắn mới theo thời gian thực; staff page còn phụ thuộc polling 5 giây và customer detail chỉ cập nhật sau khi chính người dùng gửi. Điều này làm giai đoạn reviewing yêu cầu đặt phòng kém mượt, dễ bỏ lỡ trao đổi cần thiết trước khi admin duyệt hoặc từ chối.

## What Changes

- Bổ sung realtime delivery cho tin nhắn trong conversation, ưu tiên các conversation gắn với booking `PENDING_HOST_APPROVAL`.
- Khi customer gửi tin trong booking đang chờ duyệt, admin/receptionist đang mở queue hoặc conversation liên quan PHẢI thấy tin mới ngay mà không cần reload.
- Khi admin/receptionist gửi phản hồi trong lúc review booking, customer đang mở chi tiết booking PHẢI thấy tin mới ngay.
- Web app PHẢI cập nhật danh sách hội thoại, tin nhắn cuối, thời gian cập nhật và khung chat đang mở theo realtime event.
- Có fallback polling hợp lý khi realtime stream bị lỗi hoặc browser không duy trì được kết nối.
- Không đổi lifecycle booking, quyền duyệt, deadline 24h hoặc điều kiện thanh toán sau duyệt.

## Capabilities

### New Capabilities

- `realtime-chat`: Định nghĩa kênh realtime cho conversation/message, phạm vi quyền nhận event và fallback khi mất kết nối.

### Modified Capabilities

- `customer-engagement`: Mở rộng chat theo booking đang chờ duyệt để customer nhận và hiển thị message realtime trong chi tiết booking.
- `staff-operations`: Mở rộng queue hội thoại và chat trong lúc staff/admin review booking để nhận message realtime, cập nhật list/detail ngay khi có trao đổi mới.

## Impact

- Backend NestJS: `chat` API/service cần publish message events sau khi lưu message và cung cấp authenticated realtime stream cho conversation.
- Frontend Next.js: customer booking detail, admin/staff conversations và pending booking review UI cần subscribe stream, cập nhật React Query cache và fallback polling.
- Security: stream chỉ phát event cho customer sở hữu conversation và admin/receptionist được phép xem staff chat queue; customer không nhận conversation của người khác.
- Database: không dự kiến migration mới nếu dùng bảng `messages`/`conversations` hiện có.
