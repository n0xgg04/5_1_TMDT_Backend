# Tài liệu Environment và Test Account

## 1. Mục tiêu
Chuẩn hóa thông tin môi trường kiểm thử, tài khoản mẫu và dữ liệu seed để QA/Dev/BA thực hiện kiểm thử nhất quán.

## 2. Môi trường
| Môi trường | Mục đích | URL đề xuất |
| --- | --- | --- |
| Local | Dev tự kiểm thử | `http://localhost:3000` (web), `http://localhost:4000/api/v1` (api) |
| Dev | Tích hợp nội bộ | `https://dev-hotel-booking.example.com` |
| Staging | Regression/UAT | `https://stg-hotel-booking.example.com` |

## 3. Test account chuẩn
| Vai trò | Email | Mật khẩu mẫu | Ghi chú |
| --- | --- | --- | --- |
| Admin | `admin.test@hotel.local` | `Admin@12345` | Toàn quyền quản trị |
| Staff | `staff.test@hotel.local` | `Staff@12345` | Check-in/check-out |
| Housekeeping | `housekeeping.test@hotel.local` | `House@12345` | Cập nhật dọn phòng |
| Customer A | `customer01.test@hotel.local` | `Customer@12345` | Có lịch sử booking |
| Customer B | `customer02.test@hotel.local` | `Customer@12345` | Dùng test overbooking |

## 4. Dữ liệu mẫu cần có
- Tối thiểu 3 loại phòng, mỗi loại 5 phòng.
- Dữ liệu pricing rule: mặc định, mùa cao điểm, ngày lễ.
- Dữ liệu booking theo trạng thái: pending_payment, paid, checked_in, completed, cancelled.
- Dữ liệu payment gồm cả success và failed.

## 5. Cấu hình tích hợp ngoài cho test
| Thành phần | Môi trường test | Ghi chú |
| --- | --- | --- |
| VNPay | Sandbox | Dùng callback URL staging/dev |
| Email | Resend sandbox domain | Chỉ gửi tới mailbox test |
| Redis | Upstash test instance | Dùng lock/caching |

## 6. Pre-condition cho tester trước khi chạy test
1. Xác nhận DB đã seed đầy đủ dữ liệu mẫu.
2. Xác nhận scheduler bật để test timeout.
3. Xác nhận callback endpoint public cho payment sandbox.
4. Xác nhận thời gian hệ thống và timezone đồng nhất.

## 7. Danh sách smoke test sau mỗi lần deploy
- Đăng nhập bằng tài khoản admin và customer.
- Tìm kiếm phòng có kết quả.
- Tạo booking mới thành công.
- Thanh toán sandbox callback về hệ thống.
- Staff check-in/check-out thành công.
