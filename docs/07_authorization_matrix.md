# Tài liệu Phân quyền Hệ thống (Authorization Matrix)

## 1. Mục tiêu
Định nghĩa ma trận quyền truy cập theo vai trò để triển khai RBAC tại API/UI và kiểm thử phân quyền.

## 2. Vai trò hệ thống
- Guest
- Customer
- Staff/Receptionist
- Housekeeping
- Admin
- System (Scheduler/Job)

## 3. Ma trận quyền theo chức năng
| Chức năng | Guest | Customer | Staff | Housekeeping | Admin | System |
| --- | --- | --- | --- | --- | --- | --- |
| Đăng ký/Đăng nhập | C | C | C | C | C | - |
| Xem danh sách phòng | R | R | R | R | R | - |
| Tạo booking | - | C | - | - | C (hỗ trợ) | - |
| Thanh toán booking | - | U | - | - | U (hỗ trợ) | - |
| Xem lịch sử booking cá nhân | - | R | - | - | - | - |
| Hủy booking | - | U (booking của mình) | - | - | U | U (timeout) |
| Check-in/Check-out | - | - | U | - | U | - |
| Cập nhật trạng thái phòng | - | - | U | U | U | - |
| Quản lý room type/room | - | - | - | - | CRUD | - |
| Quản lý pricing rules | - | - | - | - | CRUD | - |
| Quản lý tài khoản staff | - | - | - | - | CRUD | - |
| Xem báo cáo | - | - | R (giới hạn) | - | R | - |
| Gửi thông báo tự động | - | - | - | - | cấu hình | C/U |

Ghi chú ký hiệu: `C` = Create, `R` = Read, `U` = Update, `D` = Delete.

## 4. Quy tắc phân quyền bắt buộc
- Mặc định từ chối nếu không có quyền.
- Endpoint admin bắt buộc role `Admin`.
- Customer chỉ thao tác tài nguyên thuộc sở hữu của chính mình.
- Mọi hành động nhạy cảm của Staff/Admin phải ghi audit log.

## 5. Điểm kiểm thử phân quyền
- Truy cập chéo tài nguyên của user khác phải bị chặn (`403`).
- Token hết hạn hoặc sai định dạng trả về `401`.
- Housekeeping không được thực hiện thao tác quản trị inventory/pricing.
