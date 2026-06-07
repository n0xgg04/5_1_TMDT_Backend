## 1. Database Schema

- [x] 1.1 Thêm enum `BillStatus` (PENDING, PAID, EXPIRED, CANCELLED) vào Prisma schema
- [x] 1.2 Thêm model `Bill` với fields: id, bookingId (unique), paymentCode (unique), amount, status, paymentDeadline, accountNumber, bankName, accountHolder, paidAt, createdAt, updatedAt
- [x] 1.3 Thêm model `BankTransaction` với fields: id, gatewayTransactionId (unique), gateway, transactionDate, accountNumber, subAccount, code, content, transferType, description, transferAmount, accumulated, referenceCode, rawPayload (JSON), matchStatus (MATCHED/MISMATCH/UNMATCHED/LATE_PAYMENT), matchedBillId (optional FK), createdAt
- [x] 1.4 Thêm relation: `Bill` 1-1 với `Booking`, `BankTransaction` optional belongs-to `Bill`
- [x] 1.5 Chạy migration `pnpm --filter api prisma migrate dev`

## 2. Module Sepay Webhook

- [x] 2.1 Tạo `SepayWebhookModule`, `SepayWebhookController`, `SepayWebhookService` trong `apps/api/src/sepay/`
- [x] 2.2 Implement `POST /webhooks/sepay` endpoint với `@Public()` decorator
- [x] 2.3 Cấu hình raw body parser cho route webhook (dùng `rawBody` option trong NestFactory)
- [x] 2.4 Implement HMAC-SHA256 verification: đọc raw body, tính `HMAC(timestamp + "." + rawBody, secret)`, so sánh constant-time với header `X-SePay-Signature`
- [x] 2.5 Implement timestamp check (±5 phút) để chống replay attack
- [x] 2.6 Implement lưu raw payload vào `BankTransaction` với try-catch unique constraint violation để chống trùng
- [x] 2.7 Implement phản hồi nhanh HTTP 200 `{"success": true}` ngay sau khi lưu transaction thành công
- [x] 2.8 Implement xử lý bất đồng bộ khớp giao dịch (gọi `MatchService` sau khi phản hồi)

## 3. Module Quản Lý Bill

- [x] 3.1 Tạo `BillModule`, `BillService` trong `apps/api/src/bills/`
- [x] 3.2 Implement `createBill(bookingId)` — sinh `paymentCode` = `SS-<bookingCode>`, lấy account info từ cấu hình Sepay, set amount và deadline từ booking
- [x] 3.3 Implement `getBillByBookingId(bookingId)` trả bill kèm thông tin tài khoản nhận
- [x] 3.4 Implement `updateBillStatus(billId, status)` cập nhật trạng thái bill
- [x] 3.5 Gọi `createBill` tự động khi staff duyệt yêu cầu đặt chỗ (`approveRequest` trong `BookingsService`)
- [x] 3.6 Cập nhật bill status khi booking expired/cancelled (trong `expireBooking` và `cancelBooking`)

## 4. Module Khớp Giao Dịch (Match Service)

- [x] 4.1 Tạo `MatchService` trong `apps/api/src/sepay/`
- [x] 4.2 Implement `parsePaymentCode(content, code)` — parse `code` field trước, nếu null thì regex `SS-[A-Z0-9]+` từ `content`
- [x] 4.3 Implement `matchTransaction(transaction)` — tìm bill theo paymentCode, kiểm tra amount, trạng thái bill
- [x] 4.4 Case MATCHED: update bill `PAID`, payment `COMPLETED`, emit `payment.success`
- [x] 4.5 Case MISMATCH (sai amount): set transaction matchStatus `MISMATCH` (staff được thông báo qua log)
- [x] 4.6 Case UNMATCHED (không tìm thấy bill): set matchStatus `UNMATCHED`
- [x] 4.7 Case LATE_PAYMENT (bill expired/cancelled): set matchStatus `LATE_PAYMENT`
- [x] 4.8 Bỏ qua giao dịch `transferType = out`

## 5. Sửa Đổi Payment Flow

- [x] 5.1 Sửa `PaymentsService.initiatePayment` cho `BANK_TRANSFER`: gọi `BillService.createBill` nếu chưa có bill, trả `paymentCode` + thông tin tài khoản
- [x] 5.2 Thêm endpoint `GET /bookings/:id/bill` để customer/staff xem bill
- [x] 5.3 Sửa `PaymentsService.getPaymentByBookingId` kèm bill khi method là `BANK_TRANSFER`
- [x] 5.4 Giữ endpoint upload receipt nhưng không yêu cầu cho luồng Sepay (backward compatible)

## 6. Cron Đối Soát

- [x] 6.1 Tạo `SepayReconciliationService` trong `apps/api/src/sepay/` dùng pattern HTTP cron
- [x] 6.2 Implement gọi Sepay API `/transactions` với API key từ biến môi trường
- [x] 6.3 Implement filter transaction đã có trong DB, insert transaction mới, gọi `MatchService.matchTransaction`
- [x] 6.4 Thêm endpoint `POST /internal/cron/sepay-reconciliation` vào CronController
- [x] 6.5 Implement cơ chế chống chạy chồng lấn (running flag)
- [x] 6.6 Skip nếu thiếu `SEPAY_API_KEY`

## 7. Biến Môi Trường & Cấu Hình

- [x] 7.1 Thêm `SEPAY_WEBHOOK_SECRET` vào `.env.example`
- [x] 7.2 Thêm `SEPAY_API_KEY` vào `.env.example`
- [x] 7.3 Thêm `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_NAME`, `SEPAY_ACCOUNT_HOLDER` vào `.env.example`
- [x] 7.4 Validate biến môi trường khi khởi động (log warning nếu thiếu, disable Sepay features)

## 8. Frontend Cập Nhật

- [x] 8.1 Cập nhật trang booking hiển thị mã thanh toán và hướng dẫn chuyển khoản thay vì upload biên lai
- [x] 8.2 Cập nhật `BookingStatePanel` để hiển thị trạng thái bill và hướng dẫn chuyển khoản
- [x] 8.3 Cập nhật trang chi tiết booking (`/my-bookings/[id]`) hiển thị paymentCode và trạng thái bill
- [x] 8.4 Ẩn nút upload biên lai ở giao diện customer cho luồng Sepay
- [x] 8.5 Cập nhật staff dashboard — ẩn hoặc đánh dấu deprecated mục duyệt biên lai

## 9. Testing

- [ ] 9.1 Viết unit test cho `SepayWebhookService` — verify HMAC, parse paymentCode, chống trùng
- [ ] 9.2 Viết unit test cho `MatchService` — 4 case khớp (matched, mismatch, unmatched, late_payment)
- [ ] 9.3 Viết unit test cho `BillService` — tạo bill, cập nhật trạng thái
- [ ] 9.4 Viết integration test cho webhook endpoint — mock Sepay payload, verify response và side effects
- [ ] 9.5 Viết e2e test cho luồng BANK_TRANSFER đầy đủ: duyệt booking → khởi tạo payment → webhook đến → booking confirmed
