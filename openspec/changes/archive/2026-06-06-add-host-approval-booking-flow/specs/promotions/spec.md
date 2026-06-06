## MODIFIED Requirements

### Requirement: Sử Dụng Coupon Trong Booking

Luồng booking PHẢI (SHALL) chỉ consume coupon ở bước thanh toán sau khi yêu cầu đặt chỗ đã được duyệt; tạo booking không được consume coupon.

#### Scenario: Tạo booking không consume coupon

- **CHO** customer tạo booking với coupon hợp lệ
- **KHI** tạo booking thành công ở `PENDING_HOST_APPROVAL`
- **THÌ** usage count của coupon KHÔNG được tăng
- **VÀ** user coupon KHÔNG được đánh dấu đã dùng.

#### Scenario: Thanh toán dùng coupon reserve usage

- **CHO** customer khởi tạo thanh toán cho booking đã duyệt với coupon hợp lệ
- **KHI** payment được tạo ở trạng thái `PROCESSING`
- **THÌ** usage count của coupon PHẢI tăng để reserve lượt dùng
- **VÀ** user coupon PHẢI được upsert thành đã dùng với `usedAt`
- **VÀ** booking PHẢI lưu coupon code và discount amount.

#### Scenario: Chuẩn hóa code khi thanh toán

- **CHO** customer gửi coupon code chữ thường ở bước thanh toán
- **KHI** apply coupon
- **THÌ** lookup PHẢI dùng code uppercase.

## ADDED Requirements

### Requirement: Hoàn Tác Coupon Khi Thanh Toán Không Hoàn Tất

Hệ thống PHẢI (SHALL) release coupon reservation khi booking đã reserve coupon nhưng thanh toán không hoàn tất.

#### Scenario: Payment failed release coupon

- **CHO** booking có coupon reservation
- **VÀ** payment chuyển `FAILED`
- **KHI** hệ thống xử lý payment failed
- **THÌ** usage count của coupon PHẢI giảm idempotent
- **VÀ** user coupon PHẢI được đánh dấu chưa dùng nếu không có booking completed khác dùng coupon đó.

#### Scenario: Booking hết hạn thanh toán release coupon

- **CHO** booking có coupon reservation
- **VÀ** booking hết hạn ở `PENDING_PAYMENT` hoặc `PAYING`
- **KHI** cron expire booking
- **THÌ** hệ thống PHẢI release coupon reservation trước hoặc trong cùng transaction chuyển booking sang `EXPIRED`.
