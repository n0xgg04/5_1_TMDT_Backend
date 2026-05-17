# THÔNG TIN ĐỀ TÀI

| Nội dung | Thông tin |
|---|---|
| **Tên đề tài** | Hệ thống Đặt phòng Khách sạn Trực tuyến |
| **Sinh viên thực hiện** | 1. Lương Tuấn Anh - MSSV: B22DCCN021 |
|  | 2. Trần Hữu Phúc - MSSV: B22DCCN634 |
|  | 3. Bùi Ngọc Vũ - MSSV: B22DCCN910 |
|  | 4. Lương Tiến Đạt - MSSV: B22DCCN190 |
| **Lớp** | Chưa cung cấp |

---

# 1. PHẠM VI VÀ NGUYÊN TẮC KIỂM THỬ

## 1.1 Phạm vi module
- Module A: Xác thực và hồ sơ người dùng.
- Module B: Tìm kiếm phòng và xem chi tiết phòng.
- Module C: Đặt phòng và thanh toán.
- Module D: Vòng đời đơn đặt phòng (lịch sử, chi tiết, hủy, đánh giá).
- Module E: Vận hành (room map, check-in/out, trạng thái phòng, dịch vụ phát sinh).
- Module F: Quản trị (phòng, giá, tài khoản nhân sự, phân quyền).
- Module G: Báo cáo.
- Module H: Thông báo và tác vụ lịch (scheduler).
- Module I: Bảo mật, phiên đăng nhập và xử lý lỗi chung.
- Module J: Trạng thái giao diện và responsive.
- Module K: Luồng end-to-end và tích hợp liên module.

## 1.2 Quy ước test case
- Mức ưu tiên: **High / Medium / Low**.
- Loại test: **Positive, Negative, Boundary, Validation, Permission, Security, CRUD, API, UI/UX, Integration**.

---

# 2. DANH SÁCH TEST CASE

## 2.1 Module A - Xác thực và hồ sơ người dùng

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 1 | Đăng ký | **Mã:** TC_AUTH_001<br>**Module/Chức năng:** A/Đăng ký<br>**Mục tiêu:** Đăng ký thành công với email mới hợp lệ<br>**Preconditions:** Email chưa tồn tại<br>**Priority:** High<br>**Loại:** Positive, Validation | Email mới hợp lệ, mật khẩu đạt policy | 1. Mở trang đăng ký.<br>2. Nhập đầy đủ thông tin hợp lệ.<br>3. Bấm Đăng ký. | Tạo tài khoản thành công, có thể đăng nhập bằng tài khoản vừa tạo. | Tạo tài khoản thành công, đăng nhập lại được bằng tài khoản mới. | Pass |  |
| 2 | Đăng ký | **Mã:** TC_AUTH_002<br>**Module/Chức năng:** A/Đăng ký<br>**Mục tiêu:** Chặn đăng ký email trùng<br>**Preconditions:** Email đã tồn tại<br>**Priority:** High<br>**Loại:** Negative, Validation | Email đã tồn tại | 1. Mở trang đăng ký.<br>2. Nhập email đã tồn tại.<br>3. Bấm Đăng ký. | Hệ thống báo lỗi email đã tồn tại, không tạo tài khoản mới. | Hiển thị lỗi đúng, không tạo thêm bản ghi user. | Pass |  |
| 3 | Đăng nhập | **Mã:** TC_AUTH_003<br>**Module/Chức năng:** A/Đăng nhập<br>**Mục tiêu:** Đăng nhập thành công, cấp token hợp lệ<br>**Preconditions:** Tài khoản hoạt động<br>**Priority:** High<br>**Loại:** Positive, API | Email/mật khẩu đúng | 1. Nhập thông tin đúng.<br>2. Bấm Đăng nhập. | Đăng nhập thành công, điều hướng đúng vai trò. | Đăng nhập thành công, JWT trả về hợp lệ. | Pass |  |
| 4 | Đăng nhập | **Mã:** TC_AUTH_004<br>**Module/Chức năng:** A/Đăng nhập<br>**Mục tiêu:** Từ chối mật khẩu sai<br>**Preconditions:** Tài khoản tồn tại<br>**Priority:** High<br>**Loại:** Negative, Security | Email đúng, mật khẩu sai | 1. Nhập email đúng, mật khẩu sai.<br>2. Bấm Đăng nhập. | Trả lỗi xác thực, không tạo phiên. | Trả 401 đúng, không phát sinh session mới. | Pass |  |
| 5 | Session/Token | **Mã:** TC_AUTH_005<br>**Module/Chức năng:** A/Session Token<br>**Mục tiêu:** Từ chối token hết hạn<br>**Preconditions:** Có token hết hạn<br>**Priority:** High<br>**Loại:** Negative, Security, API | Access token hết hạn | 1. Gọi API protected với token hết hạn.<br>2. Quan sát phản hồi. | Trả 401 và yêu cầu đăng nhập lại. | API trả 401 nhưng thông báo chưa nhất quán giữa web và mobile. | Fail | Cần chuẩn hóa thông điệp lỗi token hết hạn. |
| 6 | Phân quyền hồ sơ | **Mã:** TC_AUTH_006<br>**Module/Chức năng:** A/Hồ sơ cá nhân<br>**Mục tiêu:** Không cho người dùng sửa hồ sơ người khác<br>**Preconditions:** Có Customer A/B<br>**Priority:** High<br>**Loại:** Permission, Security | Token A, ID hồ sơ B | 1. Đăng nhập A.<br>2. Cập nhật hồ sơ B. | Trả 403, dữ liệu B không đổi. | Bị chặn 403, dữ liệu B giữ nguyên. | Pass |  |

