# Tài liệu Business Rules

## 1. Mục tiêu
Chuẩn hóa toàn bộ quy tắc nghiệp vụ cốt lõi để đảm bảo hệ thống vận hành nhất quán và làm cơ sở thiết kế test case logic/edge/exception.

## 2. Danh sách quy tắc nghiệp vụ
| Mã rule | Nhóm | Quy tắc | Mức ảnh hưởng |
| --- | --- | --- | --- |
| BR-01 | Account | Email là duy nhất toàn hệ thống | Cao |
| BR-02 | Account | Mật khẩu tối thiểu 8 ký tự, có chữ và số | Cao |
| BR-03 | Search | Check-out phải lớn hơn check-in | Cao |
| BR-04 | Booking | Không cho phép overbooking cùng thời điểm | Rất cao |
| BR-05 | Booking | Booking mới tạo ở trạng thái PendingPayment | Cao |
| BR-06 | Booking | Booking quá hạn thanh toán bị hủy tự động | Cao |
| BR-07 | Payment | Callback thanh toán phải xác thực chữ ký | Rất cao |
| BR-08 | Payment | Callback lặp phải idempotent | Rất cao |
| BR-09 | Cancellation | Customer chỉ hủy booking của chính mình | Cao |
| BR-10 | Cancellation | Không hủy booking đã CheckedIn | Cao |
| BR-11 | Operation | Check-out chuyển phòng sang Dirty | Cao |
| BR-12 | Service | Chỉ thêm dịch vụ phát sinh cho booking CheckedIn | Cao |
| BR-13 | Pricing | Giá theo mùa/sự kiện ưu tiên cao hơn giá mặc định | Cao |
| BR-14 | RBAC | Chỉ Admin quản lý inventory, giá, tài khoản staff | Rất cao |

## 3. Quy tắc chi tiết theo module

### 3.1 Booking và giữ phòng
- Giữ phòng tạm thời bắt đầu khi tạo booking thành công.
- Khi booking `PendingPayment`, inventory tương ứng phải được khóa tạm cho đến `payment_due_at`.
- Khi booking bị hủy timeout/user/admin, inventory phải được giải phóng ngay.

### 3.2 Payment và đối soát
- Mỗi callback cần kiểm tra đầy đủ chữ ký/hash và mã giao dịch provider.
- Nếu cùng transaction callback nhiều lần, hệ thống chỉ ghi nhận 1 lần có hiệu lực.
- Nếu callback thành công đến sau khi booking timeout, chuyển trạng thái xử lý tranh chấp để staff/admin đối soát.

### 3.3 Cancellation policy
- Customer được hủy khi booking ở trạng thái `PendingPayment` hoặc `Paid` và còn trong cửa sổ hủy cho phép.
- Booking `CheckedIn` không thể hủy từ phía customer.
- Admin có quyền hủy cưỡng chế khi có sự cố vận hành, bắt buộc ghi audit log.

### 3.4 Pricing
- Giá cuối cùng của một đêm được tính theo ưu tiên:
  1. Giá sự kiện/ngày lễ.
  2. Giá theo mùa.
  3. Giá mặc định room type.
- Nếu nhiều rule cùng mức ưu tiên và trùng ngày, áp dụng rule có thời điểm cập nhật mới nhất.

### 3.5 Vận hành phòng
- Check-in hợp lệ chỉ khi booking `Paid` và phòng không ở `Maintenance`.
- Check-out hoàn tất mới cho phép chuyển booking `Completed`.
- Sau check-out, phòng bắt buộc đi qua `Dirty` trước khi `Available`.

## 4. Rule validation dữ liệu
| Đối tượng | Điều kiện | Thông điệp lỗi gợi ý |
| --- | --- | --- |
| Email | Đúng định dạng, chưa tồn tại | Email không hợp lệ hoặc đã tồn tại |
| Password | >= 8 ký tự | Mật khẩu chưa đạt yêu cầu bảo mật |
| Date range | check-out > check-in | Khoảng ngày lưu trú không hợp lệ |
| Quantity/Amount | > 0 | Giá trị phải lớn hơn 0 |
| Capacity | guests <= room_capacity | Số khách vượt sức chứa phòng |

## 5. Quy tắc audit và truy vết
- Các thao tác thay đổi trạng thái booking, payment, room, pricing đều phải ghi audit.
- Audit tối thiểu gồm: actor, action, timestamp, old_value, new_value, correlation_id.
