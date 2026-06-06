# Đặc Tả Nền Tảng API

## Purpose

Định nghĩa các hành vi nền tảng dùng chung: version API, validation, error envelope, public/protected route, phân quyền, throttling, CORS, Redis, event bus, notification và cron.

## Requirements

### Requirement: API REST Có Version

Hệ thống PHẢI (SHALL) phục vụ endpoint backend dưới prefix toàn cục `/api` và version URI `/v1`.

#### Scenario: URL endpoint có version

- **CHO** controller có path `auth`
- **KHI** ứng dụng được cấu hình
- **THÌ** route runtime PHẢI nằm dưới `/api/v1/auth`.

#### Scenario: Swagger ở môi trường không production

- **CHO** API chạy ngoài production
- **KHI** Nest app khởi động
- **THÌ** Swagger UI PHẢI có tại `/api/docs`.

#### Scenario: Tắt Swagger ở production

- **CHO** `NODE_ENV=production`
- **KHI** Nest app khởi động
- **THÌ** Swagger UI KHÔNG được mount để giảm chi phí bundle/runtime serverless.

### Requirement: Validation Và Error Envelope Toàn Cục

Hệ thống PHẢI (SHALL) validate DTO toàn cục, loại bỏ/từ chối field không khai báo, transform dữ liệu khi class-transformer hỗ trợ và trả lỗi theo JSON thống nhất.

#### Scenario: Request có field lạ

- **CHO** body chứa thuộc tính không có trong DTO đích
- **KHI** request vào endpoint có DTO validation
- **THÌ** API PHẢI từ chối request do `forbidNonWhitelisted` đang bật.

#### Scenario: Response lỗi validation

- **CHO** request lỗi validation hoặc ném HTTP exception
- **KHI** global exception filter xử lý
- **THÌ** response PHẢI gồm `statusCode`, `timestamp`, `path`, `message`.

#### Scenario: Lỗi server không dự kiến

- **CHO** xảy ra exception không phải HTTP exception
- **KHI** global exception filter xử lý
- **THÌ** response PHẢI có status 500 và `message` là `Internal server error`.

### Requirement: Route Public Và Route Cần Đăng Nhập

Hệ thống PHẢI (SHALL) yêu cầu JWT cho mọi route trừ khi route được đánh dấu public.

#### Scenario: Endpoint public

- **CHO** handler có metadata public
- **KHI** request không gửi `Authorization`
- **THÌ** JWT guard PHẢI cho phép request đi tiếp.

#### Scenario: Endpoint bảo vệ thiếu token

- **CHO** handler không public
- **KHI** request không có bearer token hợp lệ
- **THÌ** API PHẢI từ chối với `Vui lòng đăng nhập`.

#### Scenario: Endpoint yêu cầu role

- **CHO** route khai báo role được phép
- **KHI** user đã đăng nhập nhưng role không nằm trong danh sách đó
- **THÌ** roles guard PHẢI từ chối với `Bạn không có quyền thực hiện hành động này`.

### Requirement: Giới Hạn Tần Suất Request

Hệ thống PHẢI (SHALL) áp dụng throttling toàn cục 100 request trong 60 giây.

#### Scenario: Vượt giới hạn request

- **CHO** client gửi hơn 100 request trong một cửa sổ throttling
- **KHI** throttler đánh giá request
- **THÌ** API PHẢI từ chối các request vượt ngưỡng theo hành vi Nest throttler.

### Requirement: Chính Sách CORS

API PHẢI (SHALL) cho phép origin từ `CORS_ORIGINS`, mặc định là `http://localhost:3001`.

#### Scenario: Frontend gửi credential/header tùy chỉnh

- **CHO** frontend gọi API từ origin hợp lệ
- **KHI** request gửi credential, authorization hoặc session header
- **THÌ** API PHẢI cho phép credential và các header `Content-Type`, `Authorization`, `X-Requested-With`, `x-session-id`.

### Requirement: Redis Adapter

Hệ thống PHẢI (SHALL) dùng Upstash Redis REST khi có cấu hình và fallback in-memory khi thiếu credential.

#### Scenario: Có cấu hình Upstash

- **CHO** `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` được cấu hình
- **KHI** `RedisService` khởi tạo
- **THÌ** service PHẢI dùng Upstash adapter.

#### Scenario: Fallback local

