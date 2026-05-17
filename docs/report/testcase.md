# THÔNG TIN ĐỀ TÀI

| Nội dung | Thông tin |
|---|---|
| **Tên đề tài** | Hệ thống Đặt phòng Khách sạn Trực tuyến |
| **Nhóm thực hiện** | Nhóm phát triển 5_1_TMDT_Backend |
| **Mục tiêu tài liệu** | Xây dựng bộ test case đầy đủ để QA thực thi test, PM review coverage và Dev đối chiếu hành vi kỳ vọng |
| **Phạm vi** | Auth, Profile, Tìm kiếm phòng, Đặt phòng, Thanh toán, Vận hành, Quản trị, Báo cáo, Thông báo, Scheduler, UI/UX, Bảo mật, Tích hợp |

---

# 1. Danh sách test case

## 1.1 Quy ước sử dụng

- **Kết quả thực tế**, **Trạng thái (Pass/Fail)**, **Ghi chú** để trống trước khi chạy test chính thức.
- Priority: `High` (luồng cốt lõi/bảo mật/doanh thu), `Medium` (nghiệp vụ quan trọng mức vừa), `Low` (trải nghiệm/phụ trợ).
- Loại test case: `Positive`, `Negative`, `Boundary`, `Validation`, `Permission`, `Business Rule`, `CRUD`, `API`, `UI/UX`, `Integration`, `Security`, `E2E`.

## 1.2 Module A - Authentication & Profile

### Nhóm nghiệp vụ: Đăng ký, đăng nhập, phiên đăng nhập, phân quyền hồ sơ

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TC_AUTH_001 | Đăng ký tài khoản hợp lệ | Auth/Đăng ký | Đảm bảo tạo mới tài khoản khi dữ liệu hợp lệ | Email chưa tồn tại | Email mới, mật khẩu mạnh `Customer@12345` | 1) Mở trang đăng ký. 2) Nhập đủ trường hợp lệ. 3) Nhấn Đăng ký | Tạo user thành công, phản hồi success, có thể đăng nhập bằng tài khoản mới |  |  | High | Positive, Validation |  |
| 2 | TC_AUTH_002 | Đăng ký với email trùng | Auth/Đăng ký | Đảm bảo không tạo trùng tài khoản | Email đã tồn tại trong hệ thống | Email đã đăng ký, mật khẩu hợp lệ | 1) Truy cập trang đăng ký. 2) Nhập email trùng. 3) Submit | Hệ thống báo lỗi email đã tồn tại, không tạo bản ghi user mới |  |  | High | Negative, Validation |  |
| 3 | TC_AUTH_003 | Đăng ký với email sai định dạng | Auth/Đăng ký | Kiểm tra validate định dạng email | Không | Email `abc@`, mật khẩu hợp lệ | 1) Nhập email sai format. 2) Submit form | Hiển thị lỗi validate tại trường email, không gửi yêu cầu tạo tài khoản hợp lệ |  |  | High | Negative, Validation, UI/UX |  |
| 4 | TC_AUTH_004 | Đăng ký với mật khẩu yếu | Auth/Đăng ký | Kiểm tra chính sách độ mạnh mật khẩu | Không | Mật khẩu `1234567` hoặc toàn chữ thường | 1) Nhập form với mật khẩu yếu. 2) Submit | Hệ thống từ chối, hiển thị lỗi mật khẩu không đạt policy |  |  | High | Negative, Validation, Security |  |
| 5 | TC_AUTH_005 | Đăng nhập thành công | Auth/Đăng nhập | Đảm bảo tạo phiên hợp lệ khi thông tin đúng | User active tồn tại | Email và mật khẩu đúng | 1) Mở trang đăng nhập. 2) Nhập thông tin đúng. 3) Nhấn Đăng nhập | Đăng nhập thành công, cấp access token/session, điều hướng đúng theo role |  |  | High | Positive, API, UI/UX |  |
| 6 | TC_AUTH_006 | Đăng nhập sai mật khẩu | Auth/Đăng nhập | Đảm bảo từ chối truy cập sai thông tin | User tồn tại | Email đúng, mật khẩu sai | 1) Nhập sai mật khẩu. 2) Submit | Trả lỗi xác thực (401 hoặc tương đương), không tạo phiên |  |  | High | Negative, Security |  |
| 7 | TC_AUTH_007 | Truy cập với token hết hạn | Session/Token | Đảm bảo token expired bị từ chối | Có token đã hết hạn | Bearer token expired | 1) Gọi API yêu cầu đăng nhập bằng token hết hạn | Trả lỗi unauthorized, yêu cầu đăng nhập lại |  |  | High | Negative, Security, API |  |
| 8 | TC_AUTH_008 | Chỉnh sửa profile chéo người dùng | Profile/Phân quyền | Đảm bảo user chỉ sửa hồ sơ của chính mình | Có Customer A và Customer B | Token A, ID profile B | 1) Đăng nhập A. 2) Gửi yêu cầu cập nhật profile B | Hệ thống trả 403 (hoặc not allowed), dữ liệu B không thay đổi |  |  | High | Permission, Security |  |
| 9 | TC_AUTH_009 | Admin khóa và mở khóa tài khoản | Auth/Quản trị tài khoản | Đảm bảo cơ chế lock/unlock hoạt động đúng | Admin có quyền quản trị user | User cần khóa | 1) Admin khóa user. 2) User thử đăng nhập. 3) Admin mở khóa. 4) User đăng nhập lại | Khi khóa: đăng nhập bị chặn; khi mở khóa: đăng nhập thành công |  |  | High | Positive, Permission, Business Rule |  |
| 10 | TC_AUTH_010 | Đăng xuất và vô hiệu phiên cũ | Session/Đăng xuất | Đảm bảo token cũ không dùng lại được | User đã đăng nhập | Token vừa logout | 1) Thực hiện logout. 2) Dùng token cũ gọi API protected | Token cũ bị từ chối theo policy, UI quay về màn đăng nhập |  |  | High | Security, Session |  |

