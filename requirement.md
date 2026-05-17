# REQUIREMENT SPECIFICATION

## 1. Giới thiệu dự án

### 1.1 Tên dự án
Hệ thống đặt phòng khách sạn trực tuyến (Online Hotel Booking System).

### 1.2 Mô tả tổng quan hệ thống
Hệ thống là nền tảng thương mại điện tử trong lĩnh vực lưu trú, cho phép khách hàng tìm kiếm, đặt phòng, thanh toán và quản lý lịch sử đặt phòng trên một quy trình liền mạch. Bên cạnh kênh khách hàng, hệ thống cũng cung cấp bộ công cụ vận hành cho nhân viên và quản trị viên để quản lý tồn phòng, giá phòng, check-in/check-out, dịch vụ phát sinh và báo cáo kinh doanh.

Tài liệu requirement này được tổng hợp và chuẩn hóa từ tài liệu hiện có trong dự án, nhằm tạo một mô tả nghiệp vụ - kỹ thuật đầy đủ, đủ để developer triển khai, tester viết test case, BA đối soát logic và thành viên mới onboard nhanh.

### 1.3 Bài toán hệ thống giải quyết
Trong mô hình vận hành thủ công, khách sạn thường gặp các vấn đề: cập nhật tồn phòng chậm, dễ overbooking, thanh toán không đồng bộ, khó truy vết lịch sử giao dịch và khó đo lường hiệu suất kinh doanh theo thời gian thực. Hệ thống giải quyết các vấn đề này bằng cách:

- Chuẩn hóa quy trình đặt phòng - thanh toán - lưu trú - trả phòng.
- Tập trung dữ liệu đặt phòng, phòng, khách hàng, thanh toán trên một nền tảng.
- Tự động hóa các nghiệp vụ lặp lại (thông báo, hủy đơn quá hạn, cập nhật trạng thái).
- Tăng khả năng kiểm soát và ra quyết định cho nhiều cấp vai trò (Nhân viên, Admin).

### 1.4 Đối tượng sử dụng
| Nhóm người dùng | Vai trò trong hệ thống | Nhu cầu chính |
| --- | --- | --- |
| Khách hàng | Đặt phòng và sử dụng dịch vụ | Tìm phòng nhanh, đặt dễ, thanh toán an toàn, theo dõi đơn |
| Nhân viên (Staff/Receptionist/Housekeeping) | Vận hành nghiệp vụ tại khách sạn | Quản lý trạng thái phòng, check-in/check-out, dịch vụ phát sinh |
| Quản trị viên (Admin) | Điều hành và cấu hình hệ thống | Quản lý inventory, giá, tài khoản, báo cáo |
| Hệ thống tự động (Scheduler/Background jobs) | Xử lý tác vụ nền | Gửi thông báo, hủy đơn quá hạn, đồng bộ trạng thái |

### 1.5 Giá trị hệ thống mang lại
- Giảm thất thoát doanh thu do sai lệch đặt phòng và cập nhật trạng thái chậm.
- Nâng trải nghiệm khách hàng với quy trình đặt phòng online 24/7.
- Cải thiện năng suất vận hành nhân viên nhờ quy trình có cấu trúc và dữ liệu tập trung.
- Hỗ trợ nhà quản lý ra quyết định dựa trên số liệu (doanh thu, occupancy, hiệu suất phòng).

---

## 2. Mục tiêu dự án

### 2.1 Mục tiêu nghiệp vụ
- Số hóa quy trình đặt phòng và quản lý lưu trú từ đầu đến cuối.
- Đảm bảo tính nhất quán giữa thông tin hiển thị cho khách và thông tin vận hành nội bộ.
- Thiết lập cơ chế giá linh hoạt theo mùa, sự kiện, ngày lễ để tối ưu doanh thu.
- Tăng khả năng duy trì khách hàng thông qua thông báo xác nhận, lịch sử và đánh giá dịch vụ.

