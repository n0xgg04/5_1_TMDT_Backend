# BÁO CÁO PHÂN TÍCH & THIẾT KẾ HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ

Mỗi nhóm sinh viên phải nộp một cuốn báo cáo phân tích và thiết kế hệ thống hoàn chỉnh, bao gồm các phần sau theo đúng thứ tự:

---

# 1. Trang bìa

* Ghi rõ tên đề tài
* Tên đầy đủ các thành viên trong nhóm cùng mã số sinh viên

---

# 2. Trang đánh giá mức độ hoàn thành của các thành viên

* Đánh giá phần trăm (%) mức độ hoàn thành công việc của từng thành viên
* Mức độ hoàn thành phải được các thành viên trong nhóm thống nhất và đồng ý

Ví dụ:

| STT | Họ và tên     | Mã số      | Vai trò     | Mức độ hoàn thành |
| --- | ------------- | ---------- | ----------- | ----------------- |
| 1   | Nguyễn Văn An | B21DCCN219 | Trưởng nhóm | 100%              |
| 2   | Lê Thị B      | B21DCCN918 | Thành viên  | 60%               |
| ... | ...           | ...        | ...         | ...               |

---

# 3. Trang mục lục

* Liệt kê các chương, mục, tiểu mục với số trang tương ứng để tiện tra cứu

---

# 4. Trang ký hiệu và chữ viết tắt

* Liệt kê các ký hiệu, thuật ngữ viết tắt sử dụng trong báo cáo
* Sắp xếp theo thứ tự bảng chữ cái (ABC) để dễ tham khảo

---

# 5. Nội dung báo cáo

# CHƯƠNG 1: TÁC NHÂN VÀ BIỂU ĐỒ USECASE TỔNG QUÁT

## 1.1. Danh sách tác nhân (Actors)

Bảng liệt kê các tác nhân:

* Tên tác nhân
* Mô tả chi tiết về vai trò
* Đối tượng đại diện

Các tác nhân điển hình:

* Khách hàng (chưa đăng nhập / đã đăng nhập)
* Quản trị viên
* Nhân viên kho
* Cổng thanh toán

## 1.2. Biểu đồ Usecase tổng quát

* Hình vẽ UML thể hiện tất cả các usecase và mối quan hệ với tác nhân
* Chú thích rõ các khối usecase theo từng tác nhân (có thể phân vùng)

---

# CHƯƠNG 2: MÔ TẢ VÀ ĐẶC TẢ USECASE CHI TIẾT

## 2.1. Bảng danh mục Usecase

Bảng liệt kê:

* Tất cả các usecase đã xác định
* Phân loại theo tác nhân
* Mô tả ngắn gọn

## 2.2. Đặc tả Usecase chi tiết

Với mỗi usecase, trình bày theo cấu trúc bảng thống nhất gồm:

* Tên Usecase
* Tác nhân chính
* Mô tả ngắn
* Điều kiện tiên quyết
* Điều kiện kết thúc (thành công / thất bại)
* Luồng sự kiện chính (từng bước)
* Luồng sự kiện phụ (ngoại lệ, rẽ nhánh)

> Ghi chú: Nên đặc tả lần lượt cho tất cả usecase trong bảng 2.1.

---

# CHƯƠNG 3: BIỂU ĐỒ TUẦN TỰ CHI TIẾT

## 3.1. Nguyên tắc xây dựng biểu đồ tuần tự

Xác định các đối tượng:

* Actor
* Boundary
* Control
* Entity

Các ký hiệu UML:

* Lifeline
* Message
* Alt
* Loop
* Opt
* ...

## 3.2. Biểu đồ tuần tự cho từng Usecase

* Với mỗi usecase trong danh mục, vẽ một biểu đồ tuần tự tương ứng (UML)
* Thể hiện rõ:

  * Thứ tự thông điệp
  * Điều kiện rẽ nhánh (nếu có)
  * Luồng sự kiện đã đặc tả
* Có thể nhóm các usecase có luồng tương tự nhau, nhưng nên vẽ riêng để đảm bảo chi tiết

---

# CHƯƠNG 4: BIỂU ĐỒ LỚP VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU

## 4.1. Biểu đồ lớp (Class Diagram) tổng quát

Hình vẽ UML thể hiện:

* Các lớp chính (thực thể, điều khiển, biên giới nếu cần)
* Các thuộc tính (kèm kiểu dữ liệu)
* Các phương thức quan trọng
* Mối quan hệ:

  * Kế thừa
  * Kết hợp
  * Bội số

## 4.2. Thiết kế cơ sở dữ liệu quan hệ

Chuyển đổi từ biểu đồ lớp sang mô hình cơ sở dữ liệu.

Bảng mô tả chi tiết từng bảng gồm:

* Tên bảng
* Các cột:

  * Tên cột
  * Kiểu dữ liệu
  * Ràng buộc:

    * PK
    * FK
    * NOT NULL
    * UNIQUE
    * DEFAULT