## 1.3 Module B - Room Discovery

### Nhóm nghiệp vụ: Tìm kiếm, lọc, sắp xếp, phân trang, trạng thái rỗng

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 11 | TC_ROOM_001 | Tìm kiếm phòng với tiêu chí hợp lệ | Room Discovery/Tìm kiếm | Đảm bảo trả danh sách phòng khả dụng đúng điều kiện | Có dữ liệu phòng và tồn kho | Check-in hợp lệ, check-out hợp lệ, số khách = 2 | 1) Mở trang tìm phòng. 2) Nhập tiêu chí. 3) Nhấn Tìm kiếm | Danh sách phòng khả dụng hiển thị đúng, có giá và sức chứa |  |  | High | Positive, Functional |  |
| 12 | TC_ROOM_002 | Check-out bằng check-in | Room Discovery/Validate ngày | Chặn khoảng ngày không hợp lệ | Không | Check-in `2026-06-10`, Check-out `2026-06-10` | 1) Nhập ngày bằng nhau. 2) Submit tìm kiếm | Hiển thị lỗi date range không hợp lệ, không trả kết quả sai |  |  | High | Negative, Boundary, Validation |  |
| 13 | TC_ROOM_003 | Check-in trong quá khứ | Room Discovery/Validate ngày | Chặn ngày nhận phòng nhỏ hơn ngày hiện tại | Không | Check-in ngày hôm qua | 1) Nhập ngày quá khứ. 2) Submit | Hệ thống cảnh báo lỗi và từ chối tìm kiếm hợp lệ |  |  | High | Negative, Validation |  |
| 14 | TC_ROOM_004 | Số khách vượt sức chứa | Room Discovery/Validate sức chứa | Đảm bảo không trả phòng không đủ sức chứa | Có loại phòng sức chứa nhỏ | Guest count lớn hơn capacity | 1) Nhập số khách vượt giới hạn. 2) Tìm kiếm | Không hiển thị phòng không phù hợp hoặc trả lỗi hợp lệ |  |  | High | Boundary, Validation |  |
| 15 | TC_ROOM_005 | Lọc theo loại phòng | Room Discovery/Filter | Đảm bảo filter room type hoạt động đúng | Có tối thiểu 3 loại phòng | Room type = Deluxe | 1) Chọn filter loại phòng. 2) Áp dụng lọc | Chỉ hiển thị kết quả thuộc loại đã chọn |  |  | Medium | Positive, Functional |  |
| 16 | TC_ROOM_006 | Lọc theo khoảng giá | Room Discovery/Filter | Đảm bảo kết quả nằm trong ngưỡng giá lọc | Có dữ liệu đa mức giá | Min 800000, Max 1200000 | 1) Chọn khoảng giá. 2) Tìm kiếm | Tất cả kết quả có giá trong khoảng đã chọn |  |  | Medium | Boundary, Functional |  |
| 17 | TC_ROOM_007 | Sắp xếp giá tăng/giảm | Room Discovery/Sort | Đảm bảo thứ tự hiển thị chính xác | Có ít nhất 5 kết quả | Sort asc/desc | 1) Chọn sort tăng dần. 2) Kiểm tra thứ tự. 3) Chọn sort giảm dần | Danh sách thay đổi đúng thứ tự giá theo lựa chọn |  |  | Medium | Positive, UI/UX |  |
| 18 | TC_ROOM_008 | Phân trang danh sách phòng | Room Discovery/Pagination | Đảm bảo metadata và dữ liệu trang chính xác | Tổng dữ liệu lớn hơn 1 trang | page=1,2; limit=10 | 1) Mở trang 1. 2) Chuyển trang 2. 3) So sánh dữ liệu | `page/limit/total` đúng, bản ghi không trùng sai giữa các trang |  |  | Medium | API, Boundary |  |
| 19 | TC_ROOM_009 | Trạng thái rỗng khi không có phòng | Room Discovery/Empty state | Đảm bảo UI hiển thị rõ khi không có kết quả | Dải ngày đã kín phòng | Bộ lọc không có kết quả | 1) Tìm kiếm trong ngày kín phòng. 2) Quan sát màn hình | Hiển thị empty state rõ ràng, không lỗi layout |  |  | Medium | UI/UX, Negative |  |
| 20 | TC_ROOM_010 | Xem chi tiết phòng | Room Discovery/Room detail | Đảm bảo thông tin phòng đầy đủ, đúng dữ liệu | Có room ID hợp lệ | roomId hợp lệ | 1) Chọn một phòng từ danh sách. 2) Mở trang chi tiết | Hiển thị đúng ảnh, tiện nghi, chính sách, sức chứa và giá |  |  | Medium | Positive, Functional |  |

