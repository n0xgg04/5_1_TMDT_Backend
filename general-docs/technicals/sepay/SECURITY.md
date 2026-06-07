Bảo mật webhook SePay thế nào?
Checklist bảo mật endpoint webhook SePay: HTTPS, whitelist IP, xác thực HMAC-SHA256, chống replay attack và validate dữ liệu trước khi xử lý.

Mở bằng AI
ChatGPT
ChatGPT
Claude
Claude
Perplexity
Perplexity
Grok
Grok
Cursor
Cursor

Sao chép cho AI

Xem Markdown
Checklist
Dùng HTTPS
Bật xác thực HMAC-SHA256
Whitelist IP SePay
Kiểm tra trùng lặp giao dịch
Validate số tiền, tài khoản
Đối soát định kỳ
Yêu cầu URL
Webhook URL phải gọi được từ Internet công khai:

Bắt buộc dùng HTTPS, không chấp nhận HTTP
Domain phải phân giải DNS ra IP public
Không chấp nhận IP nội bộ (localhost, 127.0.0.1, 10.x, 172.16-31.x, 192.168.x) hay các dải IP reserved
URL không đạt sẽ bị từ chối khi lưu webhook.

Dùng chứng chỉ SSL hợp lệ (có thể xin miễn phí qua Let's Encrypt). Không nên dùng chứng chỉ self-signed. CA chain (chuỗi chứng chỉ trung gian) phải đầy đủ.

Xác thực chữ ký
Luôn kiểm tra chữ ký ở mọi request. Khuyến nghị dùng HMAC-SHA256. Tối thiểu cũng phải có API Key.

Không nên chấp nhận webhook mà không xác thực. Bất kỳ ai biết URL đều có thể gửi payload giả.

IP Whitelist
Chỉ cho phép request từ IP SePay. Danh sách IP xem tại Địa chỉ IP. Cấu hình ở firewall hoặc middleware.

Chống replay attack
Nếu dùng HMAC-SHA256, kiểm tra thêm X-SePay-Timestamp. Từ chối request có timestamp cách hiện tại quá 5 phút để chặn kẻ tấn công gửi lại request cũ. Đồng hồ server lệch quá nhiều thì bật NTP để đồng bộ tự động.

Validate dữ liệu
Trước khi xác nhận thanh toán, hãy kiểm tra:

transferAmount có đúng số tiền đơn hàng không
accountNumber có phải tài khoản của bạn không
code có khớp mã thanh toán đơn hàng không
Cần chắc chắn hơn thì gọi API giao dịch để đối chiếu.

Lưu raw payload
Lưu toàn bộ payload gốc vào database trước khi xử lý. Sau này cần debug, audit, hay đối soát đều có sẵn dữ liệu.

Đối soát định kỳ
Webhook có thể mất nếu endpoint sập quá 5 giờ. Nên chạy cron 15-30 phút một lần, gọi API lấy giao dịch, so với database, bổ sung giao dịch thiếu. Chi tiết xem Đối soát giao dịch.

Tiếp theo
Giám sát: lịch sử gửi, cảnh báo, sự cố
Xử lý lỗi: lịch retry và chẩn đoán khi webhook không gửi
Đối soát giao dịch: backup khi webhook mất

Xác thực webhook SePay thế nào?
So sánh 4 cách xác thực webhook SePay (HMAC-SHA256, API Key, OAuth 2.0, không xác thực) kèm code mẫu đầy đủ trong PHP, Node.js và Python.

Mở bằng AI
ChatGPT
ChatGPT
Claude
Claude
Perplexity
Perplexity
Grok
Grok
Cursor
Cursor

Sao chép cho AI

Xem Markdown
SePay hỗ trợ 4 cách xác thực. Bạn chọn cách lúc tạo webhook và có thể đổi lại bất cứ lúc nào.

Cách Bảo mật Độ khó Khi nào dùng
Không xác thực Thấp Dễ Chỉ test, không dùng production
API Key Trung bình Dễ Yêu cầu xác thực cơ bản
HMAC-SHA256 Cao Trung bình Khuyến nghị. Phát hiện ngay nếu payload bị sửa giữa đường truyền
OAuth 2.0 Cao Cao Hệ thống đã có OAuth server sẵn
Không xác thực
Không có bước xác thực nào. SePay gửi thẳng webhook đến URL của bạn, không kèm header bảo mật, và server của bạn không có cách nào kiểm tra request có thực sự đến từ SePay hay không.

Chỉ nên dùng khi test trong môi trường nội bộ. Không bao giờ dùng cho production, vì bất kỳ ai biết URL đều có thể gửi request giả mạo đến endpoint của bạn.

API Key
SePay gửi kèm header Authorization, server bạn so sánh với giá trị đã cấu hình.

Header
Code

Authorization: Apikey YOUR_API_KEY
Code kiểm tra

PHP
PHP

Node.js

<?php
$expected = getenv('SEPAY_API_KEY');
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
 
if (!str_starts_with($auth, 'Apikey ') || !hash_equals($expected, substr($auth, 7))) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
 
$payload = json_decode(file_get_contents('php://input'), true);
// ... xử lý ...
echo json_encode(['success' => true]);
Cấu hình
Chọn API Key ở bước Bảo mật khi tạo webhook, nhập key rồi lưu vào biến môi trường trên server.

Cấu hình API Key
Nhấn để phóng to
Cấu hình API Key khi tạo webhook
API Key chỉ hiện đầy đủ một lần
Sau khi lưu, mở lại chỉ thấy 4 ký tự cuối (****xxxx). SePay không lưu bản rõ. Copy vào biến môi trường ngay khi tạo. Quên hoặc nghi bị lộ thì tạo API Key mới.

API Key chỉ xác minh request đến từ SePay, nhưng không bảo vệ payload nếu có ai chen ngang sửa đổi giữa đường truyền. Cần bảo mật hơn thì dùng HMAC-SHA256.

HMAC-SHA256
Cách xác thực an toàn nhất. SePay ký từng request bằng chữ ký số rồi gửi kèm trong header. Server của bạn tái tạo chữ ký theo cùng công thức rồi so sánh để xác minh request là thật.

Headers SePay gửi
X-SePay-Signature
string
Chữ ký, định dạng sha256={hex_hash}
X-SePay-Timestamp
string
Unix timestamp (giây) lúc ký
Cách SePay ký
Lấy timestamp hiện tại (Unix seconds)
Ghép chuỗi: {timestamp}.{raw_body}
Tính HMAC-SHA256 với Secret Key
Gửi header X-SePay-Signature: sha256={hex_hash}
Gửi header X-SePay-Timestamp: {timestamp}
Dùng raw body, không dùng body đã parse
SePay ký bytes gốc của body. Nếu middleware (express.json(), Fastify default...) đã parse rồi bạn JSON.stringify(req.body) lại thì chữ ký sẽ lệch vì:

PHP escape Unicode thành \uXXXX, JavaScript thì không
Thứ tự khóa JSON có thể đổi
Khoảng trắng có thể khác
Cách đọc raw body: Node.js express.raw({ type: 'application/json' }), PHP file_get_contents('php://input'), Python request.get_data(as_text=True).

Webhook dùng form-encoded body
Nếu webhook cấu hình application/x-www-form-urlencoded hoặc multipart/form-data, SePay ký chuỗi form-encoded (giống http_build_query của PHP). Vẫn dùng raw body.

Code kiểm tra chữ ký

PHP
PHP

Node.js

PY
Python

<?php
$signature = $_SERVER['HTTP_X_SEPAY_SIGNATURE'] ?? '';
$timestamp = (int) ($_SERVER['HTTP_X_SEPAY_TIMESTAMP'] ?? 0);
$body      = file_get_contents('php://input');
$secret    = getenv('SEPAY_WEBHOOK_SECRET');
 
// Kiểm tra timestamp chống replay (±5 phút)
if (abs(time() - $timestamp) > 300) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Request expired']);
    exit;
}
 