* Mô tả ý nghĩa

Có thể kèm theo:

* Sơ đồ quan hệ giữa các bảng (ERD)

---

# CHƯƠNG 5: THIẾT KẾ GIAO DIỆN (UI/UX – WIREFRAME / MOCKUP)

## 5.1. Danh sách các trang giao diện chính

* Trang chủ
* Danh sách sản phẩm (có bộ lọc, tìm kiếm)
* Chi tiết sản phẩm
* Giỏ hàng
* Thanh toán
* Lịch sử đơn hàng / Hồ sơ cá nhân
* Các trang quản trị:

  * Dashboard
  * Quản lý sản phẩm
  * Quản lý đơn hàng
  * Quản lý người dùng
  * ...

## 5.2. Wireframe / Mockup từng trang

* Hình ảnh phác thảo:

  * Figma
  * Balsamiq
  * Vẽ tay
* Mỗi hình có chú thích bố cục:

  * Header
  * Footer
  * Sidebar
  * Nội dung chính
* Xác định các thành phần tương tác:

  * Nút bấm
  * Form nhập liệu
  * Bảng dữ liệu
  * Menu
  * ...

## 5.3. Nguyên tắc thiết kế

* Tính nhất quán giữa các trang
* Trải nghiệm người dùng hợp lý:

  * Dễ thao tác
  * Thông báo rõ ràng
* Dễ dàng triển khai thành:

  * HTML
  * CSS
  * JavaScript

---

# CHƯƠNG 6: LỰA CHỌN CÔNG CỤ PHÁT TRIỂN HỆ THỐNG

## 6.1. Giới thiệu các công nghệ dự kiến

### Backend

Ví dụ:

* Java Spring Boot
* Node.js
* PHP Laravel
* ...

### Frontend

Ví dụ:

* React
* Vue
* Angular
* HTML/CSS/JS thuần

### Cơ sở dữ liệu

Ví dụ:

* MySQL
* PostgreSQL
* MongoDB

### Cổng thanh toán

Ví dụ:

* VNPAY
* PayPal
* Stripe

### Công cụ hỗ trợ

* Git
* Figma
* Postman
* Docker (nếu có)

## 6.2. Lý do lựa chọn và sự phù hợp

* Phân tích ưu điểm từng công cụ:

  * Bảo mật
  * Hiệu năng
  * Dễ học
  * Cộng đồng hỗ trợ
  * Chi phí
* Giải thích vì sao bộ công nghệ phù hợp với:

  * Quy mô đồ án
  * Dự án thực tế

## 6.3. Kiến trúc tổng thể dự kiến (nếu cần)

* Sơ đồ các thành phần:

  * Client
  * Server
  * Database
  * Third-party services
* Giao tiếp:

  * REST API
  * GraphQL
  * ...

---

# YÊU CẦU VỀ TRÌNH BÀY BÁO CÁO

# 1. Yêu cầu chung

* Báo cáo phải được trình bày rõ ràng, mạch lạc
* Không mắc lỗi chính tả hoặc ngữ pháp
* Nội dung cần thống nhất:

  * Định dạng
  * Cách đánh số đề mục
  * Bảng biểu
  * Hình ảnh

---

# 2. Định dạng trang giấy

* Khổ giấy: A4

## Lề trang (Margins)

* Trên: 2.0 cm
* Dưới: 2.0 cm
* Trái: 3.0 cm
* Phải: 2.0 cm

## Header / Footer

* Cách mép giấy: 1.0 cm

## Căn lề (Alignment)

* Justified (canh đều 2 bên)

## Khoảng cách đoạn (Paragraph spacing)

* Before: 3 pt
* After: 3 pt

## Giãn dòng (Line spacing)

* Multiple 1.3

---

# 3. Định dạng chữ

* Font chữ: Times New Roman

## Cỡ chữ

* Nội dung thông thường: Size 13
* Tiêu đề chương:

  * In hoa
  * In đậm
  * Size 14
* Tiêu đề mục lớn trong chương:

  * In đậm
  * Size 13

> Phải thống nhất toàn bộ font chữ, cỡ chữ và kiểu chữ trong toàn bộ báo cáo.

---

# 4. Đánh số hình, bảng và đề mục

## Đánh số hình và bảng

Ví dụ:

* Hình 2.1: Hình thứ nhất trong Chương 2
* Bảng 3.5: Bảng thứ năm trong Chương 3

## Cách đánh số đề mục

* Cấp chương: `1`, `2`, `3`, ...
* Cấp mục: `1.1`, `1.2`, ...
* Cấp tiểu mục: `1.1.1`, `1.1.2`, ...
* Nếu cần sâu hơn: `1.1.1.1`, ...

---

# 5. Header và Footer trên mỗi trang

## Header (góc trên trái)

* Ghi tên đề tài bài tập lớn

## Footer (góc dưới phải)

* Ghi số thứ tự trang (Page number)
