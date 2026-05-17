# Tài liệu Database Schema

## 1. Mục tiêu
Mô tả cấu trúc dữ liệu, quan hệ bảng và quy tắc toàn vẹn phục vụ phát triển backend, viết migration và kiểm thử dữ liệu.

## 2. Danh sách bảng chính
| Bảng | Mục đích |
| --- | --- |
| users | Lưu thông tin tài khoản hệ thống |
| roles, permissions, role_permissions | Quản lý phân quyền RBAC |
| room_types | Danh mục loại phòng |
| rooms | Danh mục phòng cụ thể |
| pricing_rules | Quy tắc giá theo thời gian |
| bookings | Header đơn đặt phòng |
| booking_items | Chi tiết phòng theo booking |
| payments | Giao dịch thanh toán |
| extra_services | Danh mục dịch vụ phát sinh |
| booking_services | Dịch vụ phát sinh trên booking |
| reviews | Đánh giá sau lưu trú |
| notifications | Lịch sử thông báo |
| audit_logs | Nhật ký thay đổi quan trọng |

## 3. Đề xuất schema cột trọng yếu

### 3.1 users
| Cột | Kiểu | Ràng buộc |
| --- | --- | --- |
| id | uuid | PK |
| email | varchar(255) | unique, not null |
| password_hash | varchar(255) | not null |
| full_name | varchar(150) | not null |
| phone | varchar(20) | null |
| status | enum(active, locked) | not null |
| created_at | timestamptz | not null |
| updated_at | timestamptz | not null |

### 3.2 rooms
| Cột | Kiểu | Ràng buộc |
| --- | --- | --- |
| id | uuid | PK |
| room_type_id | uuid | FK room_types.id |
| room_number | varchar(50) | unique, not null |
| floor | int | not null |
| status | enum(available,reserved,occupied,dirty,cleaning,maintenance) | not null |
| created_at | timestamptz | not null |

### 3.3 bookings
| Cột | Kiểu | Ràng buộc |
| --- | --- | --- |
| id | uuid | PK |
| booking_code | varchar(30) | unique, not null |
| user_id | uuid | FK users.id |
| check_in_date | date | not null |
| check_out_date | date | not null |
| guest_count | int | not null |
| status | enum(pending_payment,paid,checked_in,completed,cancelled_by_user,cancelled_by_timeout,cancelled_by_admin) | not null |
| total_amount | numeric(14,2) | not null |
| payment_due_at | timestamptz | null |
| created_at | timestamptz | not null |

### 3.4 payments
| Cột | Kiểu | Ràng buộc |
| --- | --- | --- |
| id | uuid | PK |
| booking_id | uuid | FK bookings.id |
| provider | varchar(50) | not null |
| provider_txn_id | varchar(100) | null |
| amount | numeric(14,2) | not null |
| status | enum(pending,success,failed,refunded) | not null |
| callback_payload | jsonb | null |
| created_at | timestamptz | not null |

## 4. Quan hệ dữ liệu
- `users (1) - (n) bookings`
- `room_types (1) - (n) rooms`
- `bookings (1) - (n) booking_items`
- `bookings (1) - (n) payments`
- `bookings (1) - (n) booking_services`
- `users (1) - (n) reviews`

## 5. Ràng buộc toàn vẹn
- Không cho phép `check_out_date <= check_in_date`.
- `booking_items` không được trùng phòng trong cùng khoảng ngày đối với booking đang hoạt động.
- Chỉ cho phép thêm `booking_services` nếu booking ở trạng thái `checked_in`.

## 6. Chỉ mục đề xuất
- `bookings(status, payment_due_at)` cho job timeout.
- `bookings(user_id, created_at desc)` cho lịch sử booking.
- `rooms(status, room_type_id)` cho room map/tìm kiếm.
- `payments(booking_id, status)` cho đối soát thanh toán.

## 7. Dữ liệu cần tester xác minh
- Đồng bộ status booking/phòng theo flow nghiệp vụ.
- Tạo đúng bản ghi payment khi callback thành công/thất bại.
- Có audit log cho thao tác admin/staff quan trọng.
