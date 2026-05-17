# Tài liệu API Specification

## 1. Mục tiêu
Định nghĩa hợp đồng API ở mức triển khai cho frontend, backend và tester API.

## 2. Quy ước chung
- **Base URL:** `/api/v1`
- **Content-Type:** `application/json`
- **Auth:** `Authorization: Bearer <access_token>`
- **Response chuẩn:**

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "meta": {}
}
```

## 3. Danh sách endpoint chính
| Module | Method | Endpoint | Mô tả | Auth |
| --- | --- | --- | --- | --- |
| Auth | POST | /auth/register | Đăng ký tài khoản | No |
| Auth | POST | /auth/login | Đăng nhập | No |
| Rooms | GET | /rooms | Tìm kiếm phòng khả dụng | Optional |
| Rooms | GET | /rooms/{id} | Chi tiết phòng | Optional |
| Booking | POST | /bookings | Tạo booking | Customer |
| Booking | GET | /bookings/me | Lịch sử booking của user | Customer |
| Booking | GET | /bookings/{code} | Chi tiết booking | Customer/Staff/Admin |
| Booking | POST | /bookings/{code}/cancel | Hủy booking | Customer/Admin |
| Payment | POST | /payments/{bookingCode}/init | Khởi tạo thanh toán | Customer |
| Payment | POST | /payments/callback/vnpay | Callback từ VNPay | No (signed) |
| Ops | POST | /operations/check-in | Check-in | Staff |
| Ops | POST | /operations/check-out | Check-out | Staff |
| Ops | PATCH | /rooms/{id}/status | Cập nhật trạng thái phòng | Staff/Housekeeping |
| Admin | CRUD | /admin/rooms | Quản trị phòng | Admin |
| Admin | CRUD | /admin/pricing-rules | Quản trị quy tắc giá | Admin |
| Reports | GET | /admin/reports/revenue | Báo cáo doanh thu | Admin |

## 4. API chi tiết mẫu

### 4.1 POST /bookings
**Request**

```json
{
  "roomId": "c5f3...",
  "checkInDate": "2026-06-01",
  "checkOutDate": "2026-06-03",
  "guestCount": 2,
  "contactName": "Nguyen Van A",
  "contactPhone": "0901234567",
  "acceptTerms": true
}
```

**Response thành công**

```json
{
  "success": true,
  "message": "Booking created",
  "data": {
    "bookingCode": "BK202606010001",
    "status": "pending_payment",
    "totalAmount": 2500000,
    "paymentDueAt": "2026-06-01T10:30:00Z"
  }
}
```

### 4.2 POST /payments/callback/vnpay
- **Mục đích:** nhận callback từ VNPay.
- **Validation:** xác thực chữ ký (`secure_hash`) và trạng thái giao dịch.
- **Idempotency key:** `provider_txn_id` + `booking_code`.

## 5. Mã lỗi chuẩn
| Nhóm | Ví dụ | Ý nghĩa |
| --- | --- | --- |
| AUTH_* | AUTH_UNAUTHORIZED | Chưa đăng nhập/phiên hết hạn |
| VALIDATION_* | VALIDATION_INVALID_DATE_RANGE | Dữ liệu đầu vào không hợp lệ |
| BOOKING_* | BOOKING_CONFLICT | Phòng không còn khả dụng |
| PAYMENT_* | PAYMENT_INVALID_SIGNATURE | Callback không hợp lệ |
| SYSTEM_* | SYSTEM_TIMEOUT | Hệ thống hoặc dịch vụ ngoài timeout |

## 6. Kỳ vọng kiểm thử API
- Verify status code và body đúng hợp đồng.
- Verify phân quyền theo role.
- Verify callback lặp không tạo trùng transaction.
- Verify booking timeout không thể thanh toán thành công trực tiếp nếu quá hạn policy.
