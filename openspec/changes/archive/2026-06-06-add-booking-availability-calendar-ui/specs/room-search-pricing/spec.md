## MODIFIED Requirements

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
