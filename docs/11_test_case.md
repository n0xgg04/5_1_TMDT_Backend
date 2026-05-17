# Tài liệu Test Case - Hệ thống Đặt phòng Khách sạn Trực tuyến

## 1. Mục tiêu
- Cung cấp bộ test case chi tiết, có thể thực thi ngay cho QA, đồng thời làm chuẩn đối chiếu hành vi hệ thống cho Dev và PM.
- Bao phủ đầy đủ chức năng theo các tài liệu: SRS, Use Case, UI Screen Spec, Business Rules, API, Authorization Matrix, Acceptance Criteria.

## 2. Test scope

### 2.1 In scope
- Auth & Profile
- Room Discovery
- Booking & Payment
- Booking Lifecycle (history, detail, cancellation, review)
- Operations (room map, check-in/check-out, room status, extra services)
- Admin Management (inventory, pricing rule, staff account, RBAC)
- Reporting
- Notification & Scheduler
- Cross-module integration flow

### 2.2 Out of scope
- Tích hợp CRM/ERP lớn.
- Dynamic pricing AI thời gian thực.
- Chuỗi khách sạn đa thương hiệu phức tạp.

## 3. Test strategy
- Functional testing theo module và end-to-end flow.
- Validation testing theo từng field/rule quan trọng.
- Permission/role testing theo ma trận Guest/Customer/Staff/Housekeeping/Admin/System.
- API contract testing: status code, response schema, error code, auth.
- Boundary value: ngày, số khách, số lượng, phân trang, độ dài dữ liệu.
- Negative case và error handling: dữ liệu sai, trạng thái sai, callback sai chữ ký, timeout.
- Security testing cơ bản: auth bypass, token invalid/expired, IDOR, brute force/rate limit cơ bản, input injection cơ bản.
- UI/UX flow testing: điều hướng, loading/empty/error state, disable submit, responsive cơ bản.
- Integration testing: đồng bộ booking-payment-room-inventory-notification-report.

## 4. Môi trường và dữ liệu kiểm thử
- Môi trường ưu tiên: Staging `https://stg-hotel-booking.example.com`.
- API base URL: `https://stg-hotel-booking.example.com/api/v1`.
- Tài khoản test: Admin, Staff, Housekeeping, Customer A, Customer B theo `docs/10_environment_test_account.md`.
- Seed data bắt buộc: room type, pricing rules, booking đa trạng thái, payment success/failed, scheduler bật.

## 5. Quy ước mức độ ưu tiên và loại testcase
- Priority:
  - High: ảnh hưởng trực tiếp doanh thu, bảo mật, luồng chính.
  - Medium: ảnh hưởng trải nghiệm/chính xác nghiệp vụ ở mức vừa.
  - Low: cải thiện chất lượng hiển thị/phụ trợ.
- Loại testcase: Positive, Negative, Boundary, Security, Permission, Validation, API, UI/UX, Integration.

## 6. Danh sách test case chi tiết