## 2.2 Module B - Tìm kiếm và khám phá phòng

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 7 | Tìm kiếm phòng | **Mã:** TC_ROOM_001<br>**Module/Chức năng:** B/Tìm kiếm phòng<br>**Mục tiêu:** Trả danh sách phòng khả dụng<br>**Preconditions:** Có dữ liệu phòng/tồn kho<br>**Priority:** High<br>**Loại:** Positive, Functional | Khoảng ngày và số khách hợp lệ | 1. Nhập tiêu chí hợp lệ.<br>2. Bấm Tìm kiếm. | Hiển thị danh sách phòng còn trống đúng tiêu chí. | Trả kết quả đúng, đủ giá/sức chứa. | Pass |  |
| 8 | Validation ngày | **Mã:** TC_ROOM_002<br>**Module/Chức năng:** B/Tìm kiếm phòng<br>**Mục tiêu:** Chặn check-out <= check-in<br>**Preconditions:** Không<br>**Priority:** High<br>**Loại:** Negative, Boundary, Validation | check-out <= check-in | 1. Nhập khoảng ngày sai.<br>2. Bấm Tìm kiếm. | Hiển thị lỗi khoảng ngày không hợp lệ. | Hiển thị lỗi đúng, không gửi request xuống backend. | Pass |  |
| 9 | Search/Filter | **Mã:** TC_ROOM_003<br>**Module/Chức năng:** B/Lọc phòng<br>**Mục tiêu:** Lọc đúng loại phòng/khoảng giá<br>**Preconditions:** Có nhiều loại và mức giá<br>**Priority:** Medium<br>**Loại:** Positive, Functional | Deluxe; 800000-1200000 | 1. Áp dụng bộ lọc.<br>2. Đối chiếu danh sách. | Kết quả chỉ gồm phòng thỏa điều kiện lọc. | Có 1 phòng vượt maxPrice vẫn hiển thị. | Fail | Cần kiểm tra điều kiện `maxPrice` phía backend. |
| 10 | Sort | **Mã:** TC_ROOM_004<br>**Module/Chức năng:** B/Sắp xếp<br>**Mục tiêu:** Sắp xếp tăng/giảm theo giá chính xác<br>**Preconditions:** >=5 kết quả<br>**Priority:** Medium<br>**Loại:** Positive, UI/UX | sort asc/desc | 1. Chọn sort tăng dần.<br>2. Chọn sort giảm dần. | Thứ tự giá đúng theo lựa chọn. | Thứ tự asc/desc chính xác. | Pass |  |
| 11 | Pagination | **Mã:** TC_ROOM_005<br>**Module/Chức năng:** B/Phân trang<br>**Mục tiêu:** Phân trang đúng dữ liệu và metadata<br>**Preconditions:** Dữ liệu >1 trang<br>**Priority:** Medium<br>**Loại:** Boundary, API | page=1,2; limit=10 | 1. Tải trang 1.<br>2. Tải trang 2.<br>3. So sánh dữ liệu. | Metadata chính xác, dữ liệu không trùng sai. | Metadata đúng, không trùng dữ liệu giữa 2 trang. | Pass |  |
| 12 | Empty state | **Mã:** TC_ROOM_006<br>**Module/Chức năng:** B/Trạng thái rỗng<br>**Mục tiêu:** Hiển thị empty state khi không có phòng<br>**Preconditions:** Khoảng ngày kín phòng<br>**Priority:** Medium<br>**Loại:** Negative, UI/UX | Date range không còn phòng | 1. Tìm kiếm với tiêu chí kín phòng. | Hiển thị empty state rõ ràng, không lỗi UI. | Empty state hiển thị đúng, có CTA đổi bộ lọc. | Pass |  |

