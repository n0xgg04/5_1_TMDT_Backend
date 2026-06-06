# Đặc Tả Định Danh Và Phân Quyền

## Purpose

Định nghĩa đăng ký, đăng nhập, vòng đời JWT, refresh token, hồ sơ cá nhân, đổi mật khẩu, quản lý nhân viên, khóa tài khoản và phân quyền theo role.

## Requirements

### Requirement: Đăng Ký Khách Hàng

Hệ thống PHẢI (SHALL) cho phép khách hàng mới đăng ký bằng email, mật khẩu mạnh, họ, tên và số điện thoại tùy chọn.

#### Scenario: Đăng ký thành công

- **CHO** chưa tồn tại user với email đã gửi
- **VÀ** mật khẩu có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt
- **KHI** khách gửi thông tin đăng ký
- **THÌ** hệ thống PHẢI hash mật khẩu bằng bcrypt cost 12
- **VÀ** tạo user role mặc định `CUSTOMER`
- **VÀ** phát hành access token và refresh token
- **VÀ** lưu bcrypt hash của refresh token vào user.

#### Scenario: Email đăng ký bị trùng

- **CHO** đã tồn tại user với email đã gửi
- **KHI** đăng ký
- **THÌ** API PHẢI từ chối với `Email đã được sử dụng`.

#### Scenario: Mật khẩu đăng ký yếu

- **CHO** mật khẩu không đạt quy tắc độ mạnh
- **KHI** validation chạy
- **THÌ** API PHẢI từ chối bằng thông điệp validation về độ mạnh mật khẩu.

### Requirement: Đăng Nhập

Hệ thống PHẢI (SHALL) xác thực user đang hoạt động bằng email và mật khẩu, sau đó phát hành token pair mới.

#### Scenario: Đăng nhập thành công

- **CHO** tồn tại user active với email đã gửi
- **VÀ** bcrypt xác minh mật khẩu thành công
- **KHI** đăng nhập
- **THÌ** API PHẢI trả user identity và access/refresh token mới
- **VÀ** thay thế refresh token hash đang lưu.

#### Scenario: Tài khoản bị khóa đăng nhập

- **CHO** user tồn tại nhưng `isActive=false`
- **KHI** đăng nhập
- **THÌ** API PHẢI từ chối với `Email hoặc mật khẩu không đúng`.

#### Scenario: Sai thông tin đăng nhập

- **CHO** không có user theo email hoặc mật khẩu không khớp
- **KHI** đăng nhập
- **THÌ** API PHẢI từ chối với `Email hoặc mật khẩu không đúng`.

### Requirement: Vòng Đời JWT

Hệ thống PHẢI (SHALL) phát hành access token ngắn hạn và refresh token dài hạn, ký bằng secret riêng.

#### Scenario: Tạo token

- **CHO** user id, email và role
- **KHI** tạo token
- **THÌ** access token PHẢI chứa `sub`, `email`, `role` và hết hạn sau 15 phút
- **VÀ** refresh token PHẢI chứa payload tương tự và hết hạn sau 7 ngày.

#### Scenario: Refresh thành công

- **CHO** refresh token hợp lệ, ký bằng `JWT_REFRESH_SECRET`
- **VÀ** user tham chiếu tồn tại, active và có refresh token hash
- **VÀ** bcrypt compare thành công
- **KHI** gọi `/auth/refresh`
- **THÌ** API PHẢI phát hành token pair mới
- **VÀ** rotate refresh token hash đã lưu.

#### Scenario: Refresh token không hợp lệ

- **CHO** refresh token hết hạn, ký sai secret, không khớp hash hoặc thuộc user inactive/không tồn tại
- **KHI** refresh
- **THÌ** API PHẢI từ chối với `Refresh token không hợp lệ hoặc đã hết hạn`.

#### Scenario: Đăng xuất

- **CHO** user đã đăng nhập
- **KHI** gọi `/auth/logout`
- **THÌ** hệ thống PHẢI set refresh token đã lưu thành null
- **VÀ** trả `Đăng xuất thành công`.

### Requirement: Hồ Sơ Cá Nhân Qua Auth

Hệ thống PHẢI (SHALL) cho phép user đã đăng nhập xem và cập nhật hồ sơ qua endpoint auth.

#### Scenario: Lấy hồ sơ hiện tại

- **CHO** access token hợp lệ
- **KHI** gọi `/auth/me`
- **THÌ** API PHẢI trả id, email, họ, tên, số điện thoại, role và thời điểm tạo.

#### Scenario: Cập nhật hồ sơ

- **CHO** access token hợp lệ
- **KHI** patch `/auth/me` với họ, tên hoặc số điện thoại
- **THÌ** API PHẢI cập nhật các field đã gửi
- **VÀ** trả identity mới.

#### Scenario: Đổi mật khẩu qua auth endpoint

- **CHO** access token hợp lệ
- **VÀ** mật khẩu hiện tại khớp
- **VÀ** mật khẩu mới đạt quy tắc độ mạnh
- **KHI** patch `/auth/change-password`
- **THÌ** hệ thống PHẢI hash mật khẩu mới bằng bcrypt cost 12
- **VÀ** trả `Đổi mật khẩu thành công`.

#### Scenario: Sai mật khẩu hiện tại

- **CHO** mật khẩu hiện tại không khớp
- **KHI** đổi mật khẩu
- **THÌ** API PHẢI từ chối với `Mật khẩu hiện tại không đúng`.

### Requirement: Hồ Sơ Cá Nhân Qua Users