## Module A - Auth & Profile

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_AUTH_001 | Đăng ký tài khoản | Đăng ký thành công với email mới hợp lệ | Chưa tồn tại email đăng ký | 1) Mở SCR-01. 2) Nhập form hợp lệ. 3) Submit | email mới, password `Customer@12345` | Tạo user mới trạng thái active; trả response success; có thể đăng nhập | High | Positive, Functional |
| TC_AUTH_002 | Đăng ký tài khoản | Chặn email trùng theo BR-01 | Email đã tồn tại | 1) Gọi `POST /auth/register` với email cũ | `customer01.test@hotel.local` | Trả lỗi `VALIDATION_*` hoặc thông điệp email đã tồn tại; không tạo user mới | High | Negative, Validation, API |
| TC_AUTH_003 | Đăng ký tài khoản | Validate định dạng email | Không | 1) Submit register với email sai định dạng | `abc@`, password hợp lệ | Trả lỗi validate email; hiển thị lỗi gần field trên UI | High | Negative, Validation, UI/UX |
| TC_AUTH_004 | Đăng ký tài khoản | Validate độ mạnh mật khẩu theo policy | Không | 1) Submit register với mật khẩu yếu | `1234567` hoặc toàn chữ thường | Trả lỗi mật khẩu chưa đạt policy; không tạo user | High | Negative, Validation |
| TC_AUTH_005 | Đăng nhập | Đăng nhập thành công trả access token | User active tồn tại | 1) Gọi `POST /auth/login`. 2) Kiểm tra response | `customer01.test@hotel.local` / `Customer@12345` | HTTP 200; trả access token hợp lệ; điều hướng đúng trang theo role | High | Positive, API, Functional |
| TC_AUTH_006 | Đăng nhập | Sai mật khẩu bị từ chối | User tồn tại | 1) Login với password sai | password `Wrong@123` | HTTP 401 hoặc `AUTH_*`; không tạo session | High | Negative, Security |
| TC_AUTH_007 | Session/token | Từ chối token hết hạn | Có token hết hạn | 1) Gọi `GET /bookings/me` với token expired | Bearer expired token | HTTP 401 `AUTH_UNAUTHORIZED`; yêu cầu đăng nhập lại | High | Negative, Security, API |
| TC_AUTH_008 | Authorization profile | User chỉ sửa profile của chính mình | Có Customer A và B | 1) Customer A gọi API sửa profile user B (nếu có endpoint id). Hoặc đổi token để thao tác chéo | ID profile của user B | HTTP 403; dữ liệu user B không thay đổi | High | Permission, Security |
| TC_AUTH_009 | Quản trị tài khoản | Admin khóa/mở khóa tài khoản user | Admin login | 1) Admin khóa user. 2) User thử login. 3) Admin mở khóa và login lại | User B | Khi locked: login bị chặn; khi unlock: login thành công | High | Functional, Permission |
| TC_AUTH_010 | Đăng xuất | Hủy phiên đăng nhập hợp lệ | User đã login | 1) Logout. 2) Dùng lại token cũ gọi API protected | Token vừa logout | Token cũ không dùng được hoặc bị từ chối theo policy; UI về màn login | High | Security, Session |

## Module B - Room Discovery

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_ROOM_001 | Tìm kiếm phòng | Trả danh sách phòng khả dụng với tiêu chí hợp lệ | Có seed room/inventory | 1) Mở SCR-03. 2) Nhập ngày hợp lệ. 3) Bấm Tìm kiếm | check-in hôm nay+3, check-out +5, guest=2 | Trả danh sách phòng available, có giá/đêm/sức chứa | High | Positive, Functional |
| TC_ROOM_002 | Validate ngày | Chặn check-out <= check-in theo BR-03 | Không | 1) Tìm kiếm với check-out bằng check-in | check-in `2026-06-10`, check-out `2026-06-10` | Hiển thị lỗi khoảng ngày không hợp lệ; API trả `VALIDATION_INVALID_DATE_RANGE` | High | Negative, Boundary, Validation |
| TC_ROOM_003 | Validate ngày | Chặn check-in nhỏ hơn ngày hiện tại | Không | 1) Chọn check-in quá khứ. 2) Submit | check-in hôm qua | UI cảnh báo; không gửi request hoặc API từ chối | High | Negative, Validation |
| TC_ROOM_004 | Validate sức chứa | Chặn số khách vượt sức chứa phòng | Có phòng capacity=2 | 1) Search guest=5 cho room type nhỏ | guestCount=5 | Không hiển thị phòng không đủ sức chứa hoặc trả lỗi phù hợp khi tạo booking | High | Boundary, Validation |
| TC_ROOM_005 | Filter | Lọc theo loại phòng hoạt động đúng | Có >=3 room types | 1) Chọn filter room type A. 2) So kết quả | roomType=Deluxe | Chỉ hiển thị phòng thuộc loại đã lọc | Medium | Functional |
| TC_ROOM_006 | Filter | Lọc theo khoảng giá | Có pricing rules đa mức | 1) Chọn min/max price. 2) Search | 800000-1200000 | Mọi kết quả nằm trong khoảng giá theo đêm | Medium | Functional, Boundary |
| TC_ROOM_007 | Sort | Sắp xếp theo giá tăng/giảm | Có >=5 kết quả | 1) Sort asc. 2) Sort desc | sort=price_asc/price_desc | Thứ tự giá đúng theo lựa chọn sort | Medium | Functional, UI/UX |
| TC_ROOM_008 | Pagination | Phân trang danh sách phòng đúng meta | Dữ liệu > 1 trang | 1) Gọi `GET /rooms?page=1&limit=10`. 2) Sang page 2 | page=1,2 limit=10 | Trả `meta.page/limit/total` đúng; dữ liệu page không trùng sai | Medium | API, Boundary |
| TC_ROOM_009 | Empty state | Hiển thị trạng thái rỗng khi không có phòng | Chọn ngày cao điểm kín phòng | 1) Search bộ tiêu chí không có kết quả | date range full booked | UI hiển thị empty state rõ ràng; không lỗi layout | Medium | UI/UX, Negative |
| TC_ROOM_010 | Room detail | Xem chi tiết phòng thành công | Có room hợp lệ | 1) Mở SCR-04 từ card phòng | room id hợp lệ | Hiển thị đúng ảnh/mô tả/chính sách/tiện nghi/sức chứa | Medium | Positive, Functional |