## 1.4 Module C - Booking & Payment

### Nhóm nghiệp vụ: Tạo booking, thanh toán, callback, đồng bộ trạng thái

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | TC_BK_001 | Tạo booking hợp lệ | Booking/Tạo booking | Đảm bảo tạo booking thành công khi dữ liệu hợp lệ | Customer đã đăng nhập, phòng còn trống | roomId hợp lệ, acceptTerms=true | 1) Nhập form đặt phòng hợp lệ. 2) Xác nhận điều khoản. 3) Submit | Tạo booking thành công, sinh bookingCode, trạng thái `pending_payment` |  |  | High | Positive, API, Functional |  |
| 22 | TC_BK_002 | Không chấp nhận điều khoản | Booking/Validation | Đảm bảo bắt buộc xác nhận điều khoản | Customer đã đăng nhập | acceptTerms=false | 1) Bỏ chọn điều khoản. 2) Submit | Hệ thống trả lỗi validate, không tạo booking |  |  | High | Negative, Validation |  |
| 23 | TC_BK_003 | Thiếu thông tin liên hệ | Booking/Validation | Đảm bảo kiểm tra trường bắt buộc | Customer đã đăng nhập | contactName trống hoặc phone trống | 1) Để trống thông tin liên hệ. 2) Submit | Hiển thị lỗi tại từng field, từ chối tạo booking |  |  | High | Negative, Validation, UI/UX |  |
| 24 | TC_BK_004 | Chống overbooking đồng thời | Booking/Business Rule | Đảm bảo không tạo 2 booking cùng phòng cùng thời gian | 2 user thao tác đồng thời | 2 request cùng roomId/date | 1) Gửi đồng thời 2 yêu cầu đặt phòng giống nhau | Chỉ 1 request thành công, request còn lại nhận lỗi conflict |  |  | High | Integration, Boundary, Business Rule |  |
| 25 | TC_BK_005 | Phòng vừa hết tại thời điểm submit | Booking/Re-check availability | Đảm bảo tái kiểm tra tồn kho khi đặt | Có user khác vừa giữ phòng | room/date trùng với booking đang giữ | 1) User A giữ phòng. 2) User B submit cùng phòng | User B bị từ chối với lỗi conflict, không tạo booking sai |  |  | High | Negative, Business Rule |  |
| 26 | TC_BK_006 | Tính giá theo quy tắc ưu tiên | Booking/Pricing rule | Đảm bảo áp dụng đúng ưu tiên giá (event > season > default) | Có rules chồng lấp thời gian | Date nằm trong rule event | 1) Tạo booking vào thời gian có nhiều rule. 2) Kiểm tra tổng tiền | Tổng tiền dùng đúng rule ưu tiên, kết quả nhất quán |  |  | High | Business Rule, Validation |  |
| 27 | TC_PAY_001 | Khởi tạo thanh toán thành công | Payment/Init | Đảm bảo tạo giao dịch thanh toán cho booking pending | Booking trạng thái pending_payment | bookingCode hợp lệ | 1) Gọi khởi tạo thanh toán. 2) Kiểm tra phản hồi | Trả URL/transaction hợp lệ để thanh toán |  |  | High | Positive, API |  |
| 28 | TC_PAY_002 | Init payment sai trạng thái booking | Payment/Init | Chặn khởi tạo thanh toán khi booking không còn pending | Booking đã paid hoặc cancelled | bookingCode sai trạng thái | 1) Gọi init payment cho booking đã paid/cancelled | Trả lỗi nghiệp vụ phù hợp, không tạo transaction mới |  |  | High | Negative, Business Rule |  |
| 29 | TC_PAY_003 | Callback thanh toán hợp lệ | Payment/Callback | Đồng bộ thành công payment và booking khi callback đúng chữ ký | Có transaction pending | Payload callback hợp lệ, chữ ký đúng | 1) Gửi callback success. 2) Kiểm tra trạng thái payment/booking | Payment chuyển success, booking chuyển paid, ghi nhận log/audit |  |  | High | Positive, API, Integration |  |
| 30 | TC_PAY_004 | Callback sai chữ ký | Payment/Callback security | Đảm bảo từ chối callback giả mạo | Có booking pending | secure_hash sai | 1) Gửi callback với chữ ký sai | Trả lỗi invalid signature, trạng thái booking không đổi |  |  | High | Negative, Security, API |  |
| 31 | TC_PAY_005 | Callback lặp idempotent | Payment/Idempotency | Đảm bảo callback lặp không tạo giao dịch trùng | Đã xử lý callback thành công trước đó | Cùng provider_txn_id gửi lặp | 1) Gửi callback hợp lệ nhiều lần | Chỉ ghi nhận 1 giao dịch hiệu lực, không nhân đôi cập nhật |  |  | High | Integration, Boundary, API |  |
| 32 | TC_PAY_006 | Callback đến muộn sau timeout | Payment/Dispute rule | Đảm bảo không cập nhật sai khi callback đến sau khi booking timeout | Booking đã auto-cancel vì quá hạn | Callback success đến muộn | 1) Để booking quá hạn. 2) Gửi callback success | Không tự chuyển trực tiếp sang paid, xử lý theo quy tắc tranh chấp và có audit |  |  | High | Negative, Business Rule, Integration |  |