### 2.2 Mục tiêu kỹ thuật
- Xây dựng hệ thống module hóa, dễ mở rộng thêm tính năng mới.
- Bảo vệ dữ liệu nhạy cảm (xác thực, thông tin đặt phòng, thanh toán).
- Đảm bảo luồng API rõ ràng, dễ tích hợp frontend/mobile/third-party.
- Hỗ trợ logging và audit có hệ thống để debug và đối soát giao dịch.

### 2.3 Các vấn đề cần giải quyết
- Tránh xung đột đặt phòng cùng thời điểm (concurrency trong booking).
- Đồng bộ trạng thái giữa đặt phòng - thanh toán - trạng thái phòng.
- Kiểm soát phân quyền rõ ràng cho từng role.
- Đảm bảo dữ liệu báo cáo tin cậy khi có hủy đơn, check-out trễ, dịch vụ phát sinh.

### 2.4 Kỳ vọng trong vận hành thực tế
- Hệ thống hoạt động ổn định trong cao điểm đặt phòng.
- Giảm thời gian xử lý check-in/check-out tại quầy.
- Nhân viên và admin có dashboard nghiệp vụ để thao tác nhanh.
- Khách hàng nhận thông báo đầy đủ ở các mốc quan trọng của đơn đặt phòng.

---

## 3. Phạm vi dự án

### 3.1 Các hạng mục trong phạm vi
- Quản lý tài khoản và hồ sơ người dùng.
- Tìm kiếm, lọc và xem chi tiết phòng.
- Tạo đơn đặt phòng, giữ phòng tạm thời, thanh toán trực tuyến.
- Quản lý đơn đặt phòng: xem lịch sử, hủy đơn theo chính sách.
- Vận hành tại chỗ: room map, check-in/check-out, tình trạng dọn dẹp, dịch vụ phát sinh.
- Quản trị hệ thống: inventory, giá phòng, phân quyền, báo cáo.
- Automation: thông báo xác nhận/nhắc nhở, tự động hủy đơn quá hạn thanh toán.

### 3.2 Các hạng mục ngoài phạm vi hiện tại
- Quản lý chuỗi nhiều khách sạn đa thương hiệu với phân cấp vùng/chi nhánh phức tạp.
- Tích hợp CRM/ERP doanh nghiệp quy mô lớn.
- Công cụ dự báo nhu cầu hoặc dynamic pricing dùng AI theo thời gian thực.
- Loyalty đa cấp, điểm thưởng liên thông với hệ sinh thái bên ngoài.

### 3.3 Các module chính
| Module | Mô tả chức năng |
| --- | --- |
| Authentication & Profile | Đăng ký, đăng nhập, cập nhật thông tin tài khoản |
| Room Discovery | Tìm kiếm/lọc phòng, xem mô tả và giá |
| Booking & Payment | Tạo đơn, xác nhận, thanh toán, callback cập nhật |
| Booking Lifecycle | Lịch sử, hủy đơn, trạng thái xuyên vòng đời đơn |
| Operations | Room map, check-in/check-out, housekeeping, extra services |
| Admin Management | Quản lý phòng, cấu hình giá, tài khoản nhân viên, phân quyền |
| Reporting | Doanh thu, occupancy, thống kê theo kỳ |
| Notification & Scheduler | Gửi email/SMS, hủy đơn quá hạn |

### 3.4 Giới hạn hệ thống hiện tại
- Chính sách hủy/hoàn tiền được mô tả theo rule nghiệp vụ, cần bổ sung rõ hơn theo từng kênh thanh toán.
- Chưa mô tả đầy đủ luồng xử lý tranh chấp thanh toán (callback trễ, callback lặp).
- Các KPI quản trị nâng cao (forecast, cohort, CLV) chưa thuộc phiên bản hiện tại.

---

## 4. Chức năng chính

