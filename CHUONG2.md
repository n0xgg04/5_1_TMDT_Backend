# THIẾT KẾ HỆ THỐNG - MÔ TẢ VÀ ĐẶC TẢ USECASE CHI TIẾT



## 1. Mô tả Usecase tổng quát (Bảng danh mục Usecase):

- Lập bảng liệt kê tất cả các usecase từ biểu đồ Usecase tổng quát.
- Phân loại theo tác nhân và thêm một cột "Mô tả ngắn gọn".

| Tác nhân | Tên Usecase | Mô tả ngắn gọn |
|---|---|---|
| Khách hàng | Quản lý tài khoản cá nhân | Cho phép khách hàng đăng ký, đăng nhập, cập nhật hồ sơ cá nhân và quản lý thông tin tài khoản. |
|  | Tra cứu thông tin phòng | Cho phép khách hàng tìm kiếm, lọc và xem thông tin chi tiết phòng theo ngày, giờ, số khách, loại phòng và giá. |
|  | Đặt phòng trực tuyến | Cho phép khách hàng chọn phòng, nhập biểu mẫu đặt phòng, chọn hình thức thanh toán hoặc đặt cọc và gửi yêu cầu chờ duyệt. |
|  | Quản lý đặt phòng cá nhân | Cho phép khách hàng xem lịch sử đặt phòng, theo dõi trạng thái đơn và hủy đặt phòng nếu thỏa điều kiện. |
|  | Thanh toán | Cho phép khách hàng thanh toán qua VNPay, chuyển khoản hoặc đặt cọc theo chính sách của khách sạn. |
|  | Đánh giá / phản hồi | Cho phép khách hàng gửi đánh giá hoặc phản hồi về phòng và dịch vụ sau khi sử dụng. |
| Nhân viên / Lễ tân | Quản lý đặt phòng | Cho phép nhân viên xem danh sách đơn chờ duyệt, kiểm tra thông tin và duyệt hoặc từ chối đặt phòng. |
|  | Quản lý check-in / check-out | Cho phép nhân viên thực hiện thủ tục nhận phòng và trả phòng cho khách hàng. |
|  | Quản lý tình trạng phòng | Cho phép nhân viên xem sơ đồ phòng và cập nhật trạng thái phòng theo thời gian thực. |
|  | Quản lý yêu cầu khách hàng | Cho phép nhân viên tiếp nhận, xử lý và cập nhật trạng thái các yêu cầu phát sinh của khách hàng. |
|  | Thanh toán | Cho phép nhân viên xác nhận thanh toán, chuyển khoản hoặc đặt cọc khi khách hàng thanh toán tại quầy hoặc cần kiểm tra thủ công. |
| Quản trị viên | Quản lý phòng & loại phòng | Cho phép quản trị viên thêm, sửa, xóa phòng và quản lý các loại phòng trong khách sạn. |
|  | Quản lý giá & khuyến mãi | Cho phép quản trị viên thiết lập giá phòng, cập nhật giá theo thời điểm và quản lý chương trình khuyến mãi. |
|  | Quản lý tài khoản người dùng | Cho phép quản trị viên quản lý tài khoản khách hàng, nhân viên và phân quyền sử dụng hệ thống. |
|  | Quản lý dịch vụ khách sạn | Cho phép quản trị viên quản lý các dịch vụ đi kèm như ăn sáng, giặt ủi, đưa đón, spa. |
|  | Thống kê / báo cáo | Cho phép quản trị viên xem báo cáo doanh thu, số lượng đặt phòng và tình hình hoạt động của khách sạn. |
|  | Quản lý đặt phòng | Cho phép quản trị viên theo dõi, kiểm tra và can thiệp vào các đơn đặt phòng khi cần thiết. |
| Hệ thống | Gửi thông báo tự động | Hệ thống tự động gửi thông báo cho khách hàng hoặc nhân viên khi có thay đổi về đặt phòng, thanh toán hoặc trạng thái phòng. |

---

## 2. Đặc tả Usecase chi tiết cho TẤT CẢ các Usecase:

- Yêu cầu bắt buộc: Đặc tả chi tiết lần lượt từng usecase trong bảng trên.
- Trình bày: Với mỗi usecase, trình bày theo một cấu trúc bảng thống nhất để dễ tra cứu.

---

