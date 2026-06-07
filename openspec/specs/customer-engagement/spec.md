# Đặc Tả Tương Tác Khách Hàng

## Purpose

Định nghĩa wishlist, review, public review, chat hỗ trợ khách hàng và session id phía frontend.
## Requirements
### Requirement: Wishlist Cho User Và Session Ẩn Danh

Hệ thống PHẢI (SHALL) hỗ trợ lưu loại phòng yêu thích cho cả user đã đăng nhập và session browser ẩn danh.

#### Scenario: User đăng nhập lưu loại phòng

- **CHO** user đã đăng nhập
- **VÀ** loại phòng tồn tại
- **KHI** post `/wishlist` với `roomTypeId`
- **THÌ** hệ thống PHẢI upsert wishlist theo `(userId, roomTypeId)`
- **VÀ** không tạo duplicate.

#### Scenario: Session ẩn danh lưu loại phòng

- **CHO** chưa đăng nhập
- **VÀ** có header `x-session-id`
- **VÀ** loại phòng tồn tại
- **KHI** post `/wishlist` với `roomTypeId`
- **THÌ** hệ thống PHẢI upsert wishlist theo `(sessionId, roomTypeId)`.

#### Scenario: Lưu wishlist thiếu user và session

- **CHO** không có user đăng nhập và không có `x-session-id`
- **KHI** lưu wishlist
- **THÌ** API PHẢI từ chối với `Thiếu userId hoặc sessionId`.

#### Scenario: Lưu loại phòng không tồn tại

- **CHO** room type id không tồn tại
- **KHI** lưu wishlist
- **THÌ** API PHẢI từ chối với `Loại phòng không tồn tại`.

#### Scenario: User xóa loại phòng đã lưu

- **CHO** user đã đăng nhập
- **KHI** delete `/wishlist/:roomTypeId`
- **THÌ** mọi wishlist row khớp user và room type PHẢI bị xóa
- **VÀ** API trả `Đã xóa`.

#### Scenario: Session xóa loại phòng đã lưu

- **CHO** chưa đăng nhập
- **VÀ** có `x-session-id`
- **KHI** delete `/wishlist/:roomTypeId`
- **THÌ** mọi wishlist row khớp session và room type PHẢI bị xóa
- **VÀ** API trả `Đã xóa`.

### Requirement: Liệt Kê Wishlist

Hệ thống PHẢI (SHALL) trả card loại phòng đã lưu cho user hoặc session hiện tại.

#### Scenario: Liệt kê wishlist của user

- **CHO** user đã đăng nhập
- **KHI** gọi `/wishlist`
- **THÌ** wishlist rows của user PHẢI được trả về, mới nhất trước.

#### Scenario: Liệt kê wishlist của session

- **CHO** chưa đăng nhập
- **VÀ** có `x-session-id`
- **KHI** gọi `/wishlist`
- **THÌ** wishlist rows của session PHẢI được trả về, mới nhất trước.

#### Scenario: Shape item wishlist

- **CHO** có loại phòng đã lưu
- **KHI** liệt kê wishlist
- **THÌ** mỗi item PHẢI gồm wishlist id, room type id, tên loại phòng, ảnh, sao, sức chứa, loại giường, tiện nghi, giá từ pricing rule active đầu tiên và chi nhánh của phòng đầu tiên.

### Requirement: Đồng Bộ Wishlist Sau Login

Hệ thống PHẢI (SHALL) merge wishlist ẩn danh của session vào wishlist của user sau khi đăng nhập.

#### Scenario: Sync wishlist session

- **CHO** user đã đăng nhập
- **VÀ** browser có `hotel_session_id`
- **KHI** post `/wishlist/sync` với session id
- **THÌ** từng wishlist item của session PHẢI được upsert vào wishlist của user
- **VÀ** mọi row của session id đó PHẢI bị xóa
- **VÀ** API trả `Đã đồng bộ`.

#### Scenario: Trùng item khi sync

- **CHO** user và session đều đã lưu cùng một room type
- **KHI** sync wishlist
- **THÌ** chỉ còn một wishlist row của user nhờ upsert.

### Requirement: Tạo Review

Hệ thống PHẢI (SHALL) cho customer review loại phòng chỉ thông qua booking của chính họ đã checkout và chỉ một lần cho mỗi booking.

#### Scenario: Tạo review hợp lệ

- **CHO** customer đã đăng nhập sở hữu booking
- **VÀ** booking status `CHECKED_OUT`
- **VÀ** booking chưa có review
- **KHI** post `/reviews` với booking id, rating, comment tùy chọn và images tùy chọn
- **THÌ** hệ thống PHẢI tạo review
- **VÀ** set `roomTypeId` từ room của booking
- **VÀ** default images thành mảng rỗng
- **VÀ** include booking trong response.

#### Scenario: Booking review không tồn tại

- **CHO** booking id không tồn tại
- **KHI** tạo review
- **THÌ** API PHẢI từ chối với `Đơn đặt phòng không tồn tại`.

#### Scenario: Review booking của người khác