### 4.1 Authentication và quản lý hồ sơ

**Mục đích:** Tạo danh tính người dùng, kiểm soát truy cập và duy trì thông tin cá nhân phục vụ đặt phòng.

**Actor:** Khách hàng, Nhân viên, Admin.

**Input/Output chính:**
- Input: email/số điện thoại, mật khẩu, thông tin hồ sơ.
- Output: phiên đăng nhập hợp lệ, thông tin profile, thông báo lỗi validation.

**Flow xử lý tóm tắt:**
1. Người dùng chọn đăng ký hoặc đăng nhập.
2. Hệ thống validate dữ liệu đầu vào.
3. Đăng ký: tạo tài khoản nếu email chưa tồn tại.
4. Đăng nhập: xác thực thông tin, tạo session/token.
5. Người dùng cập nhật profile khi đã đăng nhập.

**Quy tắc nghiệp vụ & validation:**
- Email duy nhất trong hệ thống.
- Mật khẩu cần đạt độ mạnh tối thiểu theo policy (độ dài, ký tự).
- Chức năng profile chỉ thao tác trên tài khoản của chính mình (trừ role admin có quyền can thiệp).

**Phân quyền:**
- Guest: chỉ đăng ký/đăng nhập.
- User đã đăng nhập: xem/sửa profile cá nhân.
- Admin: có thể khóa/mở tài khoản theo module quản trị.

**Trạng thái dữ liệu liên quan:**
- Tài khoản: Active / Locked.

### 4.2 Tìm kiếm và lọc phòng

**Mục đích:** Hỗ trợ khách hàng tìm phòng phù hợp theo ngày ở, ngân sách và nhu cầu.

**Actor:** Khách hàng.

**Input/Output chính:**
- Input: check-in date, check-out date, số khách, loại phòng, mức giá, tiện nghi.
- Output: danh sách phòng khả dụng kèm giá và mô tả.

**Flow xử lý tóm tắt:**
1. Khách nhập bộ tiêu chí tìm kiếm.
2. Hệ thống validate khoảng ngày và tham số.
3. Hệ thống truy vấn tồn phòng theo khoảng thời gian.
4. Áp bộ lọc và sắp xếp.
5. Trả kết quả để khách chọn phòng/đặt phòng.

**Quy tắc nghiệp vụ & validation:**
- Check-out phải lớn hơn check-in.
- Số khách không vượt quá sức chứa phòng.
- Chỉ hiển thị phòng có khả năng đặt trong khoảng ngày yêu cầu.

### 4.3 Đặt phòng (Booking creation)

**Mục đích:** Tạo đơn đặt phòng từ phòng đã chọn và thông tin khách.

**Actor:** Khách hàng.

**Input/Output chính:**
- Input: phòng chọn, thời gian ở, thông tin liên hệ, chấp nhận điều khoản.
- Output: booking code, tổng tiền tạm tính, trạng thái đơn.

**Flow xử lý tóm tắt:**
1. Khách chọn phòng và xác nhận đặt.
2. Hệ thống re-check availability tại thời điểm submit.
3. Tạo đơn ở trạng thái chờ thanh toán.
4. Tạm giữ inventory phòng trong cửa sổ thanh toán.
5. Chuyển sang bước thanh toán.

**Quy tắc nghiệp vụ & validation:**
- Không tạo đơn nếu phòng vừa bị đặt bởi người khác.
- Tổng tiền được tính theo giá hiệu lực trong khoảng ngày đặt.
- Một đơn cần có hạn thanh toán, quá hạn sẽ bị hủy tự động.

**Trạng thái dữ liệu liên quan:**
- Booking: PendingPayment -> Paid -> CheckedIn -> Completed.
- Nhóm hủy: CancelledByUser / CancelledByTimeout / CancelledByAdmin.

### 4.4 Thanh toán trực tuyến

