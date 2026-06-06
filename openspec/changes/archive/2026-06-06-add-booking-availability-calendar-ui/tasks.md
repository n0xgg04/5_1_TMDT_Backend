## 1. Backend Availability Core

- [x] 1.1 Tạo `AvailabilityService` hoặc helper tương đương để gom rule active-hold statuses và overlap query dùng chung.
- [x] 1.2 Implement helper kiểm tra active booking overlap theo `roomId`, `checkIn`, `checkOut`, có xét `approvalDeadline` và `paymentDeadline`.
- [x] 1.3 Refactor `SearchService` dùng helper availability để lấy booked room ids thay vì giữ logic overlap riêng.
- [x] 1.4 Refactor `BookingsService` dùng helper availability trong create booking và approve request conflict checks.
- [x] 1.5 Đảm bảo pending quá hạn không chặn availability/search/create sau khi deadline đã qua.
- [x] 1.6 Cập nhật shared/backend types cho response availability, day status, conflict summary và staff calendar block.

## 2. Backend Public Availability API

- [x] 2.1 Thêm DTO/query validation cho `from`, `to`, `roomId`, `roomTypeId`, giới hạn range tối đa an toàn.
- [x] 2.2 Thêm public endpoint availability theo phòng để trả danh sách ngày `available`, `held`, `booked`.
- [x] 2.3 Thêm public endpoint availability theo loại phòng để trả số phòng còn trống từng ngày.
- [x] 2.4 Thêm endpoint kiểm tra range availability trả `available`, selected range và conflict ranges tối thiểu.
- [x] 2.5 Đảm bảo public availability không trả customer name, booking code hoặc dữ liệu payment.
- [x] 2.6 Chuẩn hóa lỗi ngày không hợp lệ và check-out không sau check-in theo message hiện có.

## 3. Backend Staff/Admin Calendar API

- [x] 3.1 Thêm endpoint staff/admin booking calendar với role guard `RECEPTIONIST` và `ADMIN`.
- [x] 3.2 Endpoint calendar trả rooms theo filter `from`, `to`, `roomTypeId`, `floor` và booking active overlap.
- [x] 3.3 Booking block trả id, bookingCode, status, checkIn/checkOut, room summary và customer summary.
- [x] 3.4 Không hiển thị booking pending quá hạn như block giữ phòng trong staff calendar.
- [x] 3.5 Thêm metadata đủ để frontend điều hướng tới duyệt yêu cầu, duyệt biên lai hoặc booking detail theo status.

## 4. Customer Frontend Availability UI

- [x] 4.1 Cập nhật frontend types cho availability day, range check response và booking conflict dialog data.
- [x] 4.2 Thêm component calendar user hiển thị ngày trống/bận, số phòng còn trống và trạng thái không thể đặt.
- [x] 4.3 Gắn availability calendar vào trang chi tiết loại phòng hoặc khu vực chọn ngày của user.
- [x] 4.4 Gắn range availability check khi user thay đổi check-in/check-out hoặc trước khi sang booking page.
- [x] 4.5 Disable hoặc đánh dấu rõ ngày không thể đặt; không để user hiểu nhầm ngày đã thuê là khả dụng.
- [x] 4.6 Khi range bị conflict, mở dialog lớn giữa màn hình với khoảng ngày đã chọn và hành động chọn lại ngày/tìm phòng khác.
- [x] 4.7 Khi backend create booking trả lỗi overlap, mở cùng dialog lớn thay vì chỉ toast nhỏ.

## 5. Staff/Admin Calendar Frontend

- [x] 5.1 Thêm route hoặc tab staff/admin calendar, ưu tiên route `/staff/booking-calendar`.
- [x] 5.2 Thêm navigation/sidebar entry cho staff/admin calendar.
- [x] 5.3 Build calendar grid phòng theo hàng, ngày theo cột, responsive cho desktop và mobile.
- [x] 5.4 Hiển thị booking block với màu/nhãn phân biệt `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED`, `CHECKED_IN`.
- [x] 5.5 Thêm filter tháng/range ngày, loại phòng và tầng; refresh query bằng React Query.
- [x] 5.6 Click booking block điều hướng tới màn xử lý phù hợp: duyệt yêu cầu, duyệt biên lai hoặc booking detail.
- [x] 5.7 Đảm bảo text trong block calendar không tràn layout ở mobile/desktop.

## 6. Important Booking Dialog

- [x] 6.1 Tạo component `BookingConflictDialog` hoặc `ImportantBookingDialog` dùng `Modal` hiện có.
- [x] 6.2 Dialog hiển thị title, mô tả, selected range, conflict range nếu có, và CTA chọn lại ngày.
- [x] 6.3 Thêm CTA tìm phòng khác giữ lại ngày/khách hiện tại trong query params.
- [x] 6.4 Chỉ dùng dialog cho lỗi ảnh hưởng quyết định đặt phòng; giữ toast cho feedback nhỏ như wishlist hoặc refresh.
- [x] 6.5 Đảm bảo dialog focus/close behavior phù hợp và không tự submit lại booking cũ.

## 7. Tests And Validation

- [x] 7.1 Thêm backend tests cho helper overlap với case `1/6 -> 4/6` conflict booking `3/6 -> 6/6`.
- [x] 7.2 Thêm backend tests cho pending quá hạn không chặn availability/search.
- [x] 7.3 Thêm backend tests cho public availability không lộ customer/booking code.
- [x] 7.4 Thêm backend tests cho staff calendar role guard và response booking blocks.
- [x] 7.5 Thêm frontend tests hoặc focused manual verification cho user calendar, dialog conflict, và staff calendar.
- [x] 7.6 Chạy `pnpm --filter @hotel/api db:generate` nếu Prisma client cần, `pnpm test`, `pnpm lint`, API/web build và `openspec validate add-booking-availability-calendar-ui --strict`.