## Module C - Booking & Payment

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_BK_001 | Tạo booking | Tạo booking thành công và vào `pending_payment` | Customer login, phòng khả dụng | 1) Điền SCR-05 hợp lệ. 2) Xác nhận điều khoản. 3) Submit | roomId hợp lệ, acceptTerms=true | HTTP 200; có `bookingCode`, `status=pending_payment`, `paymentDueAt` | High | Positive, Functional, API |
| TC_BK_002 | Validation booking | Bắt buộc accept terms | Customer login | 1) Submit form khi bỏ chọn điều khoản | acceptTerms=false | Trả lỗi validate; không tạo booking | High | Negative, Validation |
| TC_BK_003 | Validation booking | Kiểm tra field contact bắt buộc | Customer login | 1) Bỏ trống contactName hoặc phone. 2) Submit | contactName rỗng | Hiển thị lỗi từng field; API trả `VALIDATION_*` | High | Negative, Validation, UI/UX |
| TC_BK_004 | Overbooking concurrency | Không overbooking cùng thời điểm theo AC-BK-04 | Customer A và B sẵn sàng | 1) Đồng thời gửi 2 request `POST /bookings` cùng room/date | cùng roomId, date range | Chỉ 1 request success; request còn lại trả `BOOKING_CONFLICT` | High | Integration, Boundary |
| TC_BK_005 | Re-check availability | Phát hiện phòng vừa hết tại lúc submit | Phòng vừa bị giữ bởi user khác | 1) User A giữ phòng pending. 2) User B submit đặt cùng phòng | cùng room/date | User B nhận `BOOKING_CONFLICT`; không tạo booking sai | High | Negative, Business rule |
| TC_BK_006 | Pricing rule | Tính tổng tiền theo rule ưu tiên (event > season > default) | Có 3 rule trùng thời gian | 1) Tạo booking qua ngày có rule event | date range có event | `totalAmount` dùng giá event; nếu cùng ưu tiên thì rule update mới nhất | High | Business rule, Validation |
| TC_PAY_001 | Init payment | Khởi tạo thanh toán cho booking pending | Booking pending tồn tại | 1) Gọi `POST /payments/{bookingCode}/init` | booking pending | Trả payment URL/transaction pending hợp lệ | High | Positive, API |
| TC_PAY_002 | Init payment | Chặn khởi tạo thanh toán khi booking không ở pending | Booking đã paid/cancelled | 1) Gọi init payment | booking status=paid | Trả `BOOKING_*` hoặc `PAYMENT_*`; không tạo transaction mới | High | Negative, Business rule |
| TC_PAY_003 | Callback hợp lệ | Callback success cập nhật payment và booking | Có giao dịch pending | 1) Gửi callback signed hợp lệ | secure_hash đúng, status success | Payment->success; Booking->paid; ghi audit; gửi notification | High | Positive, API, Integration |
| TC_PAY_004 | Callback sai chữ ký | Từ chối callback không hợp lệ theo BR-07 | Có booking pending | 1) Gửi callback với hash sai | secure_hash sai | Trả `PAYMENT_INVALID_SIGNATURE`; không đổi trạng thái booking | High | Negative, Security, API |
| TC_PAY_005 | Callback idempotent | Callback lặp không tạo bản ghi trùng theo BR-08 | Có callback success đã xử lý | 1) Gửi lại callback y hệt 2-3 lần | cùng provider_txn_id + booking_code | Chỉ 1 giao dịch hiệu lực; trạng thái không bị cập nhật sai | High | Integration, API, Boundary |
| TC_PAY_006 | Callback trễ sau timeout | Xử lý tranh chấp khi callback đến muộn | Booking đã timeout cancel | 1) Để booking quá hạn. 2) Gửi callback success muộn | booking cancelled_by_timeout | Không tự chuyển trực tiếp paid; chuyển luồng dispute/policy; có audit | High | Negative, Business rule, Integration |