**Mục đích:** Hoàn tất giao dịch thanh toán đơn đặt phòng qua cổng thanh toán.

**Actor:** Khách hàng, Cổng thanh toán, Hệ thống.

**Input/Output chính:**
- Input: mã đơn, phương thức thanh toán, callback payload.
- Output: kết quả thanh toán, cập nhật trạng thái đơn, thông báo xác nhận.

**Flow xử lý tóm tắt:**
1. Khách chọn kênh thanh toán (ví dụ VNPay, MoMo).
2. Hệ thống tạo yêu cầu đến cổng thanh toán.
3. Khách xác nhận trên cổng.
4. Cổng gọi callback/return URL.
5. Hệ thống verify callback, cập nhật giao dịch và đơn.

**Quy tắc nghiệp vụ & validation:**
- Callback phải xác thực chữ ký/hash theo provider.
- Hệ thống đảm bảo idempotent khi callback lặp lại.
- Đơn quá hạn nhưng callback về sau cần xử lý theo policy tranh chấp.

### 4.5 Lịch sử đặt phòng và hủy đơn

**Mục đích:** Cho phép khách theo dõi vòng đời đơn và hủy đơn đúng chính sách.

**Actor:** Khách hàng.

**Input/Output chính:**
- Input: filter theo trạng thái/thời gian, yêu cầu hủy đơn.
- Output: danh sách đơn, chi tiết đơn, kết quả hủy.

**Flow xử lý tóm tắt:**
1. Khách vào trang lịch sử.
2. Hệ thống tải danh sách đơn theo tài khoản.
3. Khách xem chi tiết và gửi yêu cầu hủy (nếu hợp lệ).
4. Hệ thống đối soát chính sách hủy.
5. Cập nhật trạng thái đơn và giải phóng phòng.

**Quy tắc nghiệp vụ & validation:**
- Khách chỉ xem/hủy đơn của chính mình.
- Chỉ được hủy đơn khi còn trong cửa sổ cho phép.
- Đơn đã check-in không được hủy từ phía khách.

### 4.6 Đánh giá và phản hồi dịch vụ

**Mục đích:** Thu thập chất lượng dịch vụ sau khi khách sử dụng.

**Actor:** Khách hàng.

**Input/Output chính:**
- Input: số sao, nội dung đánh giá, booking id.
- Output: bản ghi đánh giá, trạng thái hiển thị.

**Quy tắc nghiệp vụ & validation:**
- Chỉ đánh giá khi đơn đã hoàn thành check-out.
- Mỗi đơn chỉ được đánh giá 1 lần.
- Nội dung cần qua bộ lọc nội dung không phù hợp theo chính sách.

### 4.7 Room map và cập nhật trạng thái phòng

**Mục đích:** Hỗ trợ vận hành trực quan tình trạng phòng theo thời gian thực.

**Actor:** Nhân viên, Admin.

**Trạng thái phòng tham chiếu:** Available, Reserved, Occupied, Dirty, Cleaning, Maintenance.

**Flow xử lý tóm tắt:**
1. Nhân viên xem room map theo tầng/khu vực.
2. Lọc theo trạng thái.
3. Cập nhật trạng thái dọn dẹp/bảo trì khi có biến động.
4. Hệ thống đồng bộ đến các màn hình liên quan (booking/search).

### 4.8 Check-in / Check-out

**Mục đích:** Chuyển giao đơn từ trạng thái đã thanh toán sang lưu trú và kết thúc đơn.

**Actor:** Nhân viên.

**Input/Output chính:**
- Input: mã đơn/khách hàng, xác nhận check-in hoặc check-out.
- Output: trạng thái đơn/phòng mới, hóa đơn tổng kết.

**Quy tắc nghiệp vụ:**
- Check-in yêu cầu đơn hợp lệ và đạt điều kiện thanh toán.
- Check-out chuyển phòng sang Dirty để housekeeping tiếp nhận.
- Phí phát sinh (trả phòng trễ, dịch vụ thêm) được cộng vào tổng đơn.