### Tên Usecase: Quản lý tài khoản cá nhân

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng |
| Mô tả | Cho phép khách hàng đăng ký, đăng nhập, cập nhật hồ sơ cá nhân, đổi mật khẩu và quản lý thông tin tài khoản. |
| Điều kiện tiên quyết | 1. Khách hàng truy cập vào hệ thống đặt phòng khách sạn trực tuyến.<br>2. Hệ thống đang hoạt động bình thường. |
| Điều kiện kết thúc | Thành công: Khách hàng đăng ký, đăng nhập hoặc cập nhật thông tin tài khoản thành công.<br>Thất bại: Hệ thống thông báo lỗi, thông tin tài khoản không thay đổi. |
| Luồng sự kiện chính | 1. Khách hàng chọn chức năng quản lý tài khoản cá nhân.<br>2. Hệ thống hiển thị các chức năng: đăng ký, đăng nhập, cập nhật hồ sơ, đổi mật khẩu.<br>3. Khách hàng nhập thông tin cần thiết.<br>4. Hệ thống kiểm tra dữ liệu nhập vào.<br>5. Hệ thống xác thực hoặc lưu thông tin tài khoản.<br>6. Hệ thống thông báo kết quả cho khách hàng. |
| Luồng sự kiện phụ | A1: Thông tin nhập không hợp lệ.<br>Hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại.<br><br>A2: Email hoặc số điện thoại đã tồn tại.<br>Hệ thống thông báo tài khoản đã được sử dụng.<br><br>A3: Khách hàng quên mật khẩu.<br>Hệ thống hỗ trợ khôi phục mật khẩu qua email hoặc số điện thoại. |

---

### Tên Usecase: Tra cứu thông tin phòng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng |
| Mô tả | Cho phép khách hàng tìm kiếm, lọc và xem thông tin chi tiết các phòng trong khách sạn. |
| Điều kiện tiên quyết | 1. Hệ thống có dữ liệu phòng, loại phòng, giá phòng và trạng thái phòng.<br>2. Khách hàng truy cập vào website. |
| Điều kiện kết thúc | Thành công: Hệ thống hiển thị danh sách phòng phù hợp với tiêu chí tìm kiếm.<br>Thất bại: Hệ thống thông báo không tìm thấy phòng phù hợp. |
| Luồng sự kiện chính | 1. Khách hàng chọn chức năng tra cứu thông tin phòng.<br>2. Hệ thống hiển thị danh sách phòng hiện có.<br>3. Khách hàng nhập tiêu chí tìm kiếm như ngày nhận phòng, giờ nhận phòng, ngày trả phòng, số khách, loại phòng và mức giá.<br>4. Hệ thống lọc danh sách phòng theo tiêu chí.<br>5. Khách hàng chọn một phòng để xem chi tiết.<br>6. Hệ thống hiển thị thông tin chi tiết gồm hình ảnh, tiện nghi, giá, mô tả và trạng thái phòng. |
| Luồng sự kiện phụ | A1: Không có phòng phù hợp.<br>Hệ thống hiển thị thông báo không tìm thấy kết quả và gợi ý khách hàng thay đổi tiêu chí.<br><br>A2: Tiêu chí tìm kiếm không hợp lệ.<br>Hệ thống yêu cầu khách hàng nhập lại thông tin. |

---