## Module D - Booking Lifecycle (History, Detail, Cancel, Review)

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_LC_001 | Lịch sử booking | Customer xem lịch sử của chính mình | Customer có booking | 1) Gọi `GET /bookings/me` và mở SCR-07 | token Customer A | Chỉ trả booking của Customer A; có phân trang/filter | High | Positive, Permission |
| TC_LC_002 | IDOR booking detail | Chặn xem booking của user khác | Có booking của Customer B | 1) Customer A gọi `GET /bookings/{codeB}` | bookingCode của B | HTTP 403 hoặc not found theo policy; không lộ dữ liệu | High | Security, Permission |
| TC_LC_003 | Filter lịch sử | Lọc theo trạng thái/thời gian chính xác | Có dữ liệu đa trạng thái | 1) Lọc status=paid. 2) Lọc theo date range | status/date filters | Kết quả đúng bộ lọc; meta tổng bản ghi đúng | Medium | Functional |
| TC_LC_004 | Hủy booking customer hợp lệ | Customer hủy booking của mình trong cửa sổ cho phép | Booking pending/paid hợp lệ | 1) Gọi `POST /bookings/{code}/cancel` | booking của chính user | Booking -> cancelled_by_user; inventory giải phóng; có thông báo | High | Positive, Business rule |
| TC_LC_005 | Hủy booking sai quyền | Customer không hủy booking của user khác | Có booking của user khác | 1) Customer A cancel booking B | bookingCode B | HTTP 403; không đổi trạng thái booking B | High | Permission, Security |
| TC_LC_006 | Hủy booking đã checked-in | Không cho hủy booking đã check-in theo BR-10 | Booking checked_in tồn tại | 1) Gửi yêu cầu cancel | booking checked_in | Trả lỗi nghiệp vụ; giữ nguyên checked_in | High | Negative, Business rule |
| TC_LC_007 | Admin force cancel | Admin hủy cưỡng chế ghi audit | Admin login, booking hợp lệ | 1) Admin cancel booking. 2) Kiểm tra audit | booking paid/pending | Booking -> cancelled_by_admin; có audit actor/action/old/new | High | Permission, Integration |
| TC_RV_001 | Tạo review | Chỉ cho review khi booking completed | Booking completed của Customer A | 1) Submit review từ SCR-08 | rating=5, content hợp lệ | Tạo review thành công; liên kết đúng booking/user | Medium | Positive, Functional |
| TC_RV_002 | Review sai trạng thái | Không cho review nếu booking chưa completed | Booking paid/checked_in | 1) Submit review | booking chưa completed | Trả lỗi nghiệp vụ; không tạo review | Medium | Negative, Business rule |
| TC_RV_003 | 1 booking 1 review | Chặn gửi review lần 2 cho cùng booking | Đã có review trước đó | 1) Submit review lần 2 | cùng bookingId | Trả lỗi duplicate; dữ liệu cũ giữ nguyên | Medium | Negative, Validation |