## 2.3 Module C - Đặt phòng và thanh toán

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 13 | Tạo booking | **Mã:** TC_BK_001<br>**Module/Chức năng:** C/Tạo booking<br>**Mục tiêu:** Tạo booking thành công<br>**Preconditions:** User đăng nhập, phòng còn trống<br>**Priority:** High<br>**Loại:** Positive, API | roomId hợp lệ, acceptTerms=true | 1. Nhập form hợp lệ.<br>2. Xác nhận điều khoản.<br>3. Submit. | Tạo booking trạng thái pending_payment. | Booking tạo thành công, có bookingCode và due time. | Pass |  |
| 14 | Validation booking | **Mã:** TC_BK_002<br>**Module/Chức năng:** C/Tạo booking<br>**Mục tiêu:** Bắt buộc xác nhận điều khoản<br>**Preconditions:** User đăng nhập<br>**Priority:** High<br>**Loại:** Negative, Validation | acceptTerms=false | 1. Không tick điều khoản.<br>2. Submit. | Hệ thống chặn và hiển thị lỗi. | Chặn đúng, báo lỗi rõ tại checkbox điều khoản. | Pass |  |
| 15 | Boundary/Concurrency | **Mã:** TC_BK_003<br>**Module/Chức năng:** C/Đặt phòng đồng thời<br>**Mục tiêu:** Không overbooking<br>**Preconditions:** 2 người dùng đồng thời đặt cùng phòng<br>**Priority:** High<br>**Loại:** Negative, Boundary, Integration | 2 request cùng room/date | 1. Bắn song song 2 request.<br>2. So sánh kết quả. | Chỉ 1 booking thành công. | 1 thành công, 1 bị BOOKING_CONFLICT đúng kỳ vọng. | Pass |  |
| 16 | Khởi tạo thanh toán | **Mã:** TC_PAY_001<br>**Module/Chức năng:** C/Payment Init<br>**Mục tiêu:** Tạo phiên thanh toán cho booking pending<br>**Preconditions:** Booking pending_payment<br>**Priority:** High<br>**Loại:** Positive, API | bookingCode pending | 1. Gọi init payment.<br>2. Kiểm tra response. | Trả payment URL/transaction hợp lệ. | Trả payment URL hoạt động bình thường. | Pass |  |
| 17 | Callback thanh toán | **Mã:** TC_PAY_002<br>**Module/Chức năng:** C/Payment Callback<br>**Mục tiêu:** Callback hợp lệ cập nhật đúng trạng thái<br>**Preconditions:** Có payment pending<br>**Priority:** High<br>**Loại:** Positive, Integration, API | Payload callback hợp lệ | 1. Gửi callback success.<br>2. Kiểm tra booking/payment. | payment=success, booking=paid. | Cập nhật đúng trạng thái và ghi log đầy đủ. | Pass |  |
| 18 | Security callback | **Mã:** TC_PAY_003<br>**Module/Chức năng:** C/Payment Callback<br>**Mục tiêu:** Từ chối callback sai chữ ký<br>**Preconditions:** Booking pending<br>**Priority:** High<br>**Loại:** Negative, Security | Payload sai chữ ký | 1. Gửi callback hash sai.<br>2. Kiểm tra trạng thái. | Trả lỗi xác minh chữ ký, không cập nhật trạng thái. | Trả lỗi đúng nhưng HTTP code đang là 200 thay vì 400. | Fail | Cần chuẩn hóa status code cho callback invalid. |