### Tên Usecase: Đặt phòng trực tuyến

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng |
| Mô tả | Cho phép khách hàng chọn phòng, nhập biểu mẫu đặt phòng, chọn hình thức thanh toán hoặc đặt cọc và gửi yêu cầu đặt phòng để nhân viên duyệt. |
| Điều kiện tiên quyết | 1. Khách hàng đã tìm kiếm và chọn được phòng muốn đặt.<br>2. Phòng đang ở trạng thái còn khả dụng trong khoảng thời gian khách yêu cầu.<br>3. Khách hàng đã nhập đầy đủ thông tin đặt phòng gồm ngày, giờ, số khách và yêu cầu đặc biệt nếu có. |
| Điều kiện kết thúc | Thành công: Hệ thống tạo đơn đặt phòng ở trạng thái **PendingApproval** để chờ nhân viên duyệt.<br>Thất bại: Hệ thống không tạo đơn đặt phòng và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Khách hàng tìm kiếm phòng theo nhu cầu.<br>2. Hệ thống hiển thị danh sách phòng phù hợp.<br>3. Khách hàng chọn phòng muốn đặt.<br>4. Hệ thống hiển thị biểu mẫu đặt phòng.<br>5. Khách hàng nhập ngày nhận phòng, giờ nhận phòng, ngày trả phòng, số khách và yêu cầu đặc biệt.<br>6. Hệ thống kiểm tra thông tin đặt phòng và tình trạng phòng.<br>7. Hệ thống hiển thị tổng chi phí dự kiến.<br>8. Khách hàng chọn hình thức thanh toán: VNPay, chuyển khoản hoặc đặt cọc.<br>9. Nếu chọn VNPay, khách hàng thực hiện thanh toán qua cổng thanh toán.<br>10. Nếu chọn chuyển khoản, hệ thống ghi nhận thông tin chuyển khoản và chờ nhân viên xác nhận.<br>11. Nếu chọn đặt cọc, khách hàng thanh toán khoản cọc theo quy định của khách sạn.<br>12. Hệ thống tạo đơn đặt phòng ở trạng thái **PendingApproval**.<br>13. Hệ thống gửi thông báo đặt phòng thành công và thông báo chờ duyệt cho khách hàng. |
| Luồng sự kiện phụ | A1: Khách hàng hủy thao tác.<br>Trong quá trình nhập biểu mẫu hoặc chọn thanh toán, khách hàng nhấn hủy hoặc rời khỏi trang. Hệ thống không tạo đơn đặt phòng.<br><br>A2: Phòng không còn khả dụng.<br>Trong lúc khách hàng thao tác, phòng đã được người khác đặt hoặc trạng thái phòng thay đổi. Hệ thống thông báo phòng không còn khả dụng và yêu cầu khách hàng chọn phòng khác.<br><br>A3: Thanh toán VNPay thất bại.<br>Cổng thanh toán trả về kết quả thất bại. Hệ thống hiển thị thông báo lỗi và cho phép khách hàng thử lại hoặc chọn phương thức khác.<br><br>A4: Chuyển khoản chưa được xác nhận.<br>Hệ thống ghi nhận đơn đặt phòng ở trạng thái chờ xác nhận thanh toán. Nhân viên cần kiểm tra giao dịch trước khi duyệt.<br><br>A5: Đặt cọc không thành công.<br>Khách hàng không hoàn tất khoản cọc theo quy định. Hệ thống không chuyển đơn sang trạng thái chờ duyệt hoặc giữ trạng thái chờ thanh toán cọc tùy chính sách.<br><br>A6: Thông tin đặt phòng không hợp lệ.<br>Hệ thống yêu cầu khách hàng kiểm tra lại ngày, giờ, số khách hoặc thông tin liên hệ. |

---

### Tên Usecase: Quản lý đặt phòng cá nhân

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng |
| Mô tả | Cho phép khách hàng xem lịch sử đặt phòng, theo dõi trạng thái đặt phòng và hủy đặt phòng nếu thỏa điều kiện. |
| Điều kiện tiên quyết | 1. Khách hàng đã đăng nhập vào hệ thống.<br>2. Khách hàng có ít nhất một đơn đặt phòng trong hệ thống. |
| Điều kiện kết thúc | Thành công: Khách hàng xem được thông tin đặt phòng hoặc trạng thái đặt phòng được cập nhật.<br>Thất bại: Hệ thống không thay đổi trạng thái và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Khách hàng chọn chức năng quản lý đặt phòng cá nhân.<br>2. Hệ thống hiển thị danh sách đơn đặt phòng của khách hàng.<br>3. Khách hàng chọn một đơn đặt phòng để xem chi tiết.<br>4. Hệ thống hiển thị thông tin phòng, thời gian lưu trú, trạng thái đơn và thông tin thanh toán/cọc.<br>5. Khách hàng theo dõi trạng thái đơn: PendingApproval, Confirmed, CheckedIn, Completed, Rejected hoặc Cancelled.<br>6. Nếu có thay đổi trạng thái, hệ thống gửi thông báo tự động cho khách hàng. |
| Luồng sự kiện phụ | A1: Khách hàng chưa có đơn đặt phòng.<br>Hệ thống hiển thị thông báo chưa có lịch sử đặt phòng.<br><br>A2: Khách hàng yêu cầu hủy đặt phòng.<br>Hệ thống kiểm tra điều kiện hủy theo chính sách khách sạn.<br><br>A3: Đơn đủ điều kiện hủy.<br>Hệ thống cập nhật trạng thái đơn thành Cancelled và gửi thông báo cho khách hàng.<br><br>A4: Đơn không đủ điều kiện hủy.<br>Hệ thống thông báo lý do không thể hủy đặt phòng. |

