# Đặc Tả Phòng, Tìm Kiếm Và Giá

## Purpose

Định nghĩa quản lý loại phòng, phòng vật lý, chi nhánh, trạng thái phòng, quy tắc giá, tìm kiếm phòng trống, phòng nổi bật, flash sale public và chi tiết loại phòng public.
## Requirements
### Requirement: Quản Lý Loại Phòng

Hệ thống PHẢI (SHALL) cho phép admin tạo, cập nhật, vô hiệu hóa mềm và liệt kê loại phòng; receptionist được đọc loại phòng.

#### Scenario: Tạo loại phòng

- **CHO** admin đã đăng nhập
- **KHI** post `/rooms/types` với tên, sức chứa, diện tích, loại giường và tùy chọn mô tả/tiện nghi/ảnh
- **THÌ** hệ thống PHẢI tạo loại phòng ở trạng thái active mặc định.

#### Scenario: Cập nhật loại phòng

- **CHO** admin đã đăng nhập
- **VÀ** loại phòng tồn tại
- **KHI** patch `/rooms/types/:id`
- **THÌ** hệ thống PHẢI cập nhật các field đã gửi, bao gồm `isActive` nếu có.

#### Scenario: Loại phòng không tồn tại

- **CHO** id loại phòng không tồn tại
- **KHI** xem chi tiết, cập nhật hoặc xóa
- **THÌ** API PHẢI từ chối với `Loại phòng không tồn tại`.

#### Scenario: Liệt kê loại phòng active mặc định

- **CHO** admin hoặc receptionist
- **KHI** gọi `/rooms/types` không có `includeInactive=true`
- **THÌ** API PHẢI trả chỉ loại phòng active
- **VÀ** include pricing rule active sắp xếp priority giảm dần
- **VÀ** include số lượng phòng.

#### Scenario: Liệt kê gồm inactive

- **CHO** admin hoặc receptionist
- **KHI** gọi `/rooms/types?includeInactive=true`
- **THÌ** API PHẢI trả cả loại phòng active và inactive.

#### Scenario: Vô hiệu hóa loại phòng không có booking active

- **CHO** admin đã đăng nhập
- **VÀ** loại phòng không có booking ở `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, `CHECKED_IN`
- **KHI** delete `/rooms/types/:id`
- **THÌ** hệ thống PHẢI set `isActive=false`
- **VÀ** trả `Đã vô hiệu hóa loại phòng`.

#### Scenario: Chặn xóa loại phòng có booking active

- **CHO** loại phòng có ít nhất một booking ở `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, `CHECKED_IN`
- **KHI** admin xóa loại phòng
- **THÌ** API PHẢI từ chối với `Không thể xóa loại phòng đang có đơn đặt phòng hoạt động`.

### Requirement: Quản Lý Phòng Vật Lý

Hệ thống PHẢI (SHALL) cho phép admin tạo/xóa phòng; admin, receptionist và housekeeping được liệt kê hoặc cập nhật trạng thái/ghi chú phòng.

#### Scenario: Tạo phòng

- **CHO** admin đã đăng nhập
- **VÀ** chưa có phòng với `roomNumber` đã gửi
- **VÀ** loại phòng tồn tại
- **KHI** post `/rooms` với số phòng, tầng, loại phòng, chi nhánh và ghi chú tùy chọn
- **THÌ** hệ thống PHẢI tạo phòng
- **VÀ** trả phòng kèm loại phòng và chi nhánh.

#### Scenario: Trùng số phòng

- **CHO** đã tồn tại phòng với room number đã gửi
- **KHI** admin tạo phòng
- **THÌ** API PHẢI từ chối với `Số phòng đã tồn tại`.

#### Scenario: Liệt kê phòng

- **CHO** admin, receptionist hoặc housekeeping
- **KHI** gọi `/rooms` với tùy chọn `roomTypeId` hoặc `floor`
- **THÌ** API PHẢI trả phòng phù hợp, include loại phòng và chi nhánh
- **VÀ** sắp xếp theo tầng tăng dần rồi số phòng tăng dần.

#### Scenario: Cập nhật trạng thái hoặc ghi chú phòng

- **CHO** admin, receptionist hoặc housekeeping
- **VÀ** phòng tồn tại
- **KHI** patch `/rooms/:id` với `status` hoặc `notes`
- **THÌ** hệ thống PHẢI cập nhật field đã gửi và trả phòng kèm loại phòng/chi nhánh.

#### Scenario: Xóa phòng không có khách/đặt giữ

- **CHO** admin đã đăng nhập
- **VÀ** phòng không có booking `CONFIRMED` hoặc `CHECKED_IN`
- **KHI** delete `/rooms/:id`
- **THÌ** hệ thống PHẢI xóa vật lý phòng
- **VÀ** trả `Đã xóa phòng`.

#### Scenario: Chặn xóa phòng đang có khách hoặc đã xác nhận

- **CHO** phòng có booking `CONFIRMED` hoặc `CHECKED_IN`
- **KHI** admin xóa phòng
- **THÌ** API PHẢI từ chối với `Phòng đang có khách, không thể xóa`.

### Requirement: Liệt Kê Chi Nhánh

Hệ thống PHẢI (SHALL) cho admin và receptionist xem danh sách chi nhánh active.

#### Scenario: Danh sách chi nhánh

- **CHO** admin hoặc receptionist
- **KHI** gọi `/rooms/branches`
- **THÌ** API PHẢI trả các chi nhánh active, sắp xếp theo tỉnh/thành tăng dần.

### Requirement: Quy Tắc Giá

Hệ thống PHẢI (SHALL) tính giá loại phòng bằng pricing rule active khớp ngày và có priority cao nhất.

#### Scenario: Tạo quy tắc giá

- **CHO** admin đã đăng nhập
- **VÀ** loại phòng tồn tại
- **KHI** post `/rooms/pricing` với loại phòng, pricing type, giá, ngày bắt đầu/kết thúc tùy chọn và priority tùy chọn
- **THÌ** hệ thống PHẢI tạo pricing rule active
- **VÀ** lưu ngày thiếu là null
- **VÀ** default priority thiếu thành 0.

#### Scenario: Vô hiệu hóa quy tắc giá

- **CHO** admin đã đăng nhập
- **VÀ** pricing rule tồn tại
- **KHI** delete `/rooms/pricing/:id`
- **THÌ** hệ thống PHẢI set `isActive=false`
- **VÀ** trả `Đã vô hiệu hóa quy tắc giá`.

#### Scenario: Chọn giá cho một ngày

- **CHO** loại phòng có rule active mà ngày phù hợp hoặc rule default có start/end null
- **KHI** pricing service lấy giá cho ngày đó
- **THÌ** rule có priority cao nhất PHẢI được chọn
- **VÀ** trả `pricePerNight` dạng number.

#### Scenario: Không có quy tắc giá

- **CHO** không có pricing rule active phù hợp
- **KHI** tính giá
- **THÌ** pricing service PHẢI throw lỗi không tìm thấy quy tắc giá cho ngày đó.

#### Scenario: Tổng tiền nhiều đêm

- **CHO** ngày check-in và check-out
- **KHI** tính tổng tiền
- **THÌ** hệ thống PHẢI tính tối thiểu 1 đêm
- **VÀ** cộng giá từng đêm từ check-in đến trước check-out.

### Requirement: Tìm Kiếm Phòng Public

Hệ thống PHẢI (SHALL) cho user ẩn danh tìm phòng vật lý còn trống theo ngày, số khách, tỉnh/thành, loại phòng, khoảng giá, tiện nghi, sao, sort và phân trang; kết quả search PHẢI dùng cùng rule availability với calendar và tạo booking.

#### Scenario: Thiếu tham số bắt buộc

- **CHO** thiếu `checkIn`, `checkOut` hoặc `guests`
- **KHI** gọi `/search`
- **THÌ** API PHẢI từ chối với `checkIn, checkOut và guests là bắt buộc`.

#### Scenario: Ngày không hợp lệ

- **CHO** một trong hai ngày không parse được
- **KHI** gọi `/search`
- **THÌ** API PHẢI từ chối với `Ngày không hợp lệ`.

#### Scenario: Check-in trong quá khứ

- **CHO** ngày check-in trước ngày hiện tại tại mốc 00:00
- **KHI** gọi `/search`
- **THÌ** API PHẢI từ chối với `Ngày nhận phòng không thể trong quá khứ`.