- **CHO** user không sở hữu booking
- **KHI** tạo review
- **THÌ** API PHẢI từ chối với `Không có quyền đánh giá đơn này`.

#### Scenario: Review trước checkout

- **CHO** booking không ở `CHECKED_OUT`
- **KHI** tạo review
- **THÌ** API PHẢI từ chối với `Chỉ có thể đánh giá sau khi trả phòng`.

#### Scenario: Review trùng booking

- **CHO** booking đã có review
- **KHI** post review khác cho cùng booking
- **THÌ** API PHẢI từ chối với `Đơn này đã được đánh giá`.

#### Scenario: Rating ngoài giới hạn

- **CHO** rating nhỏ hơn 1 hoặc lớn hơn 5
- **KHI** validation DTO chạy
- **THÌ** API PHẢI từ chối request.

### Requirement: Kiểm Tra Quyền Review

Hệ thống PHẢI (SHALL) cho customer kiểm tra họ có thể review một loại phòng hay không.

#### Scenario: Có thể review loại phòng

- **CHO** customer đã đăng nhập có booking `CHECKED_OUT` cho phòng thuộc loại phòng đó
- **VÀ** booking chưa có review
- **KHI** gọi `/reviews/can-review/:roomTypeId`
- **THÌ** API PHẢI trả `{ canReview: true, bookingId: <id> }`.

#### Scenario: Không thể review loại phòng

- **CHO** không có booking checked-out chưa review phù hợp
- **KHI** kiểm tra quyền review
- **THÌ** API PHẢI trả `{ canReview: false, bookingId: null }`.

### Requirement: Hiển Thị Review Public

Hệ thống PHẢI (SHALL) public review approved của loại phòng.

#### Scenario: Liệt kê review theo loại phòng

- **CHO** có review approved cho room type
- **KHI** gọi `/reviews/room-type/:roomTypeId?page=1&limit=10`
- **THÌ** API PHẢI trả review approved, mới nhất trước
- **VÀ** include họ/tên customer
- **VÀ** trả `items`, `total`, `page`, `limit`, `avgRating`.

#### Scenario: Không có review approved

- **CHO** room type không có review approved
- **KHI** liệt kê review
- **THÌ** `avgRating` PHẢI bằng 0.

### Requirement: Chat Hỗ Trợ Khách Hàng

Hệ thống PHẢI (SHALL) cho customer đã đăng nhập mở hoặc dùng lại conversation hỗ trợ và gửi message.

#### Scenario: Lấy conversation open hiện có

- **CHO** customer đã đăng nhập đã có conversation open
- **KHI** gọi `/chat/conversation`
- **THÌ** conversation open hiện có PHẢI được trả về kèm messages theo thời gian tăng dần.

#### Scenario: Tạo conversation mới

- **CHO** customer đã đăng nhập chưa có conversation open
- **KHI** gọi `/chat/conversation` với subject tùy chọn
- **THÌ** hệ thống PHẢI tạo conversation status `open`
- **VÀ** trả conversation kèm messages.

#### Scenario: Gửi message

- **CHO** user đã đăng nhập
- **VÀ** conversation tồn tại
- **KHI** post `/chat/conversation/:id/messages` với content
- **THÌ** hệ thống PHẢI tạo message có conversation id, sender id, content, `isRead=false` và createdAt
- **VÀ** include conversation trong response.

#### Scenario: Gửi message vào conversation không tồn tại

- **CHO** conversation id không tồn tại
- **KHI** post message
- **THÌ** API PHẢI từ chối với `Conversation not found`.

### Requirement: Session Id Frontend

Web app PHẢI (SHALL) tạo session id ổn định cho các hành vi ẩn danh như wishlist.

#### Scenario: Khởi tạo session id

- **CHO** web app chạy trong browser
- **VÀ** local storage chưa có `hotel_session_id`
- **KHI** API client khởi tạo
- **THÌ** client PHẢI lưu session id gồm timestamp hiện tại và random suffix.

#### Scenario: Gửi header session id

- **CHO** local storage có `hotel_session_id`
- **KHI** web API client gửi request
- **THÌ** client PHẢI thêm header `x-session-id` với giá trị đó.

### Requirement: Thanh Thông Báo Booking Cho User

Web app PHẢI (SHALL) hiển thị thanh thông báo cho user đã đăng nhập khi booking cần hành động hoặc vừa đổi trạng thái quan trọng.

#### Scenario: Hiển thị yêu cầu thanh toán sau khi duyệt

- **CHO** customer có booking vừa được duyệt sang `PENDING_PAYMENT`
- **KHI** web app nhận notification `booking.request.approved`
- **THÌ** thanh thông báo PHẢI hiển thị nội dung đã được duyệt
- **VÀ** có hành động điều hướng tới bước thanh toán của booking đó
- **VÀ** hiển thị deadline thanh toán.

#### Scenario: Hiển thị từ chối yêu cầu đặt chỗ

- **CHO** customer có booking bị `REJECTED` do staff từ chối yêu cầu đặt chỗ
- **KHI** web app nhận notification `booking.request.rejected`
- **THÌ** thanh thông báo PHẢI hiển thị lý do nếu có
- **VÀ** không hiển thị hành động thanh toán.