## 2.4 Module D - Vòng đời booking và đánh giá

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 19 | Lịch sử booking | **Mã:** TC_LC_001<br>**Module/Chức năng:** D/Lịch sử booking<br>**Mục tiêu:** Chỉ xem lịch sử của chính mình<br>**Preconditions:** Customer có booking<br>**Priority:** High<br>**Loại:** Positive, Permission | Token customer A | 1. Đăng nhập A.<br>2. Mở lịch sử. | Chỉ thấy booking của A. | Chỉ hiển thị booking của A, phân trang hoạt động. | Pass |  |
| 20 | IDOR booking detail | **Mã:** TC_LC_002<br>**Module/Chức năng:** D/Chi tiết booking<br>**Mục tiêu:** Chặn xem booking của user khác<br>**Preconditions:** Có booking của B<br>**Priority:** High<br>**Loại:** Security, Permission | Token A, booking B | 1. A truy cập booking của B. | Trả 403/not found theo policy. | Trả 403, không lộ thông tin booking B. | Pass |  |
| 21 | Hủy booking | **Mã:** TC_LC_003<br>**Module/Chức năng:** D/Hủy booking<br>**Mục tiêu:** Hủy booking hợp lệ **Preconditions:** Booking pending/paid, chưa check-in<br>**Priority:** High<br>**Loại:** Positive, Business Rule | bookingCode hợp lệ | 1. Mở chi tiết booking.<br>2. Thực hiện hủy. | Booking hủy thành công, giải phóng tồn kho. | Trạng thái chuyển cancelled_by_user, tồn kho cập nhật đúng. | Pass |  |
| 22 | Rule hủy booking | **Mã:** TC_LC_004<br>**Module/Chức năng:** D/Hủy booking<br>**Mục tiêu:** Chặn hủy booking đã check-in<br>**Preconditions:** Booking checked_in<br>**Priority:** High<br>**Loại:** Negative, Business Rule | booking checked_in | 1. Gửi yêu cầu hủy. | Trả lỗi nghiệp vụ, giữ nguyên trạng thái. | Trả lỗi đúng, booking vẫn checked_in. | Pass |  |
| 23 | Đánh giá | **Mã:** TC_RV_001<br>**Module/Chức năng:** D/Review<br>**Mục tiêu:** Review khi booking completed
**Preconditions:** Booking completed<br>**Priority:** Medium<br>**Loại:** Positive, Validation | rating=5, content hợp lệ | 1. Mở form review.<br>2. Submit. | Tạo review thành công. | Tạo review thành công, liên kết đúng booking/user. | Pass |  |
| 24 | Rule review | **Mã:** TC_RV_002<br>**Module/Chức năng:** D/Review<br>**Mục tiêu:** 1 booking chỉ 1 review
**Preconditions:** Booking đã có review<br>**Priority:** Medium<br>**Loại:** Negative, Validation | Submit review lần 2 | 1. Gửi review lần hai. | Từ chối tạo review trùng. | Bị chặn đúng, không tạo bản ghi mới. | Pass |  |

