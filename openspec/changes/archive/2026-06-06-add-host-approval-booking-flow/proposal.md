## Why

Luồng booking hiện tại cho khách tạo đơn ở trạng thái chờ thanh toán ngay sau khi chọn phòng, trong khi yêu cầu nghiệp vụ mới cần chủ home/admin xét duyệt yêu cầu đặt chỗ trước rồi mới cho khách thanh toán. Thay đổi này giảm rủi ro thu tiền cho đơn chưa được xác nhận, đồng thời bổ sung tương tác duyệt, thông báo realtime và chat trong giai đoạn chờ duyệt.

## What Changes

- **BREAKING**: Tạo booking không còn chuyển thẳng sang `PENDING_PAYMENT`; đơn mới phải vào trạng thái chờ duyệt yêu cầu đặt chỗ trong tối đa 24 giờ.
- Thêm bước admin/receptionist kiểm tra trạng thái phòng, trao đổi với khách qua chat và duyệt/từ chối yêu cầu đặt trước khi khách được thanh toán.
- Sau khi yêu cầu được duyệt, hệ thống gửi thông báo realtime và email cho khách, chuyển đơn sang chờ thanh toán và đặt deadline thanh toán ngắn hạn 30 phút mặc định, cấu hình được tối đa 2 giờ.
- Chỉ cho phép khách khởi tạo thanh toán khi đơn đã được duyệt và đang chờ thanh toán; coupon/mã giảm giá được áp dụng ở bước thanh toán thay vì tiêu thụ ngay khi tạo yêu cầu đặt.
- Tự động hủy yêu cầu đặt chỗ nếu không được duyệt trong 24 giờ; tự động hủy đơn đã duyệt nếu khách không thanh toán trước deadline thanh toán.
- Bổ sung thanh thông báo và cơ chế nhận thông báo realtime phía user cho các sự kiện duyệt, từ chối, hết hạn và yêu cầu thanh toán.
- Điều chỉnh báo cáo/admin queue để phản ánh luồng chờ duyệt yêu cầu đặt chỗ, không chỉ duyệt biên lai chuyển khoản.

## Capabilities

### New Capabilities

- `realtime-notifications`: thông báo trong ứng dụng và realtime delivery cho user khi booking đổi trạng thái quan trọng.

### Modified Capabilities

- `booking-lifecycle`: đổi trạng thái khởi tạo booking sang chờ duyệt, thêm duyệt yêu cầu đặt chỗ 24 giờ, hủy quá hạn, và phân biệt duyệt yêu cầu đặt với duyệt biên lai.
- `payments`: chỉ cho thanh toán sau khi booking được duyệt; chuyển áp dụng coupon sang lúc khởi tạo/thực hiện thanh toán và cập nhật deadline thanh toán 30 phút đến tối đa 2 giờ.
- `promotions`: thay đổi thời điểm consume coupon từ lúc tạo booking sang lúc thanh toán thành công hoặc lúc khởi tạo thanh toán theo chính sách chống dùng trùng.
- `customer-engagement`: bổ sung thanh thông báo user, nhận thông báo realtime và gắn chat với booking đang chờ duyệt.
- `staff-operations`: mở rộng queue duyệt để admin/receptionist xử lý yêu cầu đặt chỗ, xem trạng thái phòng và chat với khách khi đơn chờ duyệt.
- `admin-reporting`: cập nhật thống kê/trang admin để phân biệt đơn chờ duyệt yêu cầu, đơn chờ thanh toán, đơn được xác nhận, đơn bị từ chối và đơn hết hạn.

## Impact

- Backend: Prisma schema/migration cho trạng thái hoặc metadata duyệt mới; booking service/controller; payment service/controller; coupon usage; cron expire jobs; notification service; chat service; staff/admin endpoints.
- Frontend: trang booking, trang thanh toán, lịch sử/chi tiết booking, thanh thông báo realtime, staff/admin pending booking queue, room map/context duyệt, chat trong trạng thái chờ duyệt.
- API: thay đổi response và trạng thái hợp lệ của `/bookings`, `/payments/initiate`, `/bookings/staff/pending`, `/bookings/:id/approve`, `/bookings/:id/reject`; có thể cần endpoint riêng cho request approval để không lẫn với duyệt biên lai.
- Dữ liệu: cần migration/backfill cho booking đang `PENDING_PAYMENT` hoặc `PENDING_APPROVAL`; cần tránh dùng chung nghĩa `PENDING_APPROVAL` cho cả chờ duyệt request và chờ duyệt biên lai nếu không có discriminator rõ ràng.
- Hệ thống phụ trợ: realtime có thể dùng polling/SSE/WebSocket tùy hạ tầng; scheduler cần xử lý cả deadline duyệt 24 giờ và deadline thanh toán sau duyệt.