#### Scenario: Hiển thị hết hạn yêu cầu hoặc thanh toán

- **CHO** customer có booking chuyển `EXPIRED`
- **KHI** web app nhận notification hết hạn
- **THÌ** thanh thông báo PHẢI nêu rõ đơn hết hạn do quá hạn duyệt hoặc quá hạn thanh toán.

### Requirement: Chat Theo Booking Đang Chờ Duyệt

Hệ thống PHẢI (SHALL) cho customer và admin/receptionist trao đổi realtime trong conversation gắn với booking khi booking đang chờ duyệt yêu cầu đặt chỗ.

#### Scenario: Customer mở chat của booking chờ duyệt

- **CHO** customer sở hữu booking ở `PENDING_HOST_APPROVAL`
- **KHI** customer mở chat từ chi tiết booking
- **THÌ** hệ thống PHẢI tạo hoặc trả conversation có `bookingId` của booking đó
- **VÀ** chỉ trả messages thuộc conversation đó.

#### Scenario: Staff mở chat từ queue duyệt

- **CHO** receptionist hoặc admin đang xem booking ở `PENDING_HOST_APPROVAL`
- **KHI** staff mở chat của booking
- **THÌ** hệ thống PHẢI trả conversation gắn với booking và customer tương ứng
- **VÀ** cho phép staff gửi message trong conversation đó.

#### Scenario: Customer nhận phản hồi realtime từ admin

- **CHO** customer đang mở chi tiết booking `PENDING_HOST_APPROVAL`
- **VÀ** customer đã mở conversation của booking đó
- **KHI** admin hoặc receptionist gửi message mới trong conversation
- **THÌ** web app PHẢI hiển thị message mới trong khung chat mà không cần reload trang
- **VÀ** không được yêu cầu customer tự gửi message hoặc refetch thủ công trước khi thấy phản hồi.

#### Scenario: Customer gửi tin và staff nhận realtime

- **CHO** customer đang mở conversation của booking `PENDING_HOST_APPROVAL`
- **KHI** customer gửi message hợp lệ
- **THÌ** message PHẢI được lưu
- **VÀ** staff/admin đang mở conversation hoặc queue liên quan PHẢI nhận event realtime cho message đó.

#### Scenario: Không mở chat booking của người khác

- **CHO** customer không sở hữu booking
- **KHI** customer yêu cầu conversation theo booking đó
- **THÌ** API PHẢI từ chối bằng quyền truy cập.

#### Scenario: Customer fallback khi realtime lỗi

- **CHO** customer đang mở chat booking chờ duyệt
- **VÀ** realtime stream bị lỗi hoặc bị ngắt
- **KHI** có khả năng message mới phát sinh
- **THÌ** web app PHẢI fallback sang refetch hoặc polling conversation hiện có
- **VÀ** khi stream kết nối lại, khung chat PHẢI đồng bộ lại messages theo `message.id`.

### Requirement: Dialog Cảnh Báo Đặt Phòng Quan Trọng

Web app PHẢI (SHALL) hiển thị lỗi đặt phòng quan trọng bằng dialog/modal lớn ở giữa màn hình thay vì chỉ dùng toast nhỏ.

#### Scenario: Dialog khi range ngày bị thuê

- **CHO** user chọn hoặc submit một khoảng ngày bị booking active khác overlap
- **KHI** frontend nhận lỗi availability hoặc lỗi tạo booking `Phòng đã được đặt trong khoảng thời gian này`
- **THÌ** UI PHẢI mở dialog lớn giữa màn hình
- **VÀ** dialog PHẢI có tiêu đề rõ rằng phòng không còn trống trong khoảng ngày đã chọn
- **VÀ** dialog PHẢI hiển thị khoảng ngày user đã chọn
- **VÀ** dialog PHẢI có hành động chọn lại ngày.

#### Scenario: Dialog khi ngày không hợp lệ

- **CHO** user chọn check-out bằng hoặc trước check-in
- **KHI** frontend validate hoặc API trả lỗi ngày
- **THÌ** UI PHẢI mở dialog lớn giữa màn hình
- **VÀ** giải thích rằng ngày trả phòng phải sau ngày nhận phòng.

#### Scenario: Dialog không thay thế thông báo nhỏ thông thường

- **CHO** thao tác không quan trọng như lưu wishlist, copy thông tin hoặc refresh danh sách
- **KHI** thao tác thành công hoặc lỗi nhẹ
- **THÌ** UI CÓ THỂ tiếp tục dùng toast nhỏ
- **VÀ** chỉ các lỗi ảnh hưởng quyết định đặt phòng mới bắt buộc dùng dialog lớn.

#### Scenario: Dialog hỗ trợ điều hướng

- **CHO** dialog cảnh báo range bị thuê đang mở
- **KHI** user chọn hành động tìm phòng khác
- **THÌ** UI PHẢI điều hướng về trang tìm phòng với ngày/khách hiện tại
- **VÀ** không được tự động gửi lại booking cũ.