## 1.5 Module D - Booking Lifecycle

### Nhóm nghiệp vụ: Lịch sử, chi tiết, hủy booking, đánh giá

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 33 | TC_LC_001 | Xem lịch sử đặt phòng cá nhân | Booking Lifecycle/History | Đảm bảo user chỉ thấy dữ liệu của mình | Customer có booking | Token Customer A | 1) Mở trang lịch sử. 2) Kiểm tra danh sách | Chỉ hiển thị booking của Customer A, có phân trang/filter |  |  | High | Positive, Permission |  |
| 34 | TC_LC_002 | Truy cập chi tiết booking người khác | Booking Lifecycle/Detail | Chặn IDOR trên mã booking | Có booking của Customer B | bookingCode của B, token A | 1) Customer A gọi chi tiết booking của B | Trả 403 hoặc not found theo policy, không lộ dữ liệu booking B |  |  | High | Security, Permission |  |
| 35 | TC_LC_003 | Lọc lịch sử theo trạng thái/thời gian | Booking Lifecycle/Filter | Đảm bảo filter hoạt động chính xác | Có nhiều booking đa trạng thái | status=paid, date range | 1) Chọn trạng thái. 2) Chọn khoảng ngày. 3) Áp dụng lọc | Kết quả đúng điều kiện lọc, tổng bản ghi/meta chính xác |  |  | Medium | Functional, Search/Filter |  |
| 36 | TC_LC_004 | Hủy booking hợp lệ bởi khách hàng | Booking Lifecycle/Cancel | Đảm bảo hủy thành công trong điều kiện cho phép | Booking thuộc user, trạng thái được phép hủy | bookingCode hợp lệ | 1) User gửi yêu cầu hủy. 2) Kiểm tra tồn kho phòng | Booking đổi sang `cancelled_by_user`, tồn kho được giải phóng, có thông báo |  |  | High | Positive, Business Rule, Integration |  |
| 37 | TC_LC_005 | Hủy booking sai quyền | Booking Lifecycle/Cancel permission | Chặn user hủy booking của người khác | Có booking của user khác | bookingCode của B, token A | 1) Customer A gửi yêu cầu hủy booking B | Trả 403, booking của B không đổi trạng thái |  |  | High | Permission, Security |  |
| 38 | TC_LC_006 | Hủy booking đã check-in | Booking Lifecycle/Cancel rule | Chặn hủy booking khi đã check-in | Booking trạng thái checked_in | bookingCode checked_in | 1) Gửi yêu cầu hủy booking checked_in | Trả lỗi nghiệp vụ, giữ nguyên trạng thái checked_in |  |  | High | Negative, Business Rule |  |
| 39 | TC_RV_001 | Đánh giá sau khi hoàn tất lưu trú | Review/Create | Cho phép review khi booking completed | Booking completed của khách hàng | rating=5, nội dung hợp lệ | 1) Mở form review. 2) Nhập nội dung. 3) Submit | Tạo review thành công, liên kết đúng booking và user |  |  | Medium | Positive, Functional |  |
| 40 | TC_RV_002 | Review khi booking chưa completed | Review/Business rule | Chặn review sai trạng thái | Booking paid hoặc checked_in | booking chưa completed | 1) Submit review cho booking chưa hoàn tất | Trả lỗi nghiệp vụ, không tạo review |  |  | Medium | Negative, Business Rule |  |

## 1.6 Module E - Operations (Staff/Housekeeping)