## 2.5 Module E - Vận hành khách sạn

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 25 | Room map | **Mã:** TC_OPS_001<br>**Module/Chức năng:** E/Room map<br>**Mục tiêu:** Hiển thị đúng trạng thái phòng theo bộ lọc<br>**Preconditions:** Staff login<br>**Priority:** High<br>**Loại:** Positive, UI/UX | floor=2, status=dirty | 1. Mở room map.<br>2. Lọc theo tầng/trạng thái. | Kết quả đúng theo filter và legend. | Dữ liệu và màu trạng thái hiển thị chính xác. | Pass |  |
| 26 | Check-in | **Mã:** TC_OPS_002<br>**Module/Chức năng:** E/Check-in<br>**Mục tiêu:** Check-in thành công booking paid<br>**Preconditions:** Booking paid<br>**Priority:** High<br>**Loại:** Positive, Integration | bookingCode paid | 1. Staff check-in booking paid. | Booking=checked_in, room=occupied. | Cập nhật trạng thái đúng cả booking và room. | Pass |  |
| 27 | Rule check-in | **Mã:** TC_OPS_003<br>**Module/Chức năng:** E/Check-in<br>**Mục tiêu:** Chặn check-in booking chưa thanh toán<br>**Preconditions:** Booking pending_payment<br>**Priority:** High<br>**Loại:** Negative, Business Rule | booking pending | 1. Thực hiện check-in. | Bị từ chối, không đổi trạng thái. | Trả lỗi đúng, trạng thái giữ nguyên. | Pass |  |
| 28 | Check-out | **Mã:** TC_OPS_004<br>**Module/Chức năng:** E/Check-out<br>**Mục tiêu:** Check-out thành công và cập nhật trạng thái phòng<br>**Preconditions:** Booking checked_in<br>**Priority:** High<br>**Loại:** Positive, Integration | booking checked_in | 1. Staff check-out. | Booking=completed, room=dirty. | Cập nhật đúng nhưng invoice thiếu mã VAT. | Fail | Bổ sung trường VAT cho hóa đơn tổng kết. |
| 29 | CRUD dịch vụ | **Mã:** TC_OPS_005<br>**Module/Chức năng:** E/Dịch vụ phát sinh<br>**Mục tiêu:** Thêm dịch vụ hợp lệ cho booking lưu trú<br>**Preconditions:** Booking checked_in<br>**Priority:** High<br>**Loại:** CRUD, Business Rule | serviceId hợp lệ, qty=2 | 1. Thêm dịch vụ phát sinh. | Tạo bản ghi dịch vụ, tổng tiền tăng đúng. | Tạo thành công, tổng tiền cập nhật đúng. | Pass |  |
| 30 | Validation dịch vụ | **Mã:** TC_OPS_006<br>**Module/Chức năng:** E/Dịch vụ phát sinh<br>**Mục tiêu:** Chặn qty <= 0<br>**Preconditions:** Booking checked_in<br>**Priority:** Medium<br>**Loại:** Boundary, Validation | qty=0 hoặc -1 | 1. Submit qty không hợp lệ. | Trả lỗi validate, không lưu dữ liệu. | Trả lỗi đúng cho qty=0 và qty=-1. | Pass |  |

## 2.6 Module F - Quản trị và phân quyền

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 31 | Authorization admin | **Mã:** TC_ADM_001<br>**Module/Chức năng:** F/Phân quyền admin API<br>**Mục tiêu:** Chỉ Admin truy cập endpoint quản trị<br>**Preconditions:** Có token Customer/Staff/Admin<br>**Priority:** High<br>**Loại:** Permission, Security, API | Token theo 3 vai trò | 1. Gọi endpoint admin bằng từng role. | Customer/Staff 403, Admin thành công. | Kết quả đúng theo ma trận phân quyền. | Pass |  |
| 32 | CRUD phòng | **Mã:** TC_ADM_002<br>**Module/Chức năng:** F/Quản lý phòng - Tạo mới<br>**Mục tiêu:** Tạo phòng mới thành công<br>**Preconditions:** Admin đăng nhập<br>**Priority:** High<br>**Loại:** Positive, CRUD | room_number mới | 1. Tạo phòng mới.<br>2. Lưu. | Phòng mới xuất hiện trong danh sách quản trị/room map. | Tạo thành công, đồng bộ đúng sang room map. | Pass |  |
| 33 | Rule xóa phòng | **Mã:** TC_ADM_003<br>**Module/Chức năng:** F/Quản lý phòng - Xóa<br>**Mục tiêu:** Chặn xóa phòng có booking hoạt động<br>**Preconditions:** Phòng có booking pending/paid<br>**Priority:** High<br>**Loại:** Negative, Business Rule | roomId có booking hoạt động | 1. Thử xóa phòng. | Trả lỗi nghiệp vụ, không xóa phòng. | Chặn đúng, dữ liệu phòng còn nguyên. | Pass |  |
| 34 | CRUD bảng giá | **Mã:** TC_ADM_004<br>**Module/Chức năng:** F/Quản lý giá<br>**Mục tiêu:** Tạo rule giá thành công và áp dụng vào booking<br>**Preconditions:** Admin đăng nhập<br>**Priority:** High<br>**Loại:** Positive, CRUD | Rule giá hợp lệ | 1. Tạo rule giá.<br>2. Tạo booking trong khoảng áp dụng. | Rule được lưu và áp dụng đúng. | Rule được tạo, booking áp dụng đúng giá mới. | Pass |  |
| 35 | Boundary pricing | **Mã:** TC_ADM_005<br>**Module/Chức năng:** F/Quản lý giá<br>**Mục tiêu:** Xử lý rule giá chồng lấp đúng ưu tiên<br>**Preconditions:** Có 2 rule overlap<br>**Priority:** High<br>**Loại:** Boundary, Business Rule | 2 rule overlap | 1. Cấu hình rule overlap.<br>2. Tạo booking kiểm tra giá. | Áp dụng đúng rule theo ưu tiên. | Áp dụng sai ưu tiên trong 1 trường hợp cùng mức ưu tiên. | Fail | Cần rà logic so sánh `updatedAt` khi cùng priority. |
| 36 | CRUD tài khoản nhân sự | **Mã:** TC_ADM_006<br>**Module/Chức năng:** F/Quản lý tài khoản Staff<br>**Mục tiêu:** Tạo/khóa/mở khóa staff đúng nghiệp vụ<br>**Preconditions:** Admin đăng nhập<br>**Priority:** High<br>**Loại:** CRUD, Permission | email staff mới | 1. Tạo staff.<br>2. Khóa staff.<br>3. Mở khóa staff. | Tạo thành công; khóa thì không đăng nhập; mở khóa đăng nhập lại được. | Đạt đúng toàn bộ kỳ vọng. | Pass |  |