## Module E - Operations (Room Map, Check-in/out, Room Status, Extra Services)

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_OPS_001 | Room map | Staff xem room map theo tầng/trạng thái | Staff login | 1) Mở SCR-09. 2) Lọc tầng/trạng thái | floor=2, status=dirty | Danh sách/phân bố phòng đúng theo filter và legend | High | Positive, UI/UX |
| TC_OPS_002 | Check-in | Check-in thành công cho booking paid | Booking paid sẵn sàng | 1) Gọi `POST /operations/check-in` | bookingCode paid | Booking -> checked_in; room -> occupied | High | Positive, Integration |
| TC_OPS_003 | Check-in sai trạng thái | Chặn check-in nếu booking chưa thanh toán | Booking pending tồn tại | 1) Check-in booking pending | booking pending_payment | Trả lỗi nghiệp vụ; không đổi status | High | Negative, Business rule |
| TC_OPS_004 | Check-in phòng bảo trì | Chặn check-in khi room maintenance | Room status maintenance | 1) Thực hiện check-in | booking paid + room maintenance | Trả lỗi phù hợp; booking giữ paid | High | Negative, Business rule |
| TC_OPS_005 | Check-out | Check-out thành công chuyển room dirty | Booking checked_in | 1) Gọi `POST /operations/check-out` | booking checked_in | Booking -> completed; room -> dirty; có invoice tổng kết | High | Positive, Integration |
| TC_OPS_006 | Extra services | Thêm dịch vụ phát sinh cho booking checked-in | Booking checked_in | 1) Thêm service line | serviceId hợp lệ, qty=2 | Tạo booking_service; tổng bill tăng đúng | High | Positive, CRUD, Business rule |
| TC_OPS_007 | Extra services validation | Chặn thêm dịch vụ khi booking không checked-in | Booking paid/pending | 1) Thêm service | booking paid | Trả lỗi nghiệp vụ theo BR-12 | High | Negative, Validation |
| TC_OPS_008 | Cập nhật room status | Staff cập nhật trạng thái phòng hợp lệ | Staff login | 1) `PATCH /rooms/{id}/status` từ dirty -> cleaning -> available | roomId hợp lệ | Cập nhật trạng thái thành công theo chuỗi hợp lệ | High | Positive, CRUD |
| TC_OPS_009 | Permission housekeeping | Housekeeping chỉ được cập nhật room status | Housekeeping login | 1) Cập nhật status phòng. 2) Thử check-in | roomId hợp lệ | Cập nhật status được phép; check-in bị 403 | High | Permission |
| TC_OPS_010 | Boundary số lượng dịch vụ | Validate quantity/amount > 0 | Booking checked_in | 1) Thêm service với qty=0 hoặc -1 | qty=0, unitPrice âm | Trả lỗi validate; không ghi dữ liệu | Medium | Boundary, Validation |

## Module F - Admin Management (Inventory, Pricing, Staff, RBAC)

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_ADM_001 | Permission admin endpoint | Chỉ Admin truy cập `/admin/*` | Có token Staff/Customer/Admin | 1) Gọi `/admin/rooms` bằng từng role | 3 token khác nhau | Staff/Customer nhận 403; Admin thành công | High | Permission, Security, API |
| TC_ADM_002 | CRUD room - Create | Admin tạo phòng mới | Admin login | 1) POST `/admin/rooms` | room_number mới, room_type hợp lệ | Tạo phòng thành công; dữ liệu hiển thị ở room map/search | High | Positive, CRUD, Integration |
| TC_ADM_003 | CRUD room - Update | Admin sửa sức chứa/thuộc tính phòng | Admin login | 1) PATCH room | capacity từ 2 -> 3 | Cập nhật thành công; search phản ánh sức chứa mới | Medium | CRUD, Integration |
| TC_ADM_004 | CRUD room - Delete rule | Chặn xóa phòng khi có booking hoạt động | Có booking pending/paid gắn room | 1) DELETE room đang ràng buộc | room đang active booking | Trả lỗi nghiệp vụ; không xóa dữ liệu | High | Negative, Business rule |
| TC_ADM_005 | CRUD pricing - Create | Tạo pricing rule theo mùa/sự kiện | Admin login | 1) POST `/admin/pricing-rules` | rule mùa cao điểm | Tạo rule thành công; có hiệu lực khi tính booking | High | Positive, CRUD |
| TC_ADM_006 | Pricing overlap | Xử lý trùng ngày theo ưu tiên + updatedAt | Có nhiều rule overlap | 1) Tạo rule overlap. 2) Tạo booking test | 2 rule cùng ưu tiên | Hệ thống áp dụng rule đúng thứ tự ưu tiên và thời điểm cập nhật | High | Business rule, Boundary |
| TC_ADM_007 | Staff account CRUD | Admin tạo/sửa/khóa staff account | Admin login | 1) Tạo staff. 2) Khóa. 3) Mở khóa | email staff mới | CRUD thành công; quyền role áp dụng đúng | High | CRUD, Permission |
| TC_ADM_008 | Audit log nhạy cảm | Thao tác admin/staff ghi audit đầy đủ | Có quyền xem audit DB/log | 1) Thực hiện update pricing, cancel admin, đổi status phòng | nhiều action | Có audit chứa actor, action, timestamp, old/new, correlation_id | High | Integration, Security |