### Nhóm nghiệp vụ: Sơ đồ phòng, check-in/out, trạng thái phòng, dịch vụ phát sinh

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 41 | TC_OPS_001 | Xem room map theo tầng/trạng thái | Operations/Room map | Đảm bảo filter room map đúng dữ liệu vận hành | Staff đã đăng nhập | floor=2, status=dirty | 1) Mở room map. 2) Áp dụng filter tầng và trạng thái | Kết quả đúng theo filter, trạng thái phòng hiển thị chính xác |  |  | High | Positive, UI/UX |  |
| 42 | TC_OPS_002 | Check-in booking đã thanh toán | Operations/Check-in | Đảm bảo check-in thành công khi booking đủ điều kiện | Booking trạng thái paid | bookingCode hợp lệ | 1) Staff thực hiện check-in | Booking sang checked_in, phòng sang occupied |  |  | High | Positive, Integration |  |
| 43 | TC_OPS_003 | Check-in booking chưa thanh toán | Operations/Check-in rule | Chặn check-in booking pending | Booking pending_payment | bookingCode pending | 1) Staff check-in booking pending | Trả lỗi nghiệp vụ, không đổi trạng thái booking/phòng |  |  | High | Negative, Business Rule |  |
| 44 | TC_OPS_004 | Check-out booking đang lưu trú | Operations/Check-out | Đảm bảo hoàn tất lưu trú và cập nhật trạng thái phòng | Booking checked_in | bookingCode checked_in | 1) Staff thực hiện check-out | Booking sang completed, phòng sang dirty, sinh tổng kết chi phí |  |  | High | Positive, Integration |  |
| 45 | TC_OPS_005 | Thêm dịch vụ phát sinh hợp lệ | Operations/Extra services | Đảm bảo ghi nhận dịch vụ và cộng tiền chính xác | Booking checked_in | serviceId hợp lệ, qty=2 | 1) Thêm dịch vụ cho booking đang ở. 2) Kiểm tra tổng tiền | Dịch vụ được thêm thành công, tổng bill tăng đúng |  |  | High | CRUD, Business Rule |  |
| 46 | TC_OPS_006 | Thêm dịch vụ khi chưa check-in | Operations/Extra services rule | Chặn thêm dịch vụ sai trạng thái | Booking paid hoặc pending | bookingCode chưa check-in | 1) Thử thêm dịch vụ cho booking chưa check-in | Trả lỗi nghiệp vụ, không tạo bản ghi dịch vụ |  |  | High | Negative, Validation, Business Rule |  |
| 47 | TC_OPS_007 | Quyền Housekeeping trên thao tác vận hành | Operations/Permission | Đảm bảo Housekeeping chỉ được cập nhật trạng thái phòng, không được check-in/out | Housekeeping đã đăng nhập | roomId hợp lệ | 1) Housekeeping cập nhật trạng thái phòng. 2) Housekeeping thử check-in/out | Cập nhật trạng thái phòng thành công; check-in/out bị từ chối 403 |  |  | High | Permission |  |

## 1.7 Module F - Admin Management

### Nhóm nghiệp vụ: Quản lý phòng, bảng giá, tài khoản nhân sự, RBAC, audit

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 48 | TC_ADM_001 | Truy cập endpoint admin theo role | Admin/RBAC | Đảm bảo chỉ Admin truy cập được nhóm `/admin/*` | Có token Admin, Staff, Customer | 3 token theo role | 1) Gọi endpoint admin bằng từng role | Admin thành công; Staff/Customer bị 403 |  |  | High | Permission, Security, API |  |
| 49 | TC_ADM_002 | Tạo mới phòng | Admin/Room CRUD | Đảm bảo admin tạo phòng thành công | Admin đã đăng nhập | room_number mới, room_type hợp lệ | 1) Mở form tạo phòng. 2) Nhập dữ liệu hợp lệ. 3) Lưu | Phòng được tạo, xuất hiện trong danh sách và room map |  |  | High | Positive, CRUD, Integration |  |
| 50 | TC_ADM_003 | Cập nhật thông tin phòng | Admin/Room CRUD | Đảm bảo cập nhật thuộc tính phòng phản ánh trên tìm kiếm | Admin đã đăng nhập | capacity từ 2 lên 3 | 1) Sửa thông tin phòng. 2) Lưu. 3) Kiểm tra module tìm kiếm | Dữ liệu phòng được cập nhật và đồng bộ đúng liên module |  |  | Medium | CRUD, Integration |  |
| 51 | TC_ADM_004 | Xóa phòng đang có booking hoạt động | Admin/Room rule | Chặn xóa phòng còn ràng buộc nghiệp vụ | Phòng có booking pending/paid | roomId đang được đặt | 1) Gửi yêu cầu xóa phòng | Trả lỗi nghiệp vụ, phòng không bị xóa |  |  | High | Negative, Business Rule |  |
| 52 | TC_ADM_005 | Tạo quy tắc giá mới | Admin/Pricing CRUD | Đảm bảo tạo pricing rule thành công | Admin đã đăng nhập | Rule mùa cao điểm hợp lệ | 1) Tạo rule giá theo khoảng thời gian. 2) Lưu | Rule được tạo thành công, áp dụng được khi đặt phòng |  |  | High | Positive, CRUD |  |
| 53 | TC_ADM_006 | Quy tắc giá chồng lấp | Admin/Pricing business rule | Đảm bảo áp dụng đúng ưu tiên khi rule overlap | Có nhiều rule cùng thời gian | 2 rule overlap cùng ưu tiên | 1) Tạo/chỉnh sửa rule overlap. 2) Tạo booking kiểm tra giá | Hệ thống chọn đúng rule theo ưu tiên và quy tắc cập nhật |  |  | High | Boundary, Business Rule |  |
| 54 | TC_ADM_007 | CRUD tài khoản nhân sự | Admin/Staff account | Đảm bảo tạo-sửa-khóa-mở khóa tài khoản staff đúng | Admin đã đăng nhập | Email staff mới | 1) Tạo staff. 2) Cập nhật thông tin. 3) Khóa/mở khóa | Các thao tác thành công, phân quyền role áp dụng đúng |  |  | High | CRUD, Permission |  |
| 55 | TC_ADM_008 | Ghi audit cho thao tác nhạy cảm | Admin/Audit | Đảm bảo hành động quản trị có nhật ký phục vụ truy vết | Có quyền xem log/audit | Thao tác: cập nhật giá, hủy booking, đổi trạng thái phòng | 1) Thực hiện các thao tác nhạy cảm. 2) Kiểm tra audit | Audit lưu đủ actor, action, timestamp, old/new value, correlation_id |  |  | High | Security, Integration |  |