### 4.9 Ghi nhận dịch vụ phát sinh

**Mục đích:** Tính đúng và minh bạch các khoản chi phí ngoài tiền phòng.

**Actor:** Nhân viên.

**Input/Output chính:**
- Input: loại dịch vụ, đơn giá, số lượng, booking id.
- Output: dòng chi phí phát sinh trên đơn.

**Validation:**
- Chỉ thêm dịch vụ cho đơn đang lưu trú.
- Đơn giá/số lượng phải hợp lệ, không âm.

### 4.10 Quản lý inventory phòng

**Mục đích:** Quản lý danh mục loại phòng và từng phòng cụ thể.

**Actor:** Admin.

**Flow & quy tắc nghiệp vụ:**
- Thêm/sửa/xóa loại phòng và phòng.
- Không cho xóa khi đang ràng buộc booking đang hoạt động.
- Chỉnh sửa sức chứa/tiện nghi ảnh hưởng trực tiếp đến kết quả tìm kiếm.

### 4.11 Cấu hình giá phòng linh hoạt

**Mục đích:** Tối ưu doanh thu theo bối cảnh kinh doanh.

**Actor:** Admin.

**Quy tắc giá:**
- Giá mặc định theo loại phòng.
- Giá theo mùa/ngày lễ/sự kiện có độ ưu tiên cao hơn giá mặc định.
- Xử lý trùng lặp khoảng ngày theo thứ tự ưu tiên đã định nghĩa.

### 4.12 Quản lý tài khoản nhân viên và phân quyền

**Mục đích:** Kiểm soát truy cập nội bộ theo nguyên tắc ít quyền nhất.

**Actor:** Admin.

**Nghiệp vụ chính:** tạo/sửa/khóa/mở khóa tài khoản, gán role, reset mật khẩu.

### 4.13 Báo cáo doanh thu và hiệu suất phòng

**Mục đích:** Cung cấp số liệu cho điều hành và tối ưu kinh doanh.

**Actor:** Admin.

**Đầu ra báo cáo:**
- Doanh thu theo ngày/tuần/tháng/năm.
- Tỷ lệ lấp phòng (occupancy).
- Cơ cấu doanh thu theo loại phòng, kênh thanh toán, dịch vụ phát sinh.

### 4.14 Thông báo tự động

**Mục đích:** Đảm bảo khách hàng và nhân viên được cập nhật kịp thời.

**Sự kiện kích hoạt:**
- Tạo đơn thành công.
- Thanh toán thành công/thất bại.
- Sắp hết hạn thanh toán.
- Đơn bị hủy do quá hạn.

### 4.15 Tự động hủy đơn quá hạn thanh toán

**Mục đích:** Bảo vệ tính khả dụng inventory phòng và tránh giữ chỗ ảo.

**Flow xử lý text:**
`Scheduler -> Quét đơn PendingPayment quá hạn -> Chuyển CancelledByTimeout -> Giải phóng inventory -> Gửi thông báo (nếu cấu hình)`

---

## 5. Kiến trúc hệ thống

### 5.1 Mô hình tổng quan
Hệ thống được thiết kế theo hướng 3 lớp và module hóa:

1. Presentation layer: giao diện người dùng (web app cho khách, staff, admin).
2. Application/API layer: xử lý nghiệp vụ, phân quyền, validation, orchestration thanh toán.
3. Data layer: CSDL lưu trữ dữ liệu nghiệp vụ và lịch sử giao dịch.

### 5.2 Frontend - Backend - Database
- Frontend gọi API backend qua HTTP(S), dùng token/session để xác thực.
- Backend thực thi nghiệp vụ và thao tác dữ liệu qua ORM/query layer.
- Database đảm bảo ACID cho các giao dịch đặt phòng/thanh toán cập nhật trạng thái.

