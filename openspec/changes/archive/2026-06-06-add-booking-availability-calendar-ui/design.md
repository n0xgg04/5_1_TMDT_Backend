## Context

Luồng hiện tại đã có backend guard chống đặt trùng bằng điều kiện overlap `existing.checkIn < requestedCheckOut` và `existing.checkOut > requestedCheckIn`. Search public cũng loại phòng đã bị giữ chỗ, nhưng user chưa có calendar trực quan để biết ngày nào trống/bận, còn staff/admin mới có room map trạng thái hiện tại chứ chưa có lịch thuê theo ngày. Lỗi quan trọng khi chọn ngày bị thuê đang dễ bị bỏ qua nếu chỉ hiển thị toast nhỏ.

Change này bổ sung một lớp availability rõ ràng trước khi submit, nhưng vẫn giữ backend create booking là guard cuối cùng để tránh race condition.

## Goals / Non-Goals

**Goals:**

- Dùng một rule active-overlap thống nhất cho search, availability calendar, staff calendar và create booking.
- Cung cấp API public để user xem availability theo phòng/loại phòng và kiểm tra range ngày đã chọn.
- Cung cấp API staff/admin để xem calendar booking theo phòng/ngày và trạng thái booking.
- Cập nhật UI customer để hiển thị ngày không thể đặt, cảnh báo range conflict và dùng dialog lớn giữa màn hình cho lỗi đặt phòng quan trọng.
- Cập nhật UI staff/admin để xem lịch thuê dạng calendar, phân biệt trạng thái chờ duyệt, chờ thanh toán, chờ duyệt biên lai, confirmed và checked-in.

**Non-Goals:**

- Không thay đổi schema booking nếu chỉ cần đọc dữ liệu hiện có.
- Không triển khai kéo-thả booking trên calendar.
- Không tự động chọn phòng thay thế khi user chọn range bị conflict; chỉ hướng dẫn chọn lại ngày hoặc tìm phòng khác.
- Không thay thế toàn bộ toast system; chỉ các lỗi đặt phòng quan trọng bắt buộc dùng dialog lớn.

## Decisions

### 1. Tách helper availability dùng chung trong backend

Tạo helper/service nội bộ, ví dụ `AvailabilityService`, để định nghĩa active-hold statuses và query overlap một lần. Service này trả:

- booking conflict theo phòng/range
- booked room ids cho search
- daily availability theo room hoặc room type
- staff calendar booking blocks

Lý do: hiện logic overlap nằm rải trong search và booking service. Nếu tiếp tục copy, calendar có nguy cơ lệch với create booking. Alternative là chỉ thêm logic trong từng service; cách đó nhanh hơn nhưng làm sai nghiệp vụ dễ hơn khi status/deadline đổi.

### 2. Public availability trả dữ liệu vừa đủ cho UI, không lộ thông tin khách

Endpoint public chỉ trả trạng thái ngày, số phòng còn trống và conflict metadata tối thiểu như ngày bắt đầu/kết thúc conflict. Không trả customer name, booking code hoặc payment state cho user.

Endpoint staff/admin trả thêm booking code, customer summary, status và room summary vì đã qua role guard.

### 3. Calendar UI tự xây bằng React/Tailwind

Không thêm dependency calendar mới ở bước này. UI cần hiển thị tháng/ngày, trạng thái ngày, booking block và action cơ bản; Tailwind grid đủ dùng và tránh tăng bundle/maintenance. Nếu sau này cần drag/drop, recurring hoặc timeline phức tạp mới cân nhắc dependency chuyên dụng.

### 4. Dialog lỗi đặt phòng dùng component Modal hiện có

Dùng `Modal` hiện có trong `apps/web/src/components/ui/modal.tsx` để tạo `BookingConflictDialog` hoặc `ImportantBookingDialog`. Dialog nhận title, description, selected range, conflict range và actions. Toast vẫn dùng cho success/low-risk feedback.

### 5. Backend vẫn là nguồn sự thật cuối cùng

Frontend calendar chỉ là pre-check. Khi user submit booking, backend vẫn chạy overlap guard và lock. Nếu backend trả conflict sau khi UI từng báo trống, frontend mở dialog lớn để giải thích phòng vừa bị giữ/đặt bởi giao dịch khác.

## Risks / Trade-offs

- [Risk] Search cache 60 giây có thể trả availability cũ sau khi booking mới tạo → Mitigation: availability range check và create booking guard không được phụ thuộc cache search; cân nhắc invalidate/search cache theo room/date khi booking tạo nếu có helper phù hợp.
- [Risk] Calendar theo loại phòng nhiều phòng/nhiều ngày có thể nặng → Mitigation: giới hạn range mặc định 1 tháng, cap tối đa 90 ngày, query chỉ booking overlap range và group trong memory.
- [Risk] Public endpoint có thể lộ pattern booking nếu trả quá nhiều chi tiết → Mitigation: public response chỉ trả availability/count/conflict range, không trả customer hoặc booking code.
- [Risk] Pending quá hạn chưa được cron xử lý có thể vẫn xuất hiện nếu query status đơn thuần → Mitigation: active-hold helper phải xét `approvalDeadline` và `paymentDeadline` với `now`.
- [Risk] Dialog lớn gây khó chịu nếu dùng quá rộng → Mitigation: chỉ dùng cho lỗi chặn đặt phòng/ngày; các feedback nhỏ vẫn dùng toast.

## Migration Plan

- Không cần migration database.
- Thêm backend service/endpoints và tests trước.
- Cập nhật frontend types/API client rồi thêm calendar UI customer/staff.
- Chạy build/test/lint và kiểm tra thủ công luồng chọn range `1/6 -> 4/6` khi đã có booking `3/6 -> 6/6`.
- Rollback bằng cách ẩn route/calendar UI và giữ nguyên create booking guard hiện có.

## Open Questions

- Calendar staff/admin nên đặt ở route mới `/staff/booking-calendar` hay thêm tab trong `/staff/room-map`; proposal nghiêng về route mới để tránh làm room map quá dày.
- Public availability nên ưu tiên theo `roomId` từ search result hay theo `roomTypeId`; implementation nên hỗ trợ cả hai nhưng UI có thể bắt đầu từ room type detail.