#### Scenario: Check-out không sau check-in

- **CHO** check-out bằng hoặc trước check-in
- **KHI** gọi `/search`
- **THÌ** API PHẢI từ chối với `Ngày trả phòng phải sau ngày nhận phòng`.

#### Scenario: Loại trừ booking trùng lịch

- **CHO** phòng có booking active-hold ở `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PAYING`, `PENDING_APPROVAL`, `CONFIRMED` hoặc `CHECKED_IN`
- **VÀ** booking đó overlap khoảng ngày yêu cầu theo điều kiện `checkIn < requestedCheckOut` và `checkOut > requestedCheckIn`
- **KHI** search chạy
- **THÌ** phòng đó PHẢI bị loại khỏi kết quả.

#### Scenario: Pending quá hạn không chặn search

- **CHO** phòng có booking `PENDING_HOST_APPROVAL` đã quá `approvalDeadline`
- **HOẶC** booking `PENDING_PAYMENT` hoặc `PAYING` đã quá `paymentDeadline`
- **KHI** search chạy cho range overlap booking đó
- **THÌ** booking quá hạn đó KHÔNG được loại phòng khỏi kết quả.

#### Scenario: Trạng thái phòng được search

- **CHO** phòng không có booking conflict
- **VÀ** status là `AVAILABLE` hoặc `DIRTY`
- **KHI** search chạy
- **THÌ** phòng CÓ THỂ xuất hiện nếu các filter khác đạt.

#### Scenario: Trạng thái phòng bị loại khỏi search

- **CHO** phòng có status `OCCUPIED`, `CLEANING`, `MAINTENANCE` hoặc `RESERVED`
- **KHI** search chạy
- **THÌ** phòng PHẢI bị loại khỏi kết quả public.

#### Scenario: Lọc sức chứa

- **CHO** loại phòng có `maxGuests` nhỏ hơn số khách yêu cầu
- **KHI** search chạy
- **THÌ** các phòng thuộc loại đó PHẢI bị loại.

#### Scenario: Lọc tỉnh/thành

- **CHO** có filter province
- **KHI** search chạy
- **THÌ** chỉ phòng thuộc chi nhánh có province bằng filter, không phân biệt hoa thường, được xét.

#### Scenario: Lọc tiện nghi

- **CHO** query amenities như `WiFi,TV`
- **KHI** search chạy
- **THÌ** amenities của loại phòng PHẢI chứa tất cả token yêu cầu theo substring không phân biệt hoa thường.

#### Scenario: Lọc số sao

- **CHO** gửi `starRating`
- **KHI** search chạy
- **THÌ** chỉ loại phòng có `starRating` bằng giá trị đó được trả về.

#### Scenario: Lọc khoảng giá

- **CHO** gửi `minPrice` hoặc `maxPrice`
- **KHI** search tính `pricePerNight`
- **THÌ** kết quả nằm ngoài khoảng giá mỗi đêm PHẢI bị loại.

#### Scenario: Không tính được giá cho loại phòng

- **CHO** loại phòng không có pricing rule active phù hợp
- **KHI** search cố tính giá
- **THÌ** kết quả thuộc loại phòng đó PHẢI bị bỏ qua.

#### Scenario: Shape kết quả search

- **CHO** phòng đạt mọi filter
- **KHI** search trả kết quả
- **THÌ** item PHẢI gồm room id/số phòng/tầng, room type summary, branch summary, `pricePerNight`, `totalPrice`, `nights`.

#### Scenario: Sort giá tăng dần

- **CHO** `sortBy=price_asc`
- **KHI** sort kết quả
- **THÌ** phòng có `pricePerNight` thấp hơn PHẢI đứng trước.

#### Scenario: Sort giá giảm dần

- **CHO** `sortBy=price_desc`
- **KHI** sort kết quả
- **THÌ** phòng có `pricePerNight` cao hơn PHẢI đứng trước.

#### Scenario: Sort sao giảm dần

- **CHO** `sortBy=rating_desc`
- **KHI** sort kết quả
- **THÌ** loại phòng có star rating cao hơn PHẢI đứng trước.