## 2.7 Module G - Báo cáo

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 37 | Báo cáo doanh thu | **Mã:** TC_RPT_001<br>**Module/Chức năng:** G/Báo cáo doanh thu<br>**Mục tiêu:** Trả số liệu doanh thu đúng theo kỳ<br>**Preconditions:** Có dữ liệu booking/payment<br>**Priority:** High<br>**Loại:** Positive, API | from/to hợp lệ | 1. Mở báo cáo kỳ ngày.<br>2. Đối chiếu nguồn dữ liệu. | Số liệu doanh thu chính xác theo payment success. | Chênh lệch 1.200.000 do chưa loại booking refund. | Fail | Cần trừ giao dịch refund khỏi tổng doanh thu. |
| 38 | Validation báo cáo | **Mã:** TC_RPT_002<br>**Module/Chức năng:** G/Báo cáo doanh thu<br>**Mục tiêu:** Chặn khoảng thời gian không hợp lệ<br>**Preconditions:** Admin đăng nhập<br>**Priority:** Medium<br>**Loại:** Boundary, Validation | from > to | 1. Nhập from > to.<br>2. Bấm xem báo cáo. | Hiển thị lỗi validate rõ ràng. | Trả lỗi đúng, không sinh dữ liệu báo cáo. | Pass |  |

## 2.8 Module H - Thông báo và scheduler

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 39 | Notification | **Mã:** TC_SYS_001<br>**Module/Chức năng:** H/Thông báo tạo booking<br>**Mục tiêu:** Gửi thông báo khi tạo booking thành công<br>**Preconditions:** Kênh thông báo hoạt động<br>**Priority:** Medium<br>**Loại:** Integration | bookingCode pending | 1. Tạo booking mới.<br>2. Kiểm tra email/log. | Có thông báo đúng nội dung booking. | Thông báo gửi thành công, nội dung đầy đủ. | Pass |  |
| 40 | Auto cancel timeout | **Mã:** TC_SYS_002<br>**Module/Chức năng:** H/Scheduler<br>**Mục tiêu:** Tự động hủy booking quá hạn thanh toán<br>**Preconditions:** Scheduler bật, booking quá hạn<br>**Priority:** High<br>**Loại:** Integration, Business Rule | booking pending quá hạn | 1. Chờ scheduler chạy.<br>2. Kiểm tra trạng thái booking/tồn kho. | Booking bị hủy và tồn kho được trả lại. | Hủy thành công nhưng job chạy trễ ~3 phút so với lịch. | Fail | Cần tối ưu cron hoặc worker delay. |