## 1.8 Module G - Reporting

### Nhóm nghiệp vụ: Báo cáo doanh thu, kiểm soát quyền, tính nhất quán số liệu

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 56 | TC_RPT_001 | Xem báo cáo doanh thu theo kỳ | Reporting/Revenue | Đảm bảo số liệu doanh thu tính đúng theo thanh toán thành công | Có dữ liệu booking/payment | from/to hợp lệ | 1) Chọn kỳ báo cáo. 2) Tải dữ liệu báo cáo | Doanh thu phản ánh đúng các payment success trong kỳ |  |  | High | Positive, API, Business Rule |  |
| 57 | TC_RPT_002 | Role không đủ quyền truy cập báo cáo | Reporting/Permission | Chặn truy cập báo cáo từ role không phải admin | Customer/Housekeeping đã đăng nhập | Token role không đủ quyền | 1) Gọi endpoint/màn hình báo cáo với role không đủ quyền | Trả 403, không lộ dữ liệu báo cáo |  |  | High | Permission, Security |  |
| 58 | TC_RPT_003 | Tính nhất quán báo cáo với hủy booking và phụ phí | Reporting/Consistency | Đảm bảo báo cáo loại trừ đơn hủy và cộng dịch vụ hợp lệ | Có dữ liệu booking cancel + extra services | Tập dữ liệu mẫu trong kỳ | 1) Đối chiếu báo cáo với dữ liệu nguồn booking/payment/services | Báo cáo khớp quy tắc nghiệp vụ, không chênh lệch sai |  |  | High | Integration, Business Rule |  |
| 59 | TC_RPT_004 | Validate khoảng ngày báo cáo | Reporting/Validation | Chặn khoảng thời gian không hợp lệ | Admin đã đăng nhập | from > to hoặc quá dài theo policy | 1) Nhập khoảng ngày sai. 2) Tải báo cáo | Hệ thống báo lỗi rõ ràng, không xử lý dữ liệu sai |  |  | Medium | Boundary, Validation |  |

## 1.9 Module H - Notification & Scheduler

### Nhóm nghiệp vụ: Gửi thông báo, nhắc thanh toán, tự động hủy, retry khi lỗi

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 60 | TC_SYS_001 | Gửi thông báo khi tạo booking | Notification/Booking created | Đảm bảo phát sinh thông báo đúng thời điểm tạo booking | Booking tạo thành công | bookingCode hợp lệ | 1) Tạo booking mới. 2) Kiểm tra log/email sandbox | Có thông báo chứa đúng mã booking, số tiền, hạn thanh toán |  |  | Medium | Integration |  |
| 61 | TC_SYS_002 | Nhắc thanh toán trước hạn | Scheduler/Reminder | Đảm bảo scheduler gửi reminder theo policy | Scheduler đang bật | Booking pending gần due time | 1) Tạo booking gần đến hạn. 2) Chờ job chạy | Reminder được gửi 1 lần đúng chính sách, có lịch sử gửi |  |  | Medium | Integration, Business Rule |  |
| 62 | TC_SYS_003 | Tự động hủy booking quá hạn | Scheduler/Auto cancel | Đảm bảo booking pending quá hạn bị hủy và giải phóng tồn kho | Scheduler đang bật | Booking pending đã quá due time | 1) Chờ qua hạn thanh toán. 2) Trigger job hoặc chờ lịch job | Booking chuyển `cancelled_by_timeout`, phòng khả dụng lại |  |  | High | Integration, Business Rule |  |
| 63 | TC_SYS_004 | Retry khi provider thông báo lỗi timeout | Notification/Error handling | Đảm bảo cơ chế retry an toàn, không mất sự kiện | Mô phỏng provider timeout tạm thời | Sự kiện gửi mail thất bại lần đầu | 1) Kích hoạt gửi thông báo. 2) Giả lập timeout. 3) Theo dõi retry | Hệ thống retry theo cấu hình, log lỗi rõ, không gửi trùng mất kiểm soát |  |  | Medium | Negative, Error handling, Integration |  |

## 1.10 Module I - Security, Error Handling, API Contract