#### Scenario: Phân trang search

- **CHO** số kết quả lớn hơn page size
- **KHI** search trả response
- **THÌ** response PHẢI gồm `data`, `total`, `page`, `limit`
- **VÀ** data được cắt theo `(page - 1) * limit` đến `page * limit`.

#### Scenario: Cache search 60 giây

- **CHO** cùng bộ tham số search được gọi lại trong 60 giây
- **KHI** Redis có key `search:<params>`
- **THÌ** API PHẢI trả JSON response từ cache
- **VÀ** cache key PHẢI thay đổi khi các tham số ngày, khách hoặc loại phòng thay đổi.

### Requirement: Danh Sách Tỉnh/Thành

Hệ thống PHẢI (SHALL) public danh sách tỉnh/thành có chi nhánh active.

#### Scenario: Lấy danh sách tỉnh/thành

- **CHO** có chi nhánh active
- **KHI** gọi `/search/provinces`
- **THÌ** API PHẢI trả province distinct, sắp xếp tăng dần.

### Requirement: Phòng Nổi Bật

Hệ thống PHẢI (SHALL) public các loại phòng nổi bật cho trang chủ.

#### Scenario: Lấy phòng nổi bật

- **CHO** có loại phòng active
- **KHI** gọi `/search/featured`
- **THÌ** API PHẢI trả tối đa 6 loại phòng active
- **VÀ** mỗi item gồm id, tên, mô tả, ảnh, diện tích, loại giường, sức chứa, giá từ pricing rule active đầu tiên và chi nhánh của phòng đầu tiên.

### Requirement: Flash Sale Public

Hệ thống PHẢI (SHALL) public flash sale đang diễn ra.

#### Scenario: Flash sale từ endpoint search

- **CHO** flash sale active và thời gian hiện tại nằm trong start/end
- **KHI** gọi `/search/flash-sales`
- **THÌ** API PHẢI trả tối đa 4 flash sale summary với thông tin loại phòng, discount, ngày, quantity và sold count.

#### Scenario: Flash sale từ endpoint chuyên biệt

- **CHO** flash sale active, đang diễn ra và `quantity > soldCount`
- **KHI** gọi `/flash-sales`
- **THÌ** API PHẢI trả flash sale kèm room type.

### Requirement: Chi Tiết Loại Phòng Public

Hệ thống PHẢI (SHALL) public chi tiết loại phòng, review, phòng tương tự và trạng thái đã lưu.

#### Scenario: Lấy chi tiết loại phòng public

- **CHO** loại phòng active tồn tại
- **KHI** gọi `/rooms/types/:id/public`
- **THÌ** API PHẢI trả loại phòng, pricing rule active, rooms kèm branch, room count, review approved mới nhất, average rating, similar rooms và `isSaved`.

#### Scenario: Loại phòng inactive hoặc không tồn tại

- **CHO** loại phòng không tồn tại hoặc inactive
- **KHI** xem chi tiết public
- **THÌ** API PHẢI từ chối với `Loại phòng không tồn tại`.

#### Scenario: Trạng thái đã lưu cho user đăng nhập

- **CHO** user đã đăng nhập
- **KHI** xem chi tiết public
- **THÌ** `isSaved` PHẢI true chỉ khi có wishlist row cho user và loại phòng đó.

#### Scenario: Trạng thái đã lưu cho session ẩn danh

- **CHO** chưa đăng nhập
- **VÀ** có `x-session-id`
- **KHI** xem chi tiết public
- **THÌ** `isSaved` PHẢI true chỉ khi có wishlist row cho session và loại phòng đó.

#### Scenario: Phòng tương tự

- **CHO** có loại phòng active khác
- **KHI** xem chi tiết public
- **THÌ** API PHẢI chọn tối đa 3 loại phòng tương tự theo cùng star rating hoặc cùng province của chi nhánh khi có dữ liệu.

### Requirement: Review Loại Phòng Public

Hệ thống PHẢI (SHALL) public review approved của loại phòng.

#### Scenario: Lấy review theo loại phòng

- **CHO** loại phòng tồn tại
- **KHI** gọi `/rooms/types/:id/reviews`
- **THÌ** API PHẢI trả review approved mới nhất trước và average rating.