## Module G - Reporting

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_RPT_001 | Revenue report | Admin xem báo cáo doanh thu theo kỳ | Có dữ liệu booking/payment | 1) Gọi `GET /admin/reports/revenue` theo ngày/tuần | from/to hợp lệ | Trả số liệu doanh thu đúng theo dữ liệu payment success | High | Positive, API |
| TC_RPT_002 | Permission report | Chặn role không đủ quyền truy cập report admin | Customer/Housekeeping login | 1) Gọi endpoint report | token non-admin | HTTP 403 | High | Permission |
| TC_RPT_003 | Report consistency | Báo cáo phản ánh đúng hủy đơn và phụ phí | Có booking cancel + extra services | 1) So sánh report với data booking/payment/services | tập dữ liệu mẫu | Doanh thu loại trừ booking hủy, cộng đúng phụ phí hợp lệ | High | Integration, Business rule |
| TC_RPT_004 | Boundary date range | Validate khoảng thời gian report hợp lệ | Admin login | 1) from > to. 2) Khoảng quá dài theo policy | from/to lỗi | Trả lỗi validate rõ ràng | Medium | Boundary, Validation |

## Module H - Notification & Scheduler

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_SYS_001 | Notification booking created | Gửi thông báo khi tạo booking thành công | Booking tạo thành công | 1) Tạo booking mới. 2) Kiểm tra notification log/email sandbox | booking pending | Có bản ghi notifications; nội dung đúng booking code/số tiền/hạn thanh toán | Medium | Integration |
| TC_SYS_002 | Reminder trước hạn thanh toán | Gửi nhắc nhở trước `payment_due_at` | Scheduler bật | 1) Tạo booking sắp đến hạn. 2) Chờ job chạy | booking pending gần due | Gửi reminder 1 lần theo policy; lưu lịch sử gửi | Medium | Integration |
| TC_SYS_003 | Auto cancel timeout | Tự động hủy booking quá hạn theo BR-06 | Scheduler bật, booking pending quá hạn | 1) Chờ qua due time. 2) Trigger job | booking pending quá hạn | Booking -> cancelled_by_timeout; inventory giải phóng ngay | High | Integration, Business rule |
| TC_SYS_004 | Retry/error handling notification | Lỗi gửi email được retry có kiểm soát | Giả lập provider lỗi tạm thời | 1) Trigger event gửi mail khi provider trả timeout | provider timeout | Job retry theo cấu hình; không mất sự kiện; log lỗi rõ ràng | Medium | Error handling, Negative |