---

### Tên Usecase: Thanh toán

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng, Nhân viên / Lễ tân |
| Mô tả | Cho phép khách hàng thanh toán bằng VNPay, chuyển khoản hoặc đặt cọc; nhân viên có thể kiểm tra và xác nhận thanh toán khi cần. |
| Điều kiện tiên quyết | 1. Đơn đặt phòng đã được tạo hoặc đang trong quá trình đặt phòng.<br>2. Hệ thống đã xác định số tiền cần thanh toán hoặc số tiền cần đặt cọc.<br>3. Hình thức thanh toán được hệ thống hỗ trợ. |
| Điều kiện kết thúc | Thành công: Trạng thái thanh toán hoặc đặt cọc được cập nhật thành đã thanh toán/đã đặt cọc.<br>Thất bại: Trạng thái thanh toán không thay đổi hoặc chuyển sang chờ xử lý. |
| Luồng sự kiện chính | 1. Khách hàng chọn hình thức thanh toán.<br>2. Hệ thống hiển thị số tiền cần thanh toán hoặc số tiền đặt cọc.<br>3. Khách hàng chọn VNPay, chuyển khoản hoặc đặt cọc.<br>4. Nếu chọn VNPay, hệ thống chuyển khách hàng đến cổng thanh toán và nhận kết quả giao dịch.<br>5. Nếu chọn chuyển khoản, hệ thống hiển thị thông tin tài khoản nhận tiền và mã nội dung chuyển khoản.<br>6. Nếu chọn đặt cọc, hệ thống hiển thị số tiền cọc và phương thức thanh toán cọc.<br>7. Hệ thống ghi nhận trạng thái thanh toán.<br>8. Nhân viên xác nhận thanh toán/chuyển khoản/cọc nếu phương thức yêu cầu kiểm tra thủ công.<br>9. Hệ thống cập nhật trạng thái đơn đặt phòng. |
| Luồng sự kiện phụ | A1: Thanh toán VNPay thất bại.<br>Hệ thống thông báo lỗi và cho phép khách hàng thử lại hoặc chọn phương thức khác.<br><br>A2: Khách hàng hủy thanh toán.<br>Hệ thống giữ đơn ở trạng thái chờ thanh toán hoặc không tạo đơn tùy thời điểm hủy.<br><br>A3: Chuyển khoản chưa khớp thông tin.<br>Nhân viên kiểm tra nhưng không tìm thấy giao dịch hợp lệ. Hệ thống giữ trạng thái chờ xác nhận thanh toán.<br><br>A4: Đặt cọc không đủ số tiền quy định.<br>Hệ thống hoặc nhân viên từ chối xác nhận cọc và thông báo cho khách hàng bổ sung. |

---

### Tên Usecase: Đánh giá / phản hồi

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Khách hàng |
| Mô tả | Cho phép khách hàng gửi đánh giá hoặc phản hồi về phòng, dịch vụ và trải nghiệm lưu trú. |
| Điều kiện tiên quyết | 1. Khách hàng đã đăng nhập.<br>2. Khách hàng có đơn đặt phòng đã hoàn thành hoặc đã sử dụng dịch vụ. |
| Điều kiện kết thúc | Thành công: Đánh giá/phản hồi được lưu vào hệ thống.<br>Thất bại: Hệ thống không lưu phản hồi và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Khách hàng chọn chức năng đánh giá/phản hồi.<br>2. Hệ thống hiển thị biểu mẫu đánh giá.<br>3. Khách hàng nhập nội dung phản hồi và mức đánh giá.<br>4. Hệ thống kiểm tra nội dung nhập vào.<br>5. Hệ thống lưu đánh giá/phản hồi.<br>6. Hệ thống thông báo gửi đánh giá thành công. |
| Luồng sự kiện phụ | A1: Nội dung phản hồi trống.<br>Hệ thống yêu cầu khách hàng nhập nội dung phản hồi.<br><br>A2: Khách hàng chưa đủ điều kiện đánh giá.<br>Hệ thống thông báo khách hàng chỉ được đánh giá sau khi sử dụng dịch vụ. |

---

