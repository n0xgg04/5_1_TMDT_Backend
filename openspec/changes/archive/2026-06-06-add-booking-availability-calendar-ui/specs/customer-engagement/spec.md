## ADDED Requirements

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
