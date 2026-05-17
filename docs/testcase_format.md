# THÔNG TIN ĐỀ TÀI

| Nội dung | Thông tin |
|---|---|
| **Tên đề tài** | Xây dựng … |
| **Sinh viên thực hiện** | 1. ........................................ - MSSV: ......................... |
|  | 2. ........................................ - MSSV: ......................... |
|  | 3. ........................................ - MSSV: ......................... |
|  | 4. ........................................ - MSSV: ......................... |
| **Lớp** | ........................................ |

---

# DANH SÁCH TEST CASE

| STT | Chức năng kiểm thử | Mô tả test case | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái (Pass/Fail) | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 1 | Đăng nhập | Đăng nhập đúng thông tin | Username: `admin`<br>Password: `123456` | 1. Truy cập trang đăng nhập<br>2. Nhập thông tin<br>3. Nhấn **"Đăng nhập"** | Chuyển đến trang Dashboard | Chuyển đến Dashboard | Pass |  |
| 2 | Đăng nhập | Sai mật khẩu | Username: `admin`<br>Password: `abc123` | Thực hiện các bước như trên | Hiển thị lỗi **"Sai mật khẩu"** | Hiển thị đúng lỗi | Pass |  |
| 3 | Thêm sản phẩm | Không nhập tên sản phẩm | Để trống trường **"Tên sản phẩm"** | 1. Vào mục thêm sản phẩm<br>2. Nhấn **"Lưu"** | Hiển thị lỗi **"Tên sản phẩm là bắt buộc"** | Không có phản hồi | Fail | Cần sửa lại xử lý lỗi |