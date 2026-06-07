## ADDED Requirements

### Requirement: Vercel Deploy Slash Command
Repo SHALL provide a discoverable Codex prompt command `/deploy` for deploying Sapphire Stay services to Vercel.

#### Scenario: Người dùng gọi deploy mặc định
- **WHEN** người dùng chọn hoặc gõ `/deploy` mà không truyền target app
- **THEN** prompt SHALL hướng agent deploy cả `apps/api` và `apps/web`.
- **AND** prompt SHALL coi deploy preview là mặc định nếu người dùng không truyền rõ production.

#### Scenario: Người dùng giới hạn target deploy
- **WHEN** người dùng gọi `/deploy` với target `api`, `web` hoặc `all`
- **THEN** prompt SHALL hướng agent chỉ deploy target được yêu cầu.
- **AND** target `all` SHALL deploy cả `apps/api` và `apps/web`.

#### Scenario: Người dùng yêu cầu production
- **WHEN** người dùng gọi `/deploy` với `--prod`, `prod` hoặc `production`
- **THEN** prompt SHALL hướng agent deploy production trên Vercel.
- **AND** prompt SHALL nêu rõ môi trường production trước khi chạy lệnh deploy mạng.

### Requirement: Deploy Preflight
Prompt `/deploy` SHALL require deployment preflight checks before running Vercel deploy commands.

#### Scenario: Kiểm tra trạng thái repo trước deploy
- **WHEN** agent bắt đầu workflow `/deploy`
- **THEN** agent SHALL kiểm tra trạng thái git và các file cấu hình deploy liên quan.
- **AND** agent SHALL báo rõ nếu có thay đổi chưa commit hoặc target deploy có cấu hình thiếu.

#### Scenario: Kiểm tra Vercel CLI và project link
- **WHEN** agent chuẩn bị deploy một app
- **THEN** agent SHALL kiểm tra Vercel CLI khả dụng, trạng thái đăng nhập và project link của app đó.
- **AND** nếu thiếu đăng nhập hoặc project link, agent SHALL dừng để yêu cầu xác nhận hoặc hướng dẫn người dùng thay vì đoán project.

#### Scenario: Kiểm tra biến môi trường chính
- **WHEN** agent deploy API hoặc web
- **THEN** agent SHALL kiểm tra các biến môi trường chính cần cho target đó như database/secrets của API, `CORS_ORIGINS` của API và `NEXT_PUBLIC_API_URL` của web.
- **AND** agent SHALL không ghi secret vào git.

### Requirement: Deploy Execution Order
Prompt `/deploy` SHALL define a deterministic deploy order for multi-app deployments.

#### Scenario: Deploy cả API và web
- **WHEN** target deploy là `all`
- **THEN** agent SHALL deploy `apps/api` trước `apps/web`.
- **AND** agent SHALL dùng URL API deploy được để nhắc hoặc cập nhật cấu hình web khi `NEXT_PUBLIC_API_URL` chưa khớp.

#### Scenario: Deploy từng app trong đúng thư mục
- **WHEN** agent chạy Vercel deploy cho một app
- **THEN** agent SHALL chạy lệnh trong thư mục app tương ứng hoặc truyền cwd tương đương.
- **AND** Vercel SHALL dùng `vercel.json` của app đó.

### Requirement: Deploy Result Reporting
Prompt `/deploy` SHALL require a deployment summary after execution.

#### Scenario: Deploy hoàn tất
- **WHEN** workflow `/deploy` hoàn tất toàn bộ hoặc một phần
- **THEN** agent SHALL báo target, môi trường, URL Vercel và trạng thái của từng app.
- **AND** agent SHALL nêu các bước còn lại nếu app nào deploy lỗi hoặc cần cập nhật biến môi trường thủ công.

### Requirement: Deploy Prompt Source Of Truth
Repo SHALL keep the `/deploy` prompt command definition in a repo-local location that can be reviewed and copied to a user's Codex prompt directory.

#### Scenario: Thành viên khác clone repo
- **WHEN** thành viên khác kiểm tra cấu hình Codex của repo
- **THEN** prompt `/deploy` SHALL tồn tại dưới `.codex/prompts/`.
- **AND** prompt SHALL không bị cấu hình ignore của repo ngăn cản việc version/review.