// Tái tạo chữ ký và so sánh constant-time
$expected = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $body, $secret);
if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid signature']);
    exit;
}
 
$payload = json_decode($body, true);
// ... xử lý giao dịch ...
echo json_encode(['success' => true]);
Cấu hình
Tạo/sửa webhook, chọn HMAC-SHA256 ở bước Bảo mật
Nhập Secret Key hoặc bấm nút tạo tự động
Lưu Secret Key vào biến môi trường trên server (SEPAY_WEBHOOK_SECRET)
Cấu hình HMAC-SHA256
Nhấn để phóng to
Cấu hình HMAC-SHA256 khi tạo webhook
Bảo quản Secret Key
Sau khi lưu, mở lại chỉ thấy 4 ký tự cuối (****xxxx) — SePay không lưu bản rõ. Copy vào biến môi trường ngay khi tạo, không commit vào source code, không gửi qua email/chat. Quên hoặc nghi bị lộ thì tạo Secret Key mới.

Lỗi thường gặp
Vấn đề	Nguyên nhân	Cách sửa
Chữ ký không khớp	Middleware parse body rồi serialize lại	Dùng raw body gốc
Chữ ký không khớp	Sai Secret Key	Kiểm tra biến môi trường
Chữ ký không khớp	Thiếu timestamp trong chuỗi ký	Đúng format: {timestamp}.{body}
Timestamp quá cũ	Đồng hồ server lệch	Bật NTP để đồng bộ thời gian tự động
OAuth 2.0
Cách hoạt động: SePay gọi token endpoint của bạn để lấy access token, sau đó gửi webhook kèm header Authorization: Bearer {access_token}. Khi token sắp hết hạn, SePay tự refresh hoặc xin token mới.