- **CHO** thiếu credential Upstash
- **KHI** `RedisService` khởi tạo
- **THÌ** service PHẢI dùng in-memory storage và log cảnh báo dành cho dev.

#### Scenario: Distributed lock

- **CHO** lock key đã tồn tại và chưa hết hạn
- **KHI** caller khác gọi `setNx` với cùng key
- **THÌ** Redis PHẢI trả `false`.

#### Scenario: Key hết TTL

- **CHO** key cache hoặc lock có TTL
- **KHI** TTL đã hết
- **THÌ** các lần `get` hoặc `setNx` sau đó PHẢI coi key như không tồn tại.

### Requirement: Domain Event Bus

Hệ thống PHẢI (SHALL) dispatch event booking/payment qua event bus in-process và cô lập lỗi giữa các handler.

#### Scenario: Event không có handler

- **CHO** event được emit nhưng không có handler đăng ký
- **KHI** `EventsService.emit` chạy
- **THÌ** service PHẢI log debug và hoàn tất mà không throw.

#### Scenario: Một handler bị lỗi

- **CHO** event có nhiều handler
- **KHI** một handler throw lỗi
- **THÌ** lỗi PHẢI được log và các handler sau vẫn PHẢI chạy.

#### Scenario: Saga thanh toán thành công

- **CHO** event `payment.success` có booking id
- **KHI** booking event handler nhận event
- **THÌ** booking service PHẢI xác nhận booking nếu status là `PENDING_PAYMENT` hoặc `PAYING`.

#### Scenario: Saga thanh toán thất bại

- **CHO** event `payment.failed` có booking id
- **KHI** booking event handler nhận event
- **THÌ** booking service PHẢI expire booking nếu status là `PENDING_PAYMENT` hoặc `PAYING`.

### Requirement: Notification Và Email

Hệ thống PHẢI (SHALL) lưu notification attempt và gửi email qua Resend khi có cấu hình.

#### Scenario: Notification type được hỗ trợ

- **CHO** type thuộc `booking.confirmed`, `booking.cancelled`, `booking.expired`, `checkout.completed`
- **KHI** notification service gửi thông báo
- **THÌ** service PHẢI load booking/customer, dựng template data tiếng Việt và tạo bản ghi `notifications`.

#### Scenario: Chưa cấu hình Resend

- **CHO** thiếu `RESEND_API_KEY`
- **KHI** gửi notification
- **THÌ** bản ghi notification vẫn PHẢI được lưu và email được bỏ qua, không làm fail transaction nghiệp vụ.

#### Scenario: Gửi email thành công

- **CHO** Resend đã cấu hình
- **KHI** provider nhận email
- **THÌ** notification PHẢI được cập nhật `sentAt` và `failed=false`.

#### Scenario: Gửi email thất bại

- **CHO** Resend đã cấu hình
- **KHI** provider trả lỗi
- **THÌ** notification PHẢI được cập nhật `failed=true`, `failReason` và tăng `retries`.

### Requirement: Cron Hết Hạn Booking

Hệ thống PHẢI (SHALL) có endpoint cron public nhưng bảo vệ bằng bearer secret để expire booking chưa thanh toán.

#### Scenario: Thiếu cấu hình cron secret

- **CHO** `CRON_SECRET` chưa cấu hình
- **KHI** gọi `/api/v1/internal/cron/expire-bookings`
- **THÌ** endpoint PHẢI trả unauthorized.

#### Scenario: Sai bearer secret

- **CHO** `CRON_SECRET` đã cấu hình
- **KHI** header `Authorization` không đúng chính xác `Bearer <CRON_SECRET>`
- **THÌ** endpoint PHẢI trả unauthorized.

#### Scenario: Cron chạy chồng

- **CHO** tiến trình khác đang giữ lock `cron:booking:expire`
- **KHI** endpoint cron được gọi
- **THÌ** endpoint PHẢI trả `{ skipped: true }`.

#### Scenario: Xử lý booking quá hạn

- **CHO** cron lấy được lock
- **KHI** tồn tại booking `PENDING_PAYMENT` có `paymentDeadline` trước thời điểm hiện tại
- **THÌ** từng booking PHẢI được truyền vào `expireBooking`
- **VÀ** endpoint PHẢI trả số lượng đã xử lý
- **VÀ** lock PHẢI được giải phóng sau khi xử lý.
