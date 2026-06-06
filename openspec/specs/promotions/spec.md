# Đặc Tả Khuyến Mãi

## Purpose

Định nghĩa tạo coupon, public coupon, claim coupon, áp dụng coupon, usage tracking, user coupon state và flash sale.

## Requirements

### Requirement: Quản Trị Coupon

Hệ thống PHẢI (SHALL) cho admin tạo coupon và xem tất cả coupon.

#### Scenario: Tạo coupon phần trăm

- **CHO** admin đã đăng nhập
- **KHI** post `/coupons/admin` với code, value, khoảng ngày và giới hạn tùy chọn
- **THÌ** hệ thống PHẢI lưu code dạng uppercase
- **VÀ** default type là `percentage` khi thiếu
- **VÀ** default usage limit là 1 khi thiếu
- **VÀ** lưu min amount và max discount thiếu thành null.

#### Scenario: Tạo coupon fixed

- **CHO** admin đã đăng nhập
- **KHI** tạo coupon type `fixed`
- **THÌ** value PHẢI được hiểu là số tiền giảm cố định khi apply.

#### Scenario: Admin liệt kê coupon

- **CHO** admin đã đăng nhập
- **KHI** gọi `/coupons/admin`
- **THÌ** tất cả coupon PHẢI được trả về, mới nhất trước.

#### Scenario: User không phải admin quản lý coupon

- **CHO** user không phải admin đã đăng nhập
- **KHI** gọi endpoint coupon admin
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Public Coupon Active

Hệ thống PHẢI (SHALL) public coupon đang hoạt động cho user ẩn danh và user đã đăng nhập.

#### Scenario: Coupon active public

- **CHO** coupon `isActive=true`, thời điểm hiện tại trong start/end và usage count dưới usage limit
- **KHI** gọi `/coupons`
- **THÌ** chỉ các coupon đó PHẢI được trả về, mới nhất trước.

#### Scenario: Public coupon cho anonymous

- **CHO** user chưa đăng nhập
- **KHI** gọi `/coupons/public`
- **THÌ** coupon active/current PHẢI được trả về với `isClaimed=false`.

#### Scenario: Public coupon cho user đã đăng nhập

- **CHO** user đã đăng nhập
- **VÀ** user đã claim một số coupon
- **KHI** gọi `/coupons/public`
- **THÌ** coupon active/current PHẢI được trả về
- **VÀ** từng coupon có `isClaimed=true` chỉ khi có `UserCoupon` của user đó.

### Requirement: Claim Coupon

Hệ thống PHẢI (SHALL) cho user đã đăng nhập lưu coupon vào tài khoản.

#### Scenario: Claim coupon mới

- **CHO** user đã đăng nhập
- **VÀ** chưa có `UserCoupon` cho user và coupon id
- **KHI** post `/coupons/:id/claim`
- **THÌ** hệ thống PHẢI tạo `UserCoupon` và include coupon trong response.

#### Scenario: Claim coupon đã tồn tại

- **CHO** đã có `UserCoupon` cho user và coupon id
- **KHI** user claim lại coupon đó
- **THÌ** hệ thống PHẢI trả row hiện có và không tạo duplicate.

#### Scenario: Xem coupon của tôi

- **CHO** user đã đăng nhập
- **KHI** gọi `/coupons/my-coupons`
- **THÌ** API PHẢI trả user coupon kèm coupon, mới nhất trước.

### Requirement: Áp Dụng Coupon

Hệ thống PHẢI (SHALL) validate và tính discount coupon; endpoint apply độc lập không yêu cầu đăng nhập.

#### Scenario: Apply coupon phần trăm hợp lệ

- **CHO** coupon tồn tại, active, đang trong thời gian hiệu lực, chưa hết lượt và đạt min amount
- **VÀ** type là `percentage`
- **KHI** post `/coupons/apply` với code và amount
- **THÌ** discount PHẢI bằng `amount * value / 100`
- **VÀ** bị chặn bởi `maxDiscount` nếu có
- **VÀ** không vượt quá amount
- **VÀ** response gồm code, type, value, discount, final amount.

