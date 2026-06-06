## Why

Người dùng và staff hiện chỉ biết phòng trống sau khi search hoặc submit booking, nên trường hợp chọn một khoảng ngày bị overlap vẫn chưa được nhìn thấy rõ trước khi thao tác. Các lỗi quan trọng như phòng đã có người đặt cũng đang dễ bị bỏ qua nếu chỉ hiển thị toast nhỏ, trong khi luồng đặt phòng cần cảnh báo rõ để tránh hiểu nhầm đã giữ được chỗ.

## What Changes

- Thêm API availability calendar để trả lịch bận/trống của phòng hoặc loại phòng theo khoảng ngày, dùng cùng rule overlap và active-hold statuses với luồng tạo booking.
- Thêm calendar UI cho admin/staff để xem từng phòng đang có booking nào theo ngày, trạng thái booking, khách và khoảng lưu trú.
- Thêm UI availability calendar phía user trên trang chi tiết phòng/đặt phòng, disable hoặc cảnh báo rõ các ngày/range không thể đặt.
- Khi user chọn range ngày overlap, hệ thống PHẢI báo lỗi ngay trên UI bằng dialog lớn giữa màn hình, không chỉ bằng popup/toast nhỏ.
- Giữ backend guard khi tạo booking để chặn race condition nếu availability thay đổi sau khi user đã xem lịch.
- Chuẩn hóa thông báo lỗi đặt phòng quan trọng thành dialog có tiêu đề, mô tả, khoảng ngày bị trùng và hành động chọn lại ngày/tìm phòng khác.

## Capabilities

### New Capabilities

- `booking-availability-calendar`: Lịch availability cho phòng/loại phòng, calendar admin/staff, calendar user và cảnh báo dialog khi chọn khoảng ngày không thể đặt.

### Modified Capabilities

- `room-search-pricing`: Search và availability public phải dùng chung rule xác định phòng bị giữ chỗ theo overlap ngày.
- `booking-lifecycle`: Tạo booking tiếp tục là guard cuối cùng và phải trả lỗi rõ khi khoảng ngày bị overlap.
- `staff-operations`: Staff/admin cần xem lịch booking theo phòng/ngày thay vì chỉ xem sơ đồ phòng trạng thái hiện tại.
- `customer-engagement`: UI phía customer cần hiển thị thông báo lỗi đặt phòng quan trọng bằng dialog lớn giữa màn hình thay vì toast nhỏ.

## Impact

- Backend: thêm service/helper dùng chung cho active booking overlap, thêm endpoint availability public và staff/admin calendar.
- Frontend customer: cập nhật trang chi tiết phòng, search/booking flow và modal/dialog cảnh báo range ngày không hợp lệ hoặc bị thuê.
- Frontend staff/admin: thêm route hoặc tab calendar trong khu vực staff/admin để xem lịch thuê theo ngày, phòng, trạng thái booking.
- Tests: thêm unit/integration tests cho overlap calendar, search/create booking consistency, và UI/manual verification cho dialog cảnh báo.
