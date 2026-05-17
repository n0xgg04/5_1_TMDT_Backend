# Tài liệu SRS - Requirement Specification

## 1. Mục tiêu tài liệu
Tài liệu này mô tả yêu cầu phần mềm cho hệ thống đặt phòng khách sạn trực tuyến, làm nguồn chuẩn cho BA, Developer, Tester và PM trong quá trình phân tích, phát triển, kiểm thử và nghiệm thu.

## 2. Phạm vi hệ thống

### 2.1 Trong phạm vi
- Quản lý tài khoản và xác thực người dùng.
- Tìm kiếm phòng theo ngày ở, số khách, loại phòng, khoảng giá, tiện nghi.
- Tạo booking, giữ chỗ tạm thời và thanh toán trực tuyến.
- Quản lý vòng đời booking: PendingPayment, Paid, CheckedIn, Completed, các trạng thái hủy.
- Vận hành nội bộ: room map, check-in/check-out, housekeeping, dịch vụ phát sinh.
- Quản trị: inventory, pricing rules, tài khoản staff, phân quyền, báo cáo.
- Tự động hóa: gửi thông báo và hủy đơn quá hạn thanh toán.

### 2.2 Ngoài phạm vi
- Quản lý chuỗi khách sạn đa thương hiệu phức tạp.
- Dynamic pricing theo AI thời gian thực.
- Tích hợp CRM/ERP lớn.

## 3. Actor và vai trò
| Actor | Mô tả | Mục tiêu chính |
| --- | --- | --- |
| Guest | Người dùng chưa đăng nhập | Tìm phòng, xem thông tin, đăng ký/đăng nhập |
| Customer | Khách đã đăng nhập | Đặt phòng, thanh toán, quản lý lịch sử, đánh giá |
| Staff/Receptionist | Nhân viên lễ tân | Check-in/check-out, quản lý phòng vận hành |
| Housekeeping | Nhân viên buồng phòng | Cập nhật trạng thái dọn dẹp |
| Admin | Quản trị hệ thống | Quản lý dữ liệu, cấu hình giá, báo cáo, phân quyền |
| System Scheduler | Tác vụ nền | Hủy booking timeout, gửi thông báo tự động |

## 4. Danh sách chức năng chính
1. Authentication & Profile.
2. Room Discovery.
3. Booking Creation.
4. Payment Integration.
5. Booking History & Cancellation.
6. Review & Feedback.
7. Room Map & Room Status.
8. Check-in/Check-out.
9. Extra Services.
10. Inventory Management.
11. Pricing Rules Management.
12. Staff Account & RBAC.
13. Reporting.
14. Notification & Scheduler.

## 5. Mô tả nghiệp vụ theo module

### 5.1 Authentication & Profile
- **Input:** email/điện thoại, mật khẩu, dữ liệu hồ sơ.
- **Output:** token/session, thông tin profile, lỗi validate.
- **Business rules:**
  - Email là duy nhất.
  - Mật khẩu tối thiểu 8 ký tự, có chữ hoa/chữ thường/số.
  - User chỉ sửa profile của chính mình; Admin được khóa/mở khóa tài khoản.

### 5.2 Tìm kiếm phòng
- **Input:** check-in, check-out, số khách, bộ lọc phòng.
- **Output:** danh sách phòng khả dụng + giá.
- **Validation:** check-out > check-in; số khách <= sức chứa phòng.

### 5.3 Tạo booking
- **Input:** room_id, thời gian ở, thông tin liên hệ.
- **Output:** booking_code, total_amount, status.
- **Business rules:**
  - Re-check availability tại thời điểm submit.
  - Booking tạo ở trạng thái `PendingPayment`.
  - Có `payment_due_at`; quá hạn sẽ hủy tự động.

### 5.4 Thanh toán
- **Input:** booking_code, payment_method, callback payload.
- **Output:** payment_result, booking_status.
- **Business rules:**
  - Verify chữ ký callback theo provider.
  - Idempotent callback để tránh cập nhật trùng.
  - Trường hợp callback trễ cần đối soát theo policy tranh chấp.

### 5.5 Check-in/Check-out
- **Check-in:** chỉ áp dụng cho booking hợp lệ đã thanh toán.
- **Check-out:** tổng kết chi phí, chuyển phòng sang trạng thái `Dirty`.
- **Extra charges:** trả phòng trễ và dịch vụ phát sinh cộng vào hóa đơn cuối.

## 6. Luồng nghiệp vụ tổng quát

### 6.1 Luồng đặt phòng chuẩn
1. Customer tìm phòng khả dụng.
2. Chọn phòng và tạo booking.
3. Hệ thống giữ chỗ tạm thời (`PendingPayment`).
4. Customer thanh toán qua cổng thanh toán.
5. Callback thành công -> booking `Paid`.
6. Staff thực hiện check-in/check-out.
7. Booking `Completed`, customer có thể đánh giá.

### 6.2 Luồng hủy do timeout
`Scheduler -> quét booking quá payment_due_at -> cập nhật CancelledByTimeout -> giải phóng inventory -> gửi thông báo`

## 7. Trạng thái dữ liệu cốt lõi

### 7.1 Booking status
| Nhóm | Trạng thái |
| --- | --- |
| Hoạt động | PendingPayment, Paid, CheckedIn |
| Kết thúc | Completed |
| Hủy | CancelledByUser, CancelledByTimeout, CancelledByAdmin |

### 7.2 Room status
`Available`, `Reserved`, `Occupied`, `Dirty`, `Cleaning`, `Maintenance`

## 8. Quy tắc validate tổng hợp
| Nhóm | Rule |
| --- | --- |
| Auth | Email đúng định dạng và duy nhất; mật khẩu đủ mạnh |
| Search | Ngày hợp lệ; số khách không vượt sức chứa |
| Booking | Không overbooking; phải chấp nhận điều khoản |
| Payment | Callback hợp lệ chữ ký; trạng thái cập nhật idempotent |
| Cancellation | Chỉ hủy trong cửa sổ cho phép; không hủy booking đã check-in |
| Extra Service | Chỉ thêm cho booking đang lưu trú; giá/số lượng > 0 |

## 9. Yêu cầu phi chức năng
- **Hiệu năng:** API phổ biến phản hồi <= 2 giây ở tải trung bình.
- **Bảo mật:** HTTPS, hash password mạnh, RBAC, rate limit endpoint nhạy cảm.
- **Tính sẵn sàng:** có health check, logging cấu trúc, giám sát lỗi.
- **Dữ liệu:** backup định kỳ và kiểm thử phục hồi.

## 10. Tiêu chí hoàn thành nghiệp vụ
- Không phát sinh overbooking trong tình huống đồng thời.
- Trạng thái booking/phòng luôn đồng bộ theo vòng đời nghiệp vụ.
- Quyền truy cập theo role được kiểm soát đầy đủ.
- Báo cáo doanh thu và occupancy phản ánh đúng dữ liệu thực tế.