#### Scenario: Apply coupon fixed hợp lệ

- **CHO** coupon hợp lệ có type khác `percentage`
- **KHI** apply
- **THÌ** discount PHẢI bằng coupon value nhưng không vượt quá amount.

#### Scenario: Coupon không tồn tại

- **CHO** không có coupon theo code sau khi uppercase
- **KHI** apply coupon
- **THÌ** API PHẢI từ chối với `Mã giảm giá không tồn tại`.

#### Scenario: Coupon inactive

- **CHO** coupon tồn tại nhưng `isActive=false`
- **KHI** apply coupon
- **THÌ** API PHẢI từ chối với `Mã giảm giá không còn hiệu lực`.

#### Scenario: Coupon ngoài thời gian hiệu lực

- **CHO** hiện tại trước start date hoặc sau end date
- **KHI** apply coupon
- **THÌ** API PHẢI từ chối với `Mã giảm giá đã hết hạn hoặc chưa bắt đầu`.

#### Scenario: Coupon hết lượt

- **CHO** `usageCount >= usageLimit`
- **KHI** apply coupon
- **THÌ** API PHẢI từ chối với `Mã giảm giá đã hết lượt sử dụng`.

#### Scenario: Chưa đạt giá trị đơn tối thiểu

- **CHO** coupon có `minAmount` và amount gửi lên thấp hơn
- **KHI** apply coupon
- **THÌ** API PHẢI từ chối bằng message nêu số tiền đơn tối thiểu.

### Requirement: Sử Dụng Coupon Trong Booking

Luồng tạo booking PHẢI (SHALL) consume coupon sau khi đã tính flash sale.

#### Scenario: Booking dùng coupon tăng usage

- **CHO** customer tạo booking với coupon hợp lệ
- **KHI** tạo booking thành công
- **THÌ** usage count của coupon PHẢI tăng
- **VÀ** user coupon PHẢI được upsert thành đã dùng với `usedAt`.

#### Scenario: Chuẩn hóa code khi booking

- **CHO** customer gửi coupon code chữ thường
- **KHI** apply coupon
- **THÌ** lookup PHẢI dùng code uppercase.

### Requirement: Public Flash Sale

Hệ thống PHẢI (SHALL) public flash sale active còn số lượng.

#### Scenario: Danh sách flash sale active

- **CHO** flash sale active, đang trong thời gian hiệu lực và `quantity > soldCount`
- **KHI** gọi `/flash-sales`
- **THÌ** flash sale PHẢI được trả về cùng room type.

#### Scenario: Flash sale chưa đến hoặc đã hết hạn

- **CHO** thời điểm hiện tại nằm ngoài start/end
- **KHI** gọi `/flash-sales`
- **THÌ** flash sale PHẢI bị loại.

#### Scenario: Flash sale đã bán hết

- **CHO** `soldCount >= quantity`
- **KHI** gọi `/flash-sales`
- **THÌ** flash sale PHẢI bị loại.

### Requirement: Tính Giá Flash Sale

Luồng booking PHẢI (SHALL) giảm giá gốc theo phần trăm flash sale active của loại phòng đã chọn.

#### Scenario: Tính giá flash sale

- **CHO** có flash sale active/current cho room type
- **KHI** tính giá flash sale
- **THÌ** discount PHẢI bằng `basePrice * discount / 100`
- **VÀ** giá sau giảm PHẢI là `max(0, basePrice - discount)`
- **VÀ** kết quả gồm flash sale id và discount value.

#### Scenario: Không có flash sale

- **CHO** không có flash sale active/current cho room type
- **KHI** tính giá flash sale
- **THÌ** base price PHẢI giữ nguyên
- **VÀ** flash sale id là null.

#### Scenario: Tăng sold count flash sale

- **CHO** có flash sale id
- **KHI** gọi tăng sold count
- **THÌ** `soldCount` của flash sale PHẢI tăng 1.