### 5.3 Cơ chế giao tiếp giữa các thành phần
- Client -> API: REST JSON.
- API -> Payment gateway: HTTP redirect + callback webhook.
- API -> Notification provider: SMTP/SMS API.
- Scheduler -> DB/API service: xử lý tác vụ định kỳ.

### 5.4 Flow request-response tổng quát
`UI request -> Auth middleware -> Validation -> Business service -> Repository/DB -> Response formatter -> UI`

### 5.5 External services và tích hợp bên thứ ba
- Cổng thanh toán (ví dụ VNPay, MoMo).
- Dịch vụ gửi email/SMS.
- Có thể mở rộng tích hợp cloud logging/monitoring trong giai đoạn vận hành.

---

## 6. Tech stack

Phần này chuẩn hóa theo stack triển khai thực tế của dự án.

| Nhóm công nghệ | Công nghệ sử dụng | Vai trò |
| --- | --- | --- |
| Backend framework | NestJS 10 | Xây dựng REST API, tổ chức module nghiệp vụ, guard/interceptor/filter |
| ORM | Prisma 6 | Ánh xạ dữ liệu, quản lý schema migration, truy vấn PostgreSQL |
| Database | PostgreSQL 16 | Lưu trữ dữ liệu nghiệp vụ: user, room, booking, payment, audit |
| Authentication | JWT (Access Token + Refresh Token) | Xác thực phiên người dùng, hỗ trợ gia hạn phiên an toàn |
| Backend validation | class-validator | Validate DTO đầu vào tại tầng API theo rule nghiệp vụ |
| Async processing | In-process EventBus | Phát và xử lý sự kiện nội bộ (booking created, payment updated, notification trigger) |
| Lock & cache | Upstash Redis (REST) | Khóa ngắn hạn chống race condition booking và cache dữ liệu đọc nhiều |
| Email service | Resend HTTP API | Gửi email giao dịch: xác nhận đặt phòng, thanh toán, thông báo hủy |
| Payment gateway | VNPay sandbox | Môi trường tích hợp và kiểm thử thanh toán trực tuyến |
| Frontend framework | Next.js 16 (App Router) | Xây dựng web app cho khách hàng và các màn hình vận hành |
| UI library | React 19 | Nền tảng component và rendering phía client/server |
| Styling | TailwindCSS 3 | Thiết kế giao diện theo utility-first, đồng nhất UI |
| Data fetching | React Query | Quản lý server state, cache dữ liệu API, đồng bộ trạng thái tải/lỗi |
| Client state | Zustand | Quản lý client state nhẹ cho các luồng UI và thông tin tạm thời |
| Charting | Recharts | Hiển thị biểu đồ báo cáo doanh thu, occupancy, xu hướng vận hành |
| Frontend validation | Zod + react-hook-form | Validate form và chuẩn hóa dữ liệu đầu vào phía client |
| Monorepo | pnpm workspaces + Turborepo | Quản lý đa package, chia sẻ code, tăng tốc build/test |
| Deploy | Vercel (web + api) | Triển khai frontend và API trên cùng nền tảng managed |
| Database hosting | Prisma Postgres / Neon (single Postgres) | Cung cấp hạ tầng PostgreSQL managed cho môi trường deploy |

### 6.1 Ghi chú triển khai
- Mô hình bất đồng bộ hiện tại ưu tiên nhẹ và nhanh (in-process EventBus), phù hợp giai đoạn đầu; khi tải tăng mạnh có thể nâng cấp sang message broker riêng.
- Upstash Redis được dùng theo giao thức REST, phù hợp môi trường serverless và triển khai trên Vercel.
- Payment đang ở VNPay sandbox để kiểm thử; khi lên production cần tách cấu hình key, callback URL và chính sách đối soát riêng.

---

## 7. Database overview