## Module I - Security, Session, Error Handling chung

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_SEC_001 | Auth header | Endpoint protected từ chối thiếu token | Không token | 1) Gọi `/bookings/me` không Authorization | none | HTTP 401 `AUTH_UNAUTHORIZED` | High | Security, API |
| TC_SEC_002 | Token format | Từ chối token sai format | Không | 1) Gọi API protected với Bearer lỗi | `Bearer abc` | HTTP 401; không lộ stacktrace | High | Security |
| TC_SEC_003 | Brute force cơ bản | Login sai nhiều lần bị giới hạn | Có cơ chế rate limit | 1) Gửi N lần login sai liên tục | cùng IP/email | Bị throttle/rate limit; trả mã lỗi phù hợp | High | Security, Negative |
| TC_SEC_004 | SQL injection cơ bản | Input tìm kiếm không gây lỗi/injection | Không | 1) Truyền payload `' OR 1=1 --` vào query | keyword/payload injection | Hệ thống xử lý an toàn; không trả dữ liệu bất thường | High | Security, Negative |
| TC_SEC_005 | XSS cơ bản | Nội dung review không thực thi script | Có chức năng review | 1) Gửi review chứa `<script>alert(1)</script>` | payload script | Nội dung bị sanitize/escape; UI không thực thi JS | High | Security, Negative |
| TC_ERR_001 | Error format | Lỗi nghiệp vụ tuân thủ schema lỗi chuẩn | Có request lỗi | 1) Gây lỗi `BOOKING_CONFLICT` | đặt trùng phòng | Response chứa `success=false`, `error.code`, `message` rõ ràng | Medium | API, Error handling |
| TC_ERR_002 | External timeout | Timeout từ payment/notification được xử lý an toàn | Có thể mô phỏng timeout | 1) Giả lập gateway timeout khi init payment | timeout scenario | Trả lỗi `SYSTEM_TIMEOUT`/`PAYMENT_*`; không treo request vô hạn | High | Error handling, Negative |

## Module J - UI/UX, Empty/Loading/Error State, Responsive

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_UI_001 | Loading state form | Nút submit bị disable khi đang gửi request | Mạng chậm/mô phỏng delay | 1) Submit login/booking. 2) Quan sát button | request delay 2-3s | Button disabled + loading; không double submit | High | UI/UX, Validation |
| TC_UI_002 | Error message placement | Lỗi hiển thị gần field và có thông báo tổng | Gây lỗi validate form | 1) Submit form rỗng ở login/booking | thiếu field bắt buộc | Hiển thị lỗi đúng vị trí, dễ hiểu | Medium | UI/UX |
| TC_UI_003 | Điều hướng theo role | Login thành công chuyển đúng trang theo role | Có account Customer/Staff/Admin | 1) Login từng role | 3 account role | Customer vào flow booking; Staff vào ops; Admin vào quản trị | High | UI/UX, Permission |
| TC_UI_004 | Empty state lịch sử | Lịch sử trống hiển thị đúng UX | User mới chưa booking | 1) Vào SCR-07 bằng user mới | user không có booking | Hiển thị empty state rõ ràng, có CTA phù hợp | Medium | UI/UX, Negative |
| TC_UI_005 | Error state API fail | UI xử lý khi API lỗi 5xx/timeout | Mô phỏng API lỗi | 1) Gọi màn search/history khi backend fail | lỗi 500/timeout | Hiển thị thông báo lỗi thân thiện + cho phép retry | Medium | UI/UX, Error handling |
| TC_UI_006 | Responsive mobile | Màn hình chính hiển thị đúng ở 360px | Trình duyệt dev tools | 1) Kiểm tra SCR-03/05/07 ở width 360 | viewport 360x800 | Layout không vỡ; thao tác form được; text không tràn | Medium | UI/UX, Responsive |
| TC_UI_007 | Responsive tablet | Màn hình chính hiển thị đúng ở 768px | Trình duyệt dev tools | 1) Kiểm tra SCR-03/09/10 ở width 768 | viewport 768x1024 | Grid/bảng dùng được; filter và CTA truy cập được | Medium | UI/UX, Responsive |
| TC_UI_008 | Responsive desktop | Màn hình quản trị/room map đúng ở >=1280 | Desktop browser | 1) Kiểm tra SCR-09/10/11 | 1366x768 | Bố cục đầy đủ, không chồng lấn thành phần | Low | UI/UX, Responsive |

## Module K - End-to-End Integration Flows