### Nhóm nghiệp vụ: Kiểm soát truy cập, chống tấn công cơ bản, định dạng lỗi chuẩn

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 64 | TC_SEC_001 | Gọi API protected không token | Security/Auth header | Đảm bảo endpoint bắt buộc xác thực | Không | Không gửi Authorization header | 1) Gọi API bảo vệ mà không có token | Trả 401 unauthorized, không lộ dữ liệu |  |  | High | Security, API, Negative |  |
| 65 | TC_SEC_002 | Token sai định dạng | Security/Token format | Đảm bảo từ chối token malformed | Không | `Bearer abc` hoặc định dạng sai | 1) Gọi API protected với token sai format | Trả 401, thông báo lỗi chuẩn, không lộ stacktrace |  |  | High | Security, Negative |  |
| 66 | TC_SEC_003 | Brute force login cơ bản | Security/Rate limit | Đảm bảo giới hạn đăng nhập sai liên tiếp | Có cấu hình rate limit | N lần login sai liên tục cùng IP/account | 1) Gửi liên tiếp yêu cầu login sai | Hệ thống throttle/rate limit theo policy |  |  | High | Security, Negative |  |
| 67 | TC_SEC_004 | SQL injection cơ bản trên trường tìm kiếm | Security/Input validation | Đảm bảo payload injection không phá vỡ truy vấn | Không | Payload `' OR 1=1 --` | 1) Nhập payload vào ô tìm kiếm/filter. 2) Submit | Không truy xuất dữ liệu bất thường, không lỗi hệ thống |  |  | High | Security, Negative |  |
| 68 | TC_SEC_005 | XSS cơ bản trên nội dung review | Security/XSS | Đảm bảo dữ liệu hiển thị được sanitize/escape | Có chức năng review | `<script>alert(1)</script>` | 1) Gửi review chứa script. 2) Mở màn hiển thị review | Script không được thực thi, nội dung được xử lý an toàn |  |  | High | Security, Negative, UI/UX |  |
| 69 | TC_ERR_001 | Chuẩn hóa response lỗi nghiệp vụ | Error handling/API schema | Đảm bảo lỗi tuân thủ schema phản hồi thống nhất | Có kịch bản lỗi nghiệp vụ | Dữ liệu gây lỗi booking conflict | 1) Tạo tình huống lỗi nghiệp vụ. 2) Kiểm tra body phản hồi | Response có `success=false`, mã lỗi, message rõ ràng |  |  | Medium | API, Error handling |  |
| 70 | TC_ERR_002 | Timeout hệ thống ngoài | Error handling/External dependency | Đảm bảo timeout từ dịch vụ ngoài được xử lý an toàn | Có thể mô phỏng timeout payment/notification | Kịch bản timeout | 1) Kích hoạt tác vụ gọi service ngoài. 2) Mô phỏng timeout | Hệ thống trả lỗi phù hợp, không treo request vô hạn, có log chẩn đoán |  |  | High | Negative, Error handling, Integration |  |

## 1.11 Module J - UI/UX Flow và Responsive

### Nhóm nghiệp vụ: loading/empty/error state, điều hướng, tương thích thiết bị

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 71 | TC_UI_001 | Nút submit bị khóa khi đang xử lý | UI/Loading state | Ngăn double submit gây request trùng | Mô phỏng mạng chậm | Delay request 2-3 giây | 1) Submit form login/booking. 2) Quan sát nút submit | Nút bị disable và hiển thị loading đến khi có phản hồi |  |  | High | UI/UX, Validation |  |
| 72 | TC_UI_002 | Vị trí hiển thị thông báo lỗi form | UI/Error state | Đảm bảo lỗi hiển thị gần trường nhập và dễ hiểu | Có kịch bản validate fail | Form rỗng/thiếu field | 1) Submit form thiếu dữ liệu. 2) Quan sát lỗi | Lỗi hiển thị đúng vị trí field, nội dung rõ ràng |  |  | Medium | UI/UX, Validation |  |
| 73 | TC_UI_003 | Điều hướng theo role sau đăng nhập | UI/Role routing | Đảm bảo mỗi role vào đúng màn hình nghiệp vụ | Có account Customer/Staff/Admin | 3 bộ tài khoản theo role | 1) Đăng nhập từng tài khoản role | Customer vào luồng đặt phòng, Staff vào vận hành, Admin vào quản trị |  |  | High | UI/UX, Permission |  |
| 74 | TC_UI_004 | Empty state lịch sử booking | UI/Empty state | Đảm bảo trải nghiệm rõ ràng khi user chưa có dữ liệu | User mới chưa từng đặt phòng | Tài khoản mới | 1) Đăng nhập user mới. 2) Mở lịch sử booking | Hiển thị empty state và CTA phù hợp, không lỗi hiển thị |  |  | Medium | UI/UX, Negative |  |
| 75 | TC_UI_005 | Error state khi API 5xx/timeout | UI/Error handling | Đảm bảo UI xử lý lỗi backend thân thiện, có khả năng retry | Có thể mô phỏng API lỗi | Lỗi 500/timeout | 1) Mở màn hình phụ thuộc API. 2) Mô phỏng lỗi | Hiển thị thông báo lỗi rõ ràng và nút/thao tác thử lại |  |  | Medium | UI/UX, Error handling |  |
| 76 | TC_UI_006 | Responsive trên mobile 360px | UI/Responsive | Đảm bảo layout không vỡ ở màn hình nhỏ | Dùng trình duyệt devtools | Viewport 360x800 | 1) Kiểm tra các màn chính ở 360px. 2) Thực hiện thao tác chính | Không vỡ layout, form thao tác được, text không tràn |  |  | Medium | UI/UX, Responsive |  |
| 77 | TC_UI_007 | Responsive trên tablet 768px | UI/Responsive | Đảm bảo bố cục và chức năng usable trên tablet | Dùng trình duyệt devtools | Viewport 768x1024 | 1) Kiểm tra màn tìm kiếm/vận hành/quản trị ở 768px | Bố cục phù hợp, filter và CTA sử dụng được |  |  | Medium | UI/UX, Responsive |  |

