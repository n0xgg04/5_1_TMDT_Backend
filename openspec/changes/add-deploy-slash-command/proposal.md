## Why

Repo đã có cấu hình deploy Vercel riêng cho `apps/api` và `apps/web`, nhưng chưa có slash command thống nhất để agent chạy đúng quy trình deploy cả hai ứng dụng. Thêm `/deploy` giúp thành viên gọi deployment nhanh, nhất quán và giảm rủi ro deploy thiếu API hoặc web.

## What Changes

- Thêm slash command Codex `/deploy` dưới source-of-truth repo-local để hướng agent deploy Vercel cho cả API và web.
- Chuẩn hóa quy trình deploy gồm preflight, xác định môi trường, kiểm tra Vercel CLI/auth/link, chạy build hoặc lint cần thiết, deploy API, deploy web và báo lại URL/kết quả.
- Bổ sung hướng dẫn xử lý biến môi trường quan trọng giữa API và web như `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, database và secret production.
- Cập nhật tài liệu workflow để thành viên biết cách đồng bộ prompt command vào thư mục prompt cá nhân nếu Codex chưa tự nạp prompt repo-local.
- Không thay đổi nghiệp vụ đặt phòng, endpoint API, schema database hoặc UI người dùng cuối.

## Capabilities

### New Capabilities

- Không có.

### Modified Capabilities

- `agent-workflow-tooling`: Bổ sung yêu cầu cho slash command `/deploy` và quy trình agent deploy Vercel cho cả `apps/api` và `apps/web`.

## Impact

- Ảnh hưởng các file prompt/hướng dẫn Codex trong `.codex/`.
- Có thể ảnh hưởng `.gitignore` nếu cần cho phép track thêm prompt Markdown repo-local.
- Có thể bổ sung script/package command phục vụ deploy tại root hoặc từng app, nhưng không thêm dependency runtime cho ứng dụng.
- Tác động vận hành tới Vercel projects của API và web; implementation phải tránh ghi secret vào git và phải yêu cầu/kiểm tra xác thực trước khi deploy.