| Mã testcase | Module/chức năng | Mục tiêu kiểm thử | Preconditions | Test steps | Test data | Expected result | Priority | Loại testcase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_E2E_001 | E2E chuẩn đặt phòng | Bao phủ flow Customer từ search đến review | Có dữ liệu phòng và payment sandbox | 1) Search phòng. 2) Tạo booking. 3) Thanh toán thành công. 4) Staff check-in/out. 5) Customer review | Customer A + Staff | Trạng thái xuyên suốt đúng: pending->paid->checked_in->completed; room available->reserved->occupied->dirty->cleaning->available | High | Integration, Functional |
| TC_E2E_002 | E2E timeout | Booking quá hạn bị hủy và giải phóng inventory | Scheduler bật | 1) Tạo booking pending. 2) Không thanh toán đến quá hạn. 3) Search lại phòng | booking mới tạo | Booking -> cancelled_by_timeout; phòng xuất hiện lại trong kết quả search; có thông báo | High | Integration, Business rule |
| TC_E2E_003 | E2E callback lặp | Không nhân bản giao dịch khi callback lặp | Có booking pending + payment init | 1) Thực hiện payment thành công. 2) Gửi callback duplicate | cùng provider_txn_id | Chỉ 1 payment success hợp lệ; booking paid 1 lần; audit/log nhất quán | High | Integration, API |
| TC_E2E_004 | E2E phân quyền chéo | Mỗi vai trò chỉ thao tác trong phạm vi cho phép | Có đủ account role | 1) Customer thử endpoint admin. 2) Housekeeping thử check-out. 3) Staff thử pricing CRUD | token theo role | Mọi truy cập vượt quyền đều 403; thao tác hợp quyền thành công | High | Permission, Security |

## 7. Ma trận coverage theo yêu cầu
- Functional testing: TC_AUTH_001, TC_ROOM_001, TC_BK_001, TC_OPS_002, TC_ADM_002, TC_RPT_001, TC_E2E_001.
- Validation testing: TC_AUTH_003, TC_AUTH_004, TC_ROOM_002, TC_BK_002, TC_OPS_010, TC_RPT_004.
- Permission/role testing: TC_AUTH_008, TC_LC_005, TC_OPS_009, TC_ADM_001, TC_E2E_004.
- API testing: TC_AUTH_005, TC_PAY_003, TC_ERR_001, TC_SEC_001.
- UI/UX flow testing: TC_UI_001 đến TC_UI_008.
- Boundary value: TC_ROOM_002, TC_ROOM_008, TC_OPS_010, TC_RPT_004.
- Negative case: TC_AUTH_006, TC_BK_005, TC_PAY_004, TC_LC_006, TC_SEC_004.
- Error handling: TC_ERR_001, TC_ERR_002, TC_SYS_004, TC_UI_005.
- Authentication/Authorization: TC_AUTH_005, TC_AUTH_007, TC_SEC_001, TC_ADM_001.
- CRUD operations: TC_ADM_002, TC_ADM_003, TC_ADM_005, TC_ADM_007, TC_OPS_006.
- Search/filter/sort/pagination: TC_ROOM_005, TC_ROOM_006, TC_ROOM_007, TC_ROOM_008, TC_LC_003.
- Upload/download: Không thấy yêu cầu upload/download trong tài liệu hiện tại (N/A).
- Responsive cơ bản: TC_UI_006, TC_UI_007, TC_UI_008.
- Security testcase cơ bản: TC_SEC_001 -> TC_SEC_005.
- Session/token/logout: TC_AUTH_007, TC_AUTH_010, TC_SEC_002.
- Business rule validation: TC_BK_006, TC_PAY_006, TC_LC_006, TC_ADM_006, TC_SYS_003.
- Empty/loading/error state: TC_ROOM_009, TC_UI_001, TC_UI_004, TC_UI_005.
- Integration flow giữa các module: TC_E2E_001 -> TC_E2E_004, TC_PAY_003, TC_SYS_003.

## 8. Ghi chú thực thi test
- Với các test liên quan callback/scheduler, cần đồng bộ timezone môi trường test trước khi chạy.
- Với test concurrency (TC_BK_004), dùng công cụ gửi song song (Postman Runner/Newman/k6/JMeter).
- Với test bảo mật cơ bản, chỉ thực hiện trong môi trường Local/Dev/Staging, không chạy trên production.