## 1.12 Module K - End-to-End và luồng tích hợp liên module

### Nhóm nghiệp vụ: Luồng nghiệp vụ xuyên suốt toàn hệ thống

| STT | Mã test case | Tên test case | Module/Chức năng | Mục tiêu kiểm thử | Preconditions | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Priority | Loại test case | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 78 | TC_E2E_001 | Luồng chuẩn từ tìm phòng đến review | E2E/Toàn hệ thống | Xác nhận dữ liệu và trạng thái đồng bộ xuyên suốt | Có dữ liệu phòng, payment sandbox, account customer/staff | Customer A và Staff | 1) Tìm phòng. 2) Tạo booking. 3) Thanh toán thành công. 4) Staff check-in/out. 5) Customer review | Trạng thái đúng chuỗi `pending -> paid -> checked_in -> completed`; phòng cập nhật đúng vòng đời |  |  | High | E2E, Integration, Functional |  |
| 79 | TC_E2E_002 | Luồng quá hạn thanh toán tự động hủy | E2E/Timeout flow | Xác nhận scheduler và tồn kho đồng bộ khi quá hạn | Scheduler bật | Booking mới chưa thanh toán | 1) Tạo booking pending. 2) Chờ quá hạn. 3) Kiểm tra booking và tìm kiếm phòng lại | Booking chuyển timeout-cancel, phòng xuất hiện lại trong tìm kiếm |  |  | High | E2E, Integration, Business Rule |  |
| 80 | TC_E2E_003 | Luồng callback lặp từ cổng thanh toán | E2E/Payment idempotent | Đảm bảo toàn hệ thống không nhân bản giao dịch khi callback lặp | Có booking pending và init payment thành công | Callback success gửi lặp cùng transaction id | 1) Thanh toán thành công. 2) Gửi callback lặp 2-3 lần. 3) Kiểm tra booking/payment/report | Chỉ 1 giao dịch thành công hợp lệ, trạng thái và báo cáo nhất quán |  |  | High | E2E, Integration, API |  |

---

# 2. Ma trận bao phủ theo yêu cầu

| Hạng mục bao phủ | Test case đại diện |
|---|---|
| Positive case | TC_AUTH_001, TC_ROOM_001, TC_BK_001, TC_OPS_002, TC_RPT_001, TC_E2E_001 |
| Negative case | TC_AUTH_006, TC_ROOM_003, TC_BK_005, TC_PAY_004, TC_LC_006, TC_SEC_004 |
| Boundary value | TC_ROOM_002, TC_ROOM_008, TC_BK_004, TC_ADM_006, TC_RPT_004 |
| Validation | TC_AUTH_003, TC_AUTH_004, TC_BK_002, TC_BK_003, TC_UI_002 |
| Permission/Role | TC_AUTH_008, TC_LC_005, TC_OPS_007, TC_ADM_001, TC_UI_003 |
| Business rule | TC_BK_006, TC_PAY_006, TC_LC_006, TC_ADM_004, TC_SYS_003 |
| CRUD | TC_OPS_005, TC_ADM_002, TC_ADM_003, TC_ADM_005, TC_ADM_007 |
| Search/Filter/Sort | TC_ROOM_001, TC_ROOM_005, TC_ROOM_006, TC_ROOM_007, TC_LC_003 |
| Pagination | TC_ROOM_008, TC_LC_001 |
| Upload/Download | Không có chức năng upload/download trong phạm vi hệ thống hiện tại |
| Authentication/Authorization | TC_AUTH_005, TC_AUTH_007, TC_SEC_001, TC_ADM_001 |
| Session/Token | TC_AUTH_007, TC_AUTH_010, TC_SEC_002 |
| Error handling | TC_SYS_004, TC_ERR_001, TC_ERR_002, TC_UI_005 |
| Empty/Loading/Error state | TC_ROOM_009, TC_UI_001, TC_UI_004, TC_UI_005 |
| End-to-End flow | TC_E2E_001, TC_E2E_002, TC_E2E_003 |
| Integration flow | TC_PAY_003, TC_PAY_005, TC_OPS_004, TC_RPT_003, TC_SYS_003 |
| Security test cơ bản | TC_SEC_001, TC_SEC_002, TC_SEC_003, TC_SEC_004, TC_SEC_005 |
| Responsive/UI flow | TC_UI_001, TC_UI_003, TC_UI_006, TC_UI_007 |

---

# 3. Ghi chú thực thi

1. Các test callback/scheduler cần đồng bộ timezone môi trường trước khi chạy.
2. Test concurrency (TC_BK_004) cần công cụ gửi đồng thời để tái hiện chính xác điều kiện race.
3. Test bảo mật chỉ chạy tại môi trường dev/staging, không chạy trên môi trường production.
4. Trước mỗi vòng test regression, cần seed dữ liệu tối thiểu: phòng, bảng giá, booking đa trạng thái, thanh toán success/failed.
