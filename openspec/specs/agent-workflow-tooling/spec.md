# agent-workflow-tooling Specification

## Purpose
Quy định cách repo cung cấp, lưu trữ và duy trì các prompt command cho OpenSpec trong Codex, để các workflow propose/apply/explore/sync/archive có thể được gọi nhất quán và không phụ thuộc vào command cũ.
## Requirements
### Requirement: OpenSpec Slash Commands
Repo SHALL provide discoverable Codex prompt command files for OpenSpec workflows.

#### Scenario: Người dùng gọi workflow tổng
- **WHEN** người dùng chọn hoặc gõ command OpenSpec tổng từ Codex slash menu
- **THEN** prompt SHALL hướng agent phân tích action `propose`, `apply`, `explore`, `sync` hoặc `archive`
- **AND** prompt SHALL yêu cầu agent chạy `openspec` CLI theo workflow tương ứng.

#### Scenario: Người dùng gọi workflow chuyên biệt
- **WHEN** người dùng chọn command chuyên biệt cho propose, apply, explore, sync hoặc archive
- **THEN** prompt SHALL mô tả đúng workflow OpenSpec tương ứng
- **AND** prompt SHALL dùng `openspec status --json`, `openspec instructions`, artifact paths và context files thay vì giả định path cố định.

### Requirement: Repo-Local Source Of Truth
Repo SHALL keep OpenSpec prompt command definitions in a repo-local location that can be reviewed and copied to a user's Codex prompt directory.

#### Scenario: Thành viên khác clone repo
- **WHEN** thành viên khác kiểm tra cấu hình Codex của repo
- **THEN** các prompt OpenSpec SHALL tồn tại dưới `.codex/prompts/`
- **AND** nội dung SHALL đủ để đồng bộ sang `~/.codex/prompts/` mà không cần viết lại thủ công.

### Requirement: Không Trỏ Tới Command Cũ
OpenSpec skill documentation SHALL NOT direct users to obsolete `/opsx:*` slash commands.

#### Scenario: Skill propose hoàn tất artifacts
- **WHEN** skill propose tạo xong artifact
- **THEN** nội dung hướng dẫn tiếp theo SHALL dùng tên OpenSpec mới hoặc ngôn ngữ tự nhiên
- **AND** nội dung SHALL NOT nhắc `/opsx:apply`.

#### Scenario: Skill apply chọn change
- **WHEN** skill apply hướng dẫn override change
- **THEN** ví dụ override SHALL dùng tên command OpenSpec mới hoặc tên skill tương ứng
- **AND** nội dung SHALL NOT nhắc `/opsx:apply`.