## 2.9 Module I - Bảo mật, phiên và xử lý lỗi

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 41 | Authentication | **Mã:** TC_SEC_001<br>**Module/Chức năng:** I/Protected API<br>**Mục tiêu:** Từ chối request thiếu token<br>**Preconditions:** Không<br>**Priority:** High<br>**Loại:** Security, API | Không gửi Authorization | 1. Gọi API protected không token. | Trả 401 Unauthorized. | Trả 401 đúng, không lộ dữ liệu. | Pass |  |
| 42 | Session logout | **Mã:** TC_SEC_002<br>**Module/Chức năng:** I/Đăng xuất<br>**Mục tiêu:** Token không dùng lại được sau logout<br>**Preconditions:** Người dùng đã đăng nhập<br>**Priority:** High<br>**Loại:** Security, Session | Token vừa logout | 1. Logout.<br>2. Dùng lại token cũ gọi API. | Hệ thống từ chối token cũ. | Trả 401 đúng sau logout. | Pass |  |
| 43 | Input Security | **Mã:** TC_SEC_003<br>**Module/Chức năng:** I/Injection cơ bản<br>**Mục tiêu:** Payload độc hại không làm lộ dữ liệu/thực thi script<br>**Preconditions:** Có form tìm kiếm/review<br>**Priority:** High<br>**Loại:** Security, Negative | `' OR 1=1 --`, `<script>alert(1)</script>` | 1. Nhập payload vào ô tìm kiếm/review.<br>2. Quan sát phản hồi. | Hệ thống xử lý an toàn, không injection/XSS. | SQLi bị chặn tốt; review chưa escape toàn bộ thẻ script. | Fail | Cần sanitize output HTML ở màn review. |
| 44 | Error handling | **Mã:** TC_ERR_001<br>**Module/Chức năng:** I/Chuẩn lỗi API<br>**Mục tiêu:** Lỗi nghiệp vụ trả theo schema chuẩn<br>**Preconditions:** Có kịch bản gây lỗi nghiệp vụ<br>**Priority:** Medium<br>**Loại:** API, Error Handling | Request gây booking conflict | 1. Gửi request gây xung đột.<br>2. Kiểm tra body lỗi. | Response chứa code/message nhất quán. | Đúng schema chuẩn, dễ truy vết log. | Pass |  |

## 2.10 Module J - UI flow, loading/empty/error và responsive

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 45 | Loading state | **Mã:** TC_UI_001<br>**Module/Chức năng:** J/Form UI<br>**Mục tiêu:** Chống submit trùng khi request đang xử lý<br>**Preconditions:** Mạng chậm mô phỏng<br>**Priority:** High<br>**Loại:** UI/UX, Validation | Delay 2-3 giây | 1. Submit form.<br>2. Click submit liên tiếp. | Nút disable + loading, chỉ gửi 1 request. | Nút khóa đúng, không gửi request trùng. | Pass |  |
| 46 | Error state UI | **Mã:** TC_UI_002<br>**Module/Chức năng:** J/Thông báo lỗi UI<br>**Mục tiêu:** Hiển thị lỗi rõ ràng khi API 5xx/timeout<br>**Preconditions:** Mô phỏng API lỗi<br>**Priority:** Medium<br>**Loại:** UI/UX, Error Handling | API 500/timeout | 1. Mở màn hình gọi API.<br>2. Kích hoạt lỗi. | Hiển thị thông báo thân thiện và cho retry. | Hiển thị đúng, retry hoạt động ổn định. | Pass |  |
| 47 | Responsive mobile | **Mã:** TC_UI_003<br>**Module/Chức năng:** J/Responsive<br>**Mục tiêu:** Không vỡ layout trên mobile<br>**Preconditions:** Có frontend<br>**Priority:** Medium<br>**Loại:** UI/UX, Responsive | 360x800 | 1. Kiểm tra các màn chính ở 360x800. | Layout không vỡ, thao tác đầy đủ. | Ở trang booking có tràn text nhẹ tại nhãn giá khuyến mãi. | Fail | Cần chỉnh CSS wrap text tại card giá mobile. |

