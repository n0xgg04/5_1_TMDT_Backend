# Tài liệu Acceptance Criteria

## 1. Mục tiêu
Xác định điều kiện pass/fail ở mức nghiệp vụ cho từng nhóm chức năng, làm chuẩn nghiệm thu giữa BA, PM, Dev và Tester.

## 2. Tiêu chí nghiệm thu tổng quát
- Không overbooking trong các tình huống đặt đồng thời.
- Trạng thái booking, payment, room cập nhật nhất quán theo flow.
- Phân quyền đúng theo role, không lộ dữ liệu trái phép.
- Luồng thanh toán callback xử lý an toàn, idempotent.

## 3. Acceptance criteria theo module

### 3.1 Auth & Profile
| Mã | Điều kiện pass |
| --- | --- |
| AC-AUTH-01 | Đăng ký thành công khi email hợp lệ và chưa tồn tại |
| AC-AUTH-02 | Từ chối đăng ký khi email trùng |
| AC-AUTH-03 | Đăng nhập thành công trả access token hợp lệ |
| AC-AUTH-04 | User chỉ sửa được profile của chính mình |

### 3.2 Search & Booking
| Mã | Điều kiện pass |
| --- | --- |
| AC-BK-01 | Chỉ hiển thị phòng khả dụng trong khoảng ngày yêu cầu |
| AC-BK-02 | Booking mới tạo có trạng thái `PendingPayment` |
| AC-BK-03 | Booking có `payment_due_at` hợp lệ |
| AC-BK-04 | Hai yêu cầu đặt đồng thời cùng phòng chỉ 1 yêu cầu thành công |

### 3.3 Payment
| Mã | Điều kiện pass |
| --- | --- |
| AC-PAY-01 | Callback hợp lệ cập nhật payment `success` và booking `paid` |
| AC-PAY-02 | Callback sai chữ ký bị từ chối và ghi log |
| AC-PAY-03 | Callback lặp không tạo bản ghi thanh toán trùng |

### 3.4 Operations
| Mã | Điều kiện pass |
| --- | --- |
| AC-OPS-01 | Check-in chỉ thực hiện được với booking đã thanh toán |
| AC-OPS-02 | Check-out tạo tổng kết chi phí đầy đủ |
| AC-OPS-03 | Sau check-out, trạng thái phòng chuyển `Dirty` |

### 3.5 Scheduler & Notification
| Mã | Điều kiện pass |
| --- | --- |
| AC-SYS-01 | Booking quá hạn thanh toán bị chuyển `CancelledByTimeout` |
| AC-SYS-02 | Inventory được giải phóng ngay sau khi timeout cancel |
| AC-SYS-03 | Thông báo gửi đúng sự kiện và ghi nhận lịch sử gửi |

## 4. Danh sách kiểm tra nghiệm thu UAT
- Kiểm tra end-to-end từ tìm phòng đến checkout hoàn tất.
- Kiểm tra các nhánh lỗi: hết phòng, callback sai, token hết hạn.
- Kiểm tra dữ liệu báo cáo phản ánh đúng giao dịch phát sinh.
- Kiểm tra audit log cho thao tác nhạy cảm của admin/staff.