### Tên Usecase: Quản lý đặt phòng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Nhân viên / Lễ tân, Quản trị viên |
| Mô tả | Cho phép nhân viên hoặc quản trị viên xem danh sách đơn chờ duyệt, kiểm tra thông tin thanh toán/cọc và duyệt hoặc từ chối đặt phòng. |
| Điều kiện tiên quyết | 1. Nhân viên hoặc quản trị viên đã đăng nhập vào hệ thống.<br>2. Hệ thống có đơn đặt phòng ở trạng thái PendingApproval hoặc các trạng thái cần xử lý.<br>3. Người dùng có quyền quản lý đặt phòng. |
| Điều kiện kết thúc | Thành công: Đơn đặt phòng được duyệt sang trạng thái Confirmed hoặc bị từ chối sang trạng thái Rejected.<br>Thất bại: Hệ thống không cập nhật trạng thái đơn và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Nhân viên đăng nhập vào hệ thống.<br>2. Nhân viên chọn chức năng quản lý đặt phòng.<br>3. Hệ thống hiển thị danh sách đơn chờ duyệt.<br>4. Nhân viên chọn một đơn đặt phòng để xem chi tiết.<br>5. Hệ thống hiển thị thông tin khách hàng, thông tin phòng, thời gian lưu trú, số khách, yêu cầu đặc biệt và trạng thái thanh toán/cọc.<br>6. Nhân viên kiểm tra sơ đồ phòng hoặc tình trạng phòng liên quan.<br>7. Nhân viên chọn duyệt hoặc từ chối đơn đặt phòng.<br>8. Nếu duyệt, hệ thống cập nhật trạng thái đơn thành Confirmed.<br>9. Nếu từ chối, nhân viên nhập lý do từ chối và hệ thống cập nhật trạng thái đơn thành Rejected.<br>10. Hệ thống gửi thông báo tự động cho khách hàng. |
| Luồng sự kiện phụ | A1: Đơn đặt phòng không tồn tại.<br>Hệ thống thông báo không tìm thấy đơn đặt phòng.<br><br>A2: Thanh toán hoặc đặt cọc chưa hợp lệ.<br>Nhân viên chưa thể duyệt đơn và hệ thống giữ trạng thái PendingApproval hoặc chờ xác nhận thanh toán.<br><br>A3: Phòng không còn khả dụng.<br>Nhân viên từ chối đơn hoặc đề xuất phòng khác cho khách hàng.<br><br>A4: Người dùng không đủ quyền xử lý.<br>Hệ thống từ chối thao tác duyệt hoặc từ chối đơn. |

---

### Tên Usecase: Quản lý check-in / check-out

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Nhân viên / Lễ tân |
| Mô tả | Cho phép nhân viên thực hiện thủ tục nhận phòng và trả phòng cho khách hàng sau khi đơn đặt phòng đã được xác nhận. |
| Điều kiện tiên quyết | 1. Nhân viên đã đăng nhập vào hệ thống.<br>2. Có đơn đặt phòng hợp lệ ở trạng thái Confirmed hoặc CheckedIn.<br>3. Thông tin khách hàng được xác minh. |
| Điều kiện kết thúc | Thành công: Đơn đặt phòng được cập nhật sang CheckedIn khi nhận phòng hoặc Completed khi trả phòng.<br>Thất bại: Hệ thống không cập nhật trạng thái và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Nhân viên đăng nhập vào hệ thống.<br>2. Nhân viên tìm kiếm đơn đặt phòng của khách hàng.<br>3. Hệ thống hiển thị thông tin đơn đặt phòng.<br>4. Nhân viên kiểm tra thông tin khách hàng và trạng thái đơn.<br>5. Khi khách nhận phòng, nhân viên thực hiện check-in.<br>6. Hệ thống cập nhật trạng thái đơn thành CheckedIn và cập nhật trạng thái phòng thành đang sử dụng.<br>7. Khi khách trả phòng, nhân viên kiểm tra dịch vụ phát sinh và tình trạng phòng.<br>8. Nhân viên thực hiện check-out.<br>9. Hệ thống cập nhật trạng thái đơn thành Completed và cập nhật tình trạng phòng phù hợp. |
| Luồng sự kiện phụ | A1: Không tìm thấy đơn đặt phòng.<br>Hệ thống thông báo không có dữ liệu phù hợp.<br><br>A2: Đơn chưa được xác nhận.<br>Hệ thống cảnh báo nhân viên không thể check-in khi đơn chưa ở trạng thái Confirmed.<br><br>A3: Khách hàng có chi phí phát sinh khi check-out.<br>Nhân viên yêu cầu khách hàng thanh toán trước khi hoàn tất check-out.<br><br>A4: Phòng chưa sẵn sàng.<br>Hệ thống cảnh báo phòng đang dọn hoặc bảo trì, nhân viên cần xử lý trước khi check-in. |