Hệ thống PHẢI (SHALL) cung cấp `/users/me` để lấy hồ sơ và cập nhật hồ sơ kèm tùy chọn đổi mật khẩu.

#### Scenario: Lấy hồ sơ user hiện tại

- **CHO** user đã đăng nhập
- **KHI** gọi `/users/me`
- **THÌ** API PHẢI trả id, email, họ, tên, số điện thoại, role, trạng thái active và thời điểm tạo.

#### Scenario: Cập nhật không đổi mật khẩu

- **CHO** user đã đăng nhập
- **KHI** patch `/users/me` không có `newPassword`
- **THÌ** hệ thống PHẢI cập nhật profile đã gửi và giữ nguyên mật khẩu.

#### Scenario: Đổi mật khẩu thiếu mật khẩu hiện tại

- **CHO** user patch `/users/me` có `newPassword`
- **KHI** `currentPassword` bị thiếu
- **THÌ** API PHẢI từ chối với `Vui lòng cung cấp mật khẩu hiện tại`.

#### Scenario: Đổi mật khẩu kèm profile thành công

- **CHO** user patch `/users/me` với `currentPassword` và `newPassword`
- **VÀ** mật khẩu hiện tại khớp
- **KHI** validation thành công
- **THÌ** hệ thống PHẢI hash mật khẩu mới và lưu cùng các thay đổi profile.

### Requirement: Admin Liệt Kê User

Hệ thống PHẢI (SHALL) cho phép admin liệt kê user, phân trang và lọc theo role.

#### Scenario: Admin xem danh sách user

- **CHO** admin đã đăng nhập
- **KHI** gọi `/users?page=1&limit=20`
- **THÌ** API PHẢI trả user mới nhất trước
- **VÀ** gồm id, email, họ, tên, role, active state, thời điểm tạo
- **VÀ** trả metadata `items`, `total`, `page`, `limit`.

#### Scenario: Lọc user theo role

- **CHO** admin đã đăng nhập
- **KHI** gọi `/users?role=RECEPTIONIST`
- **THÌ** chỉ user role `RECEPTIONIST` được trả về.

#### Scenario: User không phải admin liệt kê user

- **CHO** user không phải admin đã đăng nhập
- **KHI** gọi `/users`
- **THÌ** API PHẢI từ chối bằng role guard.

### Requirement: Tạo Tài Khoản Nhân Viên

Hệ thống PHẢI (SHALL) cho phép admin tạo tài khoản staff/admin qua endpoint staff, nhưng không tạo customer từ endpoint này.

#### Scenario: Tạo lễ tân

- **CHO** admin đã đăng nhập
- **VÀ** email chưa tồn tại
- **VÀ** role gửi lên là `RECEPTIONIST`, `HOUSEKEEPING` hoặc `ADMIN`
- **KHI** post `/users/staff`
- **THÌ** hệ thống PHẢI hash mật khẩu bằng bcrypt cost 12
- **VÀ** tạo tài khoản
- **VÀ** trả identity không gồm password hash.

#### Scenario: Email nhân viên bị trùng

- **CHO** đã tồn tại user với email đã gửi
- **KHI** admin tạo staff
- **THÌ** API PHẢI từ chối với `Email đã được sử dụng`.

#### Scenario: Role nhân viên không hợp lệ

- **CHO** role gửi lên không thuộc `RECEPTIONIST`, `HOUSEKEEPING`, `ADMIN`
- **KHI** admin tạo staff
- **THÌ** API PHẢI từ chối với `Vai trò không hợp lệ`.

### Requirement: Khóa Và Mở Khóa Tài Khoản

Hệ thống PHẢI (SHALL) cho phép admin toggle active state của user khác và không cho tự khóa chính mình.

#### Scenario: Toggle khóa tài khoản

- **CHO** admin đã đăng nhập
- **VÀ** target user tồn tại
- **KHI** patch `/users/:id/toggle-lock`
- **THÌ** hệ thống PHẢI đảo giá trị `isActive`
- **VÀ** trả id, email và active state mới.

#### Scenario: Admin tự khóa chính mình

- **CHO** admin đã đăng nhập
- **KHI** admin target chính user id của mình để toggle lock
- **THÌ** API PHẢI từ chối với `Không thể tự khóa tài khoản của mình`.

#### Scenario: Tài khoản bị khóa không thể xác thực

- **CHO** account có `isActive=false`
- **KHI** user đăng nhập hoặc refresh token
- **THÌ** hệ thống PHẢI từ chối xác thực.

### Requirement: Frontend Lưu Và Refresh Auth

Web app PHẢI (SHALL) lưu auth state và tự refresh access token hết hạn.

#### Scenario: Lưu token pair

- **CHO** login hoặc register thành công
- **KHI** auth store nhận user và tokens
- **THÌ** web PHẢI lưu `accessToken`, `refreshToken` và state `hotel-auth` trong local storage.

#### Scenario: Gửi request đã đăng nhập

- **CHO** `accessToken` tồn tại trong browser storage
- **KHI** axios API client gửi request
- **THÌ** client PHẢI thêm `Authorization: Bearer <accessToken>`.

#### Scenario: Access token hết hạn

- **CHO** API trả 401
- **VÀ** có `refreshToken`
- **KHI** response interceptor xử lý
- **THÌ** client PHẢI gọi `/auth/refresh`, lưu token pair mới và retry request gốc đúng một lần.

#### Scenario: Refresh thất bại

- **CHO** refresh thất bại hoặc không có refresh token
- **KHI** interceptor xử lý 401
- **THÌ** client PHẢI xóa auth state local và chuyển hướng đến `/login`.