Cấu hình OAuth 2.0
Nhấn để phóng to
Cấu hình OAuth 2.0 khi tạo webhook
Hai định dạng hỗ trợ
Dạng chuẩn	Dạng tùy chỉnh
Request	application/x-www-form-urlencoded	application/json
Body	grant_type=client_credentials	{"clientId": "...", "clientSecret": "..."}
Response	{"access_token": "...", "expires_in": 3600}	{"data": {"accessToken": "...", "expiredIn": 3600}}
Khi xin token, SePay thử dạng chuẩn trước. Phản hồi không đúng format thì tự chuyển sang dạng tùy chỉnh. Tích hợp mới nên dùng dạng chuẩn; hệ thống đang chạy ổn dạng tùy chỉnh thì cứ để nguyên.

Dạng chuẩn
OAuth 2.0 client credentials. Hầu hết framework đều hỗ trợ sẵn. SePay gửi request tới token endpoint của bạn:


cURL

HTTP

curl -X POST https://your-server.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
Tham số body (application/x-www-form-urlencoded):

grant_type
string
required
Luôn là client_credentials
client_id
string
required
Client ID đã cấu hình trên Webhooks
client_secret
string
required
Client Secret đã cấu hình trên Webhooks
Response:

RESPONSE

{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBh..."
}
access_token
string
required
Token SePay dùng ở header Authorization: Bearer {access_token}
expires_in
integer
Thời gian hết hạn (giây). Mặc định 3600 nếu không trả
refresh_token
string
Refresh token. Không có thì SePay xin token mới từ đầu
Code mẫu server endpoint:


PHP
PHP

Node.js

<?php
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$grantType = $_POST['grant_type'] ?? '';
 
if ($grantType !== 'client_credentials') {
    http_response_code(400);
    echo json_encode(['error' => 'unsupported_grant_type']);
    exit;
}
 
$expected = 'Basic ' . base64_encode(getenv('CLIENT_ID') . ':' . getenv('CLIENT_SECRET'));
if (!hash_equals($expected, $auth)) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid_client']);
    exit;
}
 
echo json_encode([
    'access_token' => bin2hex(random_bytes(32)),
    'token_type'   => 'Bearer',
    'expires_in'   => 3600,
]);
Dạng tùy chỉnh
Tương thích ngược cho hệ thống đã tích hợp trước. Không cần chuyển nếu đang chạy ổn. SePay gửi request tới token endpoint của bạn:


cURL

HTTP

curl -X POST https://your-server.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"clientId":"YOUR_CLIENT_ID","clientSecret":"YOUR_CLIENT_SECRET"}'
Tham số body (application/json):

clientId
string
required
Client ID đã cấu hình trên Webhooks
clientSecret
string
required
Client Secret đã cấu hình trên Webhooks
Response:

RESPONSE

{
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiredIn": 3600
  }
}
data.accessToken
string
required
Access token
data.refreshToken
string
required
Refresh token
data.expiredIn
integer
required
Thời gian hết hạn (giây)
Refresh Token
Token còn dưới 10 giây thì SePay refresh. Refresh thất bại thì xin token mới từ đầu.

Dạng chuẩn: grant_type=refresh_token + refresh_token dạng form-urlencoded.

Dạng tùy chỉnh: JSON {"clientId": "...", "clientSecret": "...", "refreshToken": "..."}.

SePay thử dạng chuẩn trước, lỗi thì chuyển sang dạng tùy chỉnh.

Gửi webhook
Có token rồi, SePay gửi:

POST https://your-webhook-url
Authorization: Bearer eyJhbGci...
Content-Type: application/json
Endpoint trả 200/201 kèm {"success": true} là thành công. Mọi kết quả khác đều bị tính là thất bại.

Lưu ý
Token endpoint phải HTTPS
Token endpoint lỗi thì retry theo cùng lịch webhook delivery, xem Xử lý lỗi
Bị lỗi xác thực OAuth và webhook không đến? Xem Chẩn đoán OAuth 2.0
Client Secret chỉ hiện đầy đủ một lần
Mở lại chỉ thấy 4 ký tự cuối (****xxxx). SePay không lưu bản rõ. Copy ngay khi tạo. Quên thì tạo Client Secret mới (Client ID giữ nguyên).

Tiếp theo
Bảo mật: HTTPS, whitelist IP, chống replay
Tích hợp webhook: payload, phản hồi hợp lệ, chống trùng lặp
Xử lý lỗi: retry, chẩn đoán