### 7.1 Các entity chính
| Entity (bảng) | Ý nghĩa nghiệp vụ |
| --- | --- |
| users | Lưu tài khoản khách, staff, admin |
| roles / permissions | Cấu hình vai trò và quyền truy cập |
| rooms | Danh mục phòng cụ thể và trạng thái vận hành |
| room_types | Phân loại phòng, sức chứa, tiện nghi, giá cơ sở |
| room_prices / pricing_rules | Quy tắc giá theo thời gian/mùa/sự kiện |
| bookings | Đơn đặt phòng và vòng đời trạng thái |
| booking_items | Chi tiết phòng theo đơn (nếu 1 đơn nhiều phòng) |
| payments | Giao dịch thanh toán và thông tin đối soát |
| extra_services | Danh mục dịch vụ phát sinh |
| booking_services | Dịch vụ phát sinh gắn với đơn đang lưu trú |
| reviews | Đánh giá sau lưu trú |
| notifications | Lịch sử gửi thông báo và trạng thái |
| audit_logs | Nhật ký thay đổi dữ liệu quan trọng |

### 7.2 Quan hệ dữ liệu cốt lõi
- `users (1) - (n) bookings`
- `room_types (1) - (n) rooms`
- `bookings (1) - (n) payments`
- `bookings (1) - (n) booking_services`
- `users (1) - (n) reviews`, `bookings (1) - (1/n) reviews`
- `roles (1) - (n) users` hoặc `users (n) - (n) roles` tùy mô hình RBAC.

### 7.3 Ý nghĩa dữ liệu quan trọng
- Booking status và room status là 2 trục dữ liệu cần đồng bộ chặt chẽ.
- Payment record cần lưu đủ metadata callback để đối soát khi có tranh chấp.
- Audit log cần ghi actor, thời điểm, hành động, old/new value cho các thay đổi quan trọng.

---

## 8. Phân quyền hệ thống

| Role | Quyền truy cập chính |
| --- | --- |
| Guest | Tìm phòng, xem thông tin, đăng ký/đăng nhập |
| Customer | Đặt phòng, thanh toán, xem lịch sử, hủy đơn, đánh giá |
| Staff/Receptionist | Room map, check-in/check-out, ghi nhận dịch vụ phát sinh |
| Housekeeping | Cập nhật trạng thái dọn dẹp phòng |
| Admin | Quản lý phòng, giá, tài khoản nhân viên, báo cáo, cấu hình hệ thống |
| System | Thực thi job nền: thông báo, hủy đơn quá hạn |

Nguyên tắc thực thi:
- Áp dụng RBAC tại API layer.
- Mặc định từ chối truy cập nếu role không đủ quyền.
- Các thao tác admin/staff quan trọng cần được ghi audit.

---

## 9. API overview

### 9.1 Cấu trúc API
- Kiểu API: RESTful JSON.
- Prefix đề xuất: `/api/v1`.
- Nhóm endpoint theo module: auth, rooms, bookings, payments, reviews, admin, reports, notifications.

### 9.2 Convention
- Sử dụng danh từ số nhiều cho resource: `/rooms`, `/bookings`.
- HTTP method theo semantic: GET/POST/PUT/PATCH/DELETE.
- Pagination qua `page`, `limit`; filter qua query params.

### 9.3 Authentication flow
1. Đăng nhập thành công -> cấp token/session.
2. Client gửi token qua `Authorization: Bearer <token>` (nếu JWT).
3. Middleware xác thực token và nạp context người dùng.
4. Authorization guard kiểm tra role/quyền trên endpoint.

### 9.4 Response format đề xuất
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 200
  }
}
```

### 9.5 Error handling format
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Selected room is no longer available",
    "details": []
  }
}
```

### 9.6 Nhóm mã lỗi cần chuẩn hóa
- `AUTH_*`: lỗi xác thực/phân quyền.
- `VALIDATION_*`: dữ liệu đầu vào không hợp lệ.
- `BOOKING_*`: xung đột đặt phòng/trạng thái đơn.
- `PAYMENT_*`: lỗi thanh toán/callback.
- `SYSTEM_*`: lỗi hệ thống, timeout, service unavailable.