---

### Tên Usecase: Quản lý tình trạng phòng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Nhân viên / Lễ tân |
| Mô tả | Cho phép nhân viên xem sơ đồ phòng và cập nhật trạng thái phòng như trống, đã đặt, đang sử dụng, đang dọn hoặc bảo trì. |
| Điều kiện tiên quyết | 1. Nhân viên đã đăng nhập vào hệ thống.<br>2. Nhân viên có quyền xem và cập nhật tình trạng phòng. |
| Điều kiện kết thúc | Thành công: Trạng thái phòng được cập nhật trên sơ đồ phòng.<br>Thất bại: Hệ thống giữ nguyên trạng thái phòng và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Nhân viên chọn chức năng quản lý tình trạng phòng.<br>2. Hệ thống hiển thị sơ đồ phòng theo tầng, loại phòng hoặc trạng thái.<br>3. Nhân viên chọn phòng cần xem hoặc cập nhật.<br>4. Hệ thống hiển thị thông tin trạng thái hiện tại của phòng.<br>5. Nhân viên chọn trạng thái mới cho phòng.<br>6. Hệ thống kiểm tra tính hợp lệ của trạng thái mới.<br>7. Hệ thống cập nhật trạng thái phòng trên sơ đồ phòng. |
| Luồng sự kiện phụ | A1: Trạng thái phòng không hợp lệ.<br>Hệ thống từ chối cập nhật và yêu cầu chọn trạng thái phù hợp.<br><br>A2: Phòng đang có đơn đặt phòng liên quan.<br>Hệ thống cảnh báo nhân viên trước khi cập nhật trạng thái.<br><br>A3: Phòng đang bảo trì.<br>Hệ thống không cho phép gán phòng cho đơn đặt phòng mới. |

---

### Tên Usecase: Quản lý yêu cầu khách hàng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Nhân viên / Lễ tân |
| Mô tả | Cho phép nhân viên tiếp nhận và xử lý các yêu cầu phát sinh của khách hàng trong quá trình đặt phòng hoặc lưu trú. |
| Điều kiện tiên quyết | 1. Nhân viên đã đăng nhập vào hệ thống.<br>2. Có yêu cầu phát sinh từ khách hàng. |
| Điều kiện kết thúc | Thành công: Yêu cầu được ghi nhận và cập nhật trạng thái xử lý.<br>Thất bại: Yêu cầu không được xử lý và hệ thống hiển thị lý do. |
| Luồng sự kiện chính | 1. Nhân viên tiếp nhận yêu cầu từ khách hàng.<br>2. Nhân viên nhập hoặc tìm yêu cầu trên hệ thống.<br>3. Hệ thống hiển thị thông tin khách hàng hoặc đơn đặt phòng liên quan.<br>4. Nhân viên xử lý yêu cầu hoặc chuyển cho bộ phận phù hợp.<br>5. Hệ thống cập nhật trạng thái yêu cầu.<br>6. Nhân viên thông báo kết quả xử lý cho khách hàng. |
| Luồng sự kiện phụ | A1: Yêu cầu không hợp lệ.<br>Nhân viên ghi nhận lý do từ chối xử lý.<br><br>A2: Yêu cầu vượt quyền xử lý.<br>Nhân viên chuyển yêu cầu cho quản trị viên hoặc bộ phận liên quan.<br><br>A3: Không tìm thấy thông tin đặt phòng liên quan.<br>Hệ thống thông báo không có dữ liệu phù hợp. |

---

### Tên Usecase: Quản lý phòng & loại phòng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Quản trị viên |
| Mô tả | Cho phép quản trị viên thêm, sửa, xóa thông tin phòng và quản lý các loại phòng trong khách sạn. |
| Điều kiện tiên quyết | 1. Quản trị viên đã đăng nhập vào hệ thống.<br>2. Quản trị viên có quyền quản lý phòng và loại phòng. |
| Điều kiện kết thúc | Thành công: Dữ liệu phòng hoặc loại phòng được thêm mới, cập nhật hoặc xóa hợp lệ.<br>Thất bại: Hệ thống không lưu thay đổi và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Quản trị viên chọn chức năng quản lý phòng và loại phòng.<br>2. Hệ thống hiển thị danh sách phòng và loại phòng.<br>3. Quản trị viên chọn thêm mới, chỉnh sửa hoặc xóa.<br>4. Quản trị viên nhập thông tin phòng hoặc loại phòng.<br>5. Hệ thống kiểm tra dữ liệu nhập vào.<br>6. Hệ thống lưu thay đổi.<br>7. Hệ thống thông báo kết quả xử lý. |
| Luồng sự kiện phụ | A1: Thông tin phòng không hợp lệ.<br>Hệ thống yêu cầu quản trị viên nhập lại.<br><br>A2: Phòng đang có lịch đặt.<br>Hệ thống không cho phép xóa phòng và thông báo lý do.<br><br>A3: Loại phòng đang được sử dụng.<br>Hệ thống không cho phép xóa loại phòng đang gắn với phòng hiện có. |