## 2.11 Module K - End-to-end và tích hợp liên module

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 48 | E2E booking chuẩn | **Mã:** TC_E2E_001<br>**Module/Chức năng:** K/E2E flow chuẩn<br>**Mục tiêu:** Bao phủ đầy đủ từ tìm phòng đến review<br>**Preconditions:** Có account Customer/Staff, payment sandbox chạy tốt<br>**Priority:** High<br>**Loại:** Integration, Functional | Customer A, Staff | 1. Tìm phòng.<br>2. Tạo booking.<br>3. Thanh toán.<br>4. Check-in/out.<br>5. Review. | Luồng trạng thái xuyên suốt đúng nghiệp vụ. | Luồng chạy xuyên suốt thành công, trạng thái đồng bộ chính xác. | Pass |  |
| 49 | E2E timeout | **Mã:** TC_E2E_002<br>**Module/Chức năng:** K/E2E timeout<br>**Mục tiêu:** Booking quá hạn tự hủy và trả phòng về tồn kho<br>**Preconditions:** Scheduler bật<br>**Priority:** High<br>**Loại:** Integration, Business Rule | booking pending không thanh toán | 1. Tạo booking pending.<br>2. Chờ quá hạn.<br>3. Kiểm tra search lại phòng. | Booking hủy tự động, phòng xuất hiện lại. | Booking hủy đúng, phòng xuất hiện lại sau 1 chu kỳ job. | Pass |  |
| 50 | E2E phân quyền chéo | **Mã:** TC_E2E_003<br>**Module/Chức năng:** K/E2E permission<br>**Mục tiêu:** Vai trò chỉ thao tác trong phạm vi cho phép<br>**Preconditions:** Có đủ role Customer/Staff/Housekeeping/Admin<br>**Priority:** High<br>**Loại:** Permission, Security, Integration | Token theo từng vai trò | 1. Customer thử endpoint admin.<br>2. Housekeeping thử check-out.<br>3. Staff thử pricing CRUD.<br>4. Admin thao tác hợp quyền. | Truy cập vượt quyền bị từ chối, đúng quyền thì thành công. | Ma trận quyền hoạt động đúng, không phát hiện bypass. | Pass |  |

---

# 3. MA TRẬN BAO PHỦ KIỂM THỬ

| Nhóm bao phủ | Test case đại diện |
|---|---|
| Positive case | TC_AUTH_001, TC_AUTH_003, TC_ROOM_001, TC_BK_001, TC_PAY_001, TC_OPS_002, TC_ADM_002, TC_RPT_001, TC_E2E_001 |
| Negative case | TC_AUTH_002, TC_AUTH_004, TC_ROOM_002, TC_BK_002, TC_PAY_003, TC_LC_004, TC_ADM_003, TC_SEC_003 |
| Boundary value | TC_ROOM_002, TC_ROOM_005, TC_BK_003, TC_OPS_006, TC_ADM_005, TC_RPT_002 |
| Validation | TC_AUTH_001, TC_AUTH_002, TC_ROOM_002, TC_BK_002, TC_OPS_006, TC_RPT_002 |
| Permission/Role | TC_AUTH_006, TC_LC_001, TC_LC_002, TC_ADM_001, TC_ADM_006, TC_E2E_003 |
| Business rule | TC_LC_003, TC_LC_004, TC_OPS_003, TC_ADM_003, TC_ADM_005, TC_SYS_002, TC_E2E_002 |
| CRUD | TC_OPS_005, TC_ADM_002, TC_ADM_004, TC_ADM_006 |
| Search/Filter/Sort | TC_ROOM_001, TC_ROOM_003, TC_ROOM_004 |
| Pagination | TC_ROOM_005, TC_LC_001 |
| Upload/Download | Không áp dụng trong phạm vi hệ thống hiện tại |
| Authentication/Authorization | TC_AUTH_003, TC_AUTH_005, TC_ADM_001, TC_SEC_001 |
| Session/Token | TC_AUTH_005, TC_SEC_002 |
| Error handling | TC_ERR_001, TC_UI_002 |
| Empty/Loading/Error state | TC_ROOM_006, TC_UI_001, TC_UI_002 |
| End-to-end flow | TC_E2E_001, TC_E2E_002, TC_E2E_003 |
| Integration flow | TC_BK_003, TC_PAY_002, TC_OPS_002, TC_SYS_002, TC_E2E_001 |
| Security cơ bản | TC_PAY_003, TC_SEC_001, TC_SEC_003, TC_LC_002 |
| Responsive/UI flow | TC_UI_001, TC_UI_002, TC_UI_003 |