---

## 10. Non-functional requirements

### 10.1 Performance
- Thời gian phản hồi API thông thường <= 2 giây với tải trọng trung bình.
- Các truy vấn tìm kiếm phòng cần tối ưu index theo ngày, loại phòng, trạng thái.
- Báo cáo lớn có thể xử lý bất đồng bộ hoặc phân trang.

### 10.2 Security
- Mã hóa kênh truyền bằng HTTPS.
- Mật khẩu lưu dạng hash an toàn (bcrypt/argon2).
- Chống SQL injection/XSS/CSRF theo kiểu ứng dụng.
- Kiểm soát rate limit cho endpoint nhạy cảm (login, payment callback).

### 10.3 Scalability
- Có khả năng scale ngang API stateless.
- Tách queue/job cho tác vụ nền để tránh ảnh hưởng request realtime.

### 10.4 Maintainability
- Phân lớp rõ ràng: controller/service/repository.
- Logging có cấu trúc, message code thống nhất.
- Tài liệu API và migration DB được cập nhật theo phiên bản.

### 10.5 Availability
- Mục tiêu uptime cao cho kênh đặt phòng online.
- Có health check endpoint và cơ chế restart khi service lỗi.

### 10.6 Logging và monitoring
- Ghi log request, business event, error stack có gắn correlation id.
- Dashboard theo dõi API latency, tỷ lệ lỗi, số đơn đặt, số callback lỗi.

### 10.7 Backup và phục hồi
- Backup CSDL định kỳ (daily/incremental theo chính sách vận hành).
- Kiểm thử định kỳ quy trình restore.

### 10.8 Error handling và resiliency
- Retry có kiểm soát cho job gửi thông báo.
- Idempotency cho callback thanh toán.
- Circuit breaker/timeouts khi gọi external service.

---

## 11. Hướng phát triển tương lai

### 11.1 Mở rộng chức năng
- Dynamic pricing nâng cao dựa trên occupancy và mùa vụ.
- Quản lý nhiều cơ sở khách sạn trong cùng hệ thống.
- Loyalty program và voucher campaign chi tiết hơn.
- Tích hợp chatbot hỗ trợ đặt phòng và CSKH.

### 11.2 Nâng cấp vận hành
- Event-driven architecture cho các sự kiện booking/payment.
- Data warehouse cho phân tích BI nâng cao.
- Bổ sung fraud detection cho giao dịch thanh toán.

### 11.3 Nâng cấp trải nghiệm người dùng
- Mobile app cho khách và ứng dụng tác nghiệp cho nhân viên.
- Self check-in/check-out với QR code.

---

## 12. Kết luận

Tài liệu requirement được mở rộng này định nghĩa lại hệ thống đặt phòng khách sạn trực tuyến theo hướng đầy đủ và khả thi cho triển khai. Nội dung bao gồm cả khía cạnh nghiệp vụ, kỹ thuật, dữ liệu, phân quyền và vận hành, tạo nền tảng cho các bên liên quan:

- Developer có cơ sở rõ ràng để thiết kế API, data model và logic nghiệp vụ.
- Tester có đủ thông tin để xây dựng test case theo flow, rule và exception.
- BA có tài liệu đối soát phạm vi, mục tiêu và tiêu chí nghiệm thu.
- Team mới có thể onboard nhanh, hiểu toàn cảnh hệ thống và định hướng mở rộng.

Phiên bản tài liệu này cũng nhấn mạnh các điểm cần ưu tiên trong giai đoạn tiếp theo: chuẩn hóa state machine booking-payment, củng cố bảo mật và monitoring, và mở rộng kiến trúc cho nhu cầu tăng trưởng thực tế.