---

### Tên Usecase: Quản lý giá & khuyến mãi

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Quản trị viên |
| Mô tả | Cho phép quản trị viên thiết lập giá phòng, cập nhật giá theo thời điểm và quản lý chương trình khuyến mãi. |
| Điều kiện tiên quyết | 1. Quản trị viên đã đăng nhập vào hệ thống.<br>2. Hệ thống có dữ liệu phòng hoặc loại phòng cần thiết lập giá. |
| Điều kiện kết thúc | Thành công: Giá phòng hoặc chương trình khuyến mãi được cập nhật.<br>Thất bại: Hệ thống không lưu thay đổi và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Quản trị viên chọn chức năng quản lý giá và khuyến mãi.<br>2. Hệ thống hiển thị danh sách giá phòng và chương trình khuyến mãi.<br>3. Quản trị viên chọn thêm mới hoặc cập nhật.<br>4. Quản trị viên nhập giá, thời gian áp dụng, điều kiện áp dụng hoặc mã khuyến mãi.<br>5. Hệ thống kiểm tra dữ liệu.<br>6. Hệ thống lưu thông tin.<br>7. Hệ thống thông báo kết quả xử lý. |
| Luồng sự kiện phụ | A1: Thời gian áp dụng không hợp lệ.<br>Hệ thống yêu cầu nhập lại thời gian.<br><br>A2: Mã khuyến mãi bị trùng.<br>Hệ thống yêu cầu sử dụng mã khác.<br><br>A3: Giá phòng không hợp lệ.<br>Hệ thống từ chối lưu nếu giá nhỏ hơn hoặc bằng 0. |

---

### Tên Usecase: Quản lý tài khoản người dùng

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Quản trị viên |
| Mô tả | Cho phép quản trị viên quản lý tài khoản khách hàng, nhân viên và phân quyền sử dụng hệ thống. |
| Điều kiện tiên quyết | 1. Quản trị viên đã đăng nhập vào hệ thống.<br>2. Quản trị viên có quyền quản lý tài khoản người dùng. |
| Điều kiện kết thúc | Thành công: Tài khoản được tạo, cập nhật, khóa, mở khóa hoặc phân quyền thành công.<br>Thất bại: Hệ thống không lưu thay đổi và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Quản trị viên chọn chức năng quản lý tài khoản người dùng.<br>2. Hệ thống hiển thị danh sách tài khoản.<br>3. Quản trị viên tìm kiếm hoặc chọn tài khoản cần xử lý.<br>4. Quản trị viên cập nhật thông tin, trạng thái hoặc quyền của tài khoản.<br>5. Hệ thống kiểm tra tính hợp lệ của thao tác.<br>6. Hệ thống lưu thay đổi.<br>7. Hệ thống thông báo kết quả xử lý. |
| Luồng sự kiện phụ | A1: Tài khoản không tồn tại.<br>Hệ thống thông báo không tìm thấy tài khoản.<br><br>A2: Quản trị viên không đủ quyền thay đổi tài khoản.<br>Hệ thống từ chối thao tác.<br><br>A3: Thông tin tài khoản không hợp lệ.<br>Hệ thống yêu cầu nhập lại dữ liệu. |

---

### Tên Usecase: Quản lý dịch vụ khách sạn

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Quản trị viên |
| Mô tả | Cho phép quản trị viên quản lý các dịch vụ đi kèm của khách sạn như ăn sáng, giặt ủi, đưa đón, spa hoặc dịch vụ khác. |
| Điều kiện tiên quyết | 1. Quản trị viên đã đăng nhập vào hệ thống.<br>2. Quản trị viên có quyền quản lý dịch vụ khách sạn. |
| Điều kiện kết thúc | Thành công: Thông tin dịch vụ được thêm mới, cập nhật hoặc xóa hợp lệ.<br>Thất bại: Hệ thống không lưu thay đổi và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Quản trị viên chọn chức năng quản lý dịch vụ khách sạn.<br>2. Hệ thống hiển thị danh sách dịch vụ.<br>3. Quản trị viên chọn thêm mới, chỉnh sửa hoặc xóa dịch vụ.<br>4. Quản trị viên nhập thông tin dịch vụ và giá dịch vụ.<br>5. Hệ thống kiểm tra dữ liệu.<br>6. Hệ thống lưu thông tin dịch vụ.<br>7. Hệ thống thông báo kết quả xử lý. |
| Luồng sự kiện phụ | A1: Dịch vụ đang được sử dụng.<br>Hệ thống không cho phép xóa trực tiếp dịch vụ đã phát sinh trong đơn đặt phòng.<br><br>A2: Thông tin dịch vụ không hợp lệ.<br>Hệ thống yêu cầu nhập lại.<br><br>A3: Giá dịch vụ không hợp lệ.<br>Hệ thống từ chối lưu nếu giá nhỏ hơn 0. |

---

### Tên Usecase: Thống kê / báo cáo

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Quản trị viên |
| Mô tả | Cho phép quản trị viên xem báo cáo doanh thu, số lượng đặt phòng, tỷ lệ sử dụng phòng và tình hình hoạt động của khách sạn. |
| Điều kiện tiên quyết | 1. Quản trị viên đã đăng nhập vào hệ thống.<br>2. Hệ thống có dữ liệu đặt phòng, thanh toán và tình trạng phòng. |
| Điều kiện kết thúc | Thành công: Báo cáo được hiển thị hoặc xuất ra theo yêu cầu.<br>Thất bại: Hệ thống không thể tổng hợp dữ liệu và hiển thị thông báo lỗi. |
| Luồng sự kiện chính | 1. Quản trị viên chọn chức năng thống kê/báo cáo.<br>2. Hệ thống hiển thị danh sách loại báo cáo.<br>3. Quản trị viên chọn loại báo cáo và khoảng thời gian.<br>4. Hệ thống tổng hợp dữ liệu.<br>5. Hệ thống hiển thị kết quả báo cáo.<br>6. Quản trị viên có thể xem chi tiết hoặc xuất báo cáo. |
| Luồng sự kiện phụ | A1: Không có dữ liệu trong khoảng thời gian được chọn.<br>Hệ thống thông báo không có dữ liệu phù hợp.<br><br>A2: Lỗi tổng hợp dữ liệu.<br>Hệ thống thông báo lỗi và yêu cầu thử lại.<br><br>A3: Khoảng thời gian không hợp lệ.<br>Hệ thống yêu cầu quản trị viên chọn lại thời gian. |

---

### Tên Usecase: Gửi thông báo tự động

| Mục | Nội dung chi tiết |
|---|---|
| Tác nhân chính | Hệ thống |
| Mô tả | Hệ thống tự động gửi thông báo cho khách hàng hoặc nhân viên khi có thay đổi liên quan đến đặt phòng, thanh toán, duyệt đơn, check-in hoặc check-out. |
| Điều kiện tiên quyết | 1. Có sự kiện phát sinh cần gửi thông báo.<br>2. Hệ thống có thông tin người nhận như email hoặc số điện thoại.<br>3. Dịch vụ gửi thông báo đang hoạt động. |
| Điều kiện kết thúc | Thành công: Thông báo được gửi đến đúng người nhận.<br>Thất bại: Hệ thống ghi nhận lỗi gửi thông báo. |
| Luồng sự kiện chính | 1. Hệ thống phát hiện sự kiện cần gửi thông báo.<br>2. Hệ thống xác định người nhận thông báo.<br>3. Hệ thống tạo nội dung thông báo.<br>4. Hệ thống gửi thông báo qua kênh phù hợp như email, SMS hoặc thông báo trên hệ thống.<br>5. Hệ thống ghi nhận trạng thái gửi thông báo. |
| Luồng sự kiện phụ | A1: Không tìm thấy thông tin người nhận.<br>Hệ thống không gửi thông báo và ghi nhận lỗi.<br><br>A2: Gửi thông báo thất bại.<br>Hệ thống ghi nhận lỗi và có thể thử gửi lại.<br><br>A3: Nội dung thông báo không hợp lệ.<br>Hệ thống dừng gửi và ghi nhận trạng thái lỗi. |

---


