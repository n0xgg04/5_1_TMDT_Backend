## Why

Codex trong repo hiện nạp OpenSpec dưới dạng `.codex/skills/openspec-*`, trong khi tài liệu skill vẫn hướng người dùng tới slash command `/opsx:*`. Codex CLI hiện không tự biến skill thành slash command, nên hướng dẫn này làm người dùng tưởng OpenSpec không được nạp.

## What Changes

- Giữ OpenSpec dưới dạng Codex skills, là cơ chế repo hiện đang nạp thành công.
- Chuẩn hóa tên gọi theo OpenSpec thay vì `opsx`, gồm các workflow propose/apply/explore/sync/archive.
- Cập nhật hướng dẫn trong các skill OpenSpec để không trỏ người dùng tới slash command sai tên.
- Thêm quick reference repo-local để người dùng biết gọi OpenSpec bằng `$openspec-*` hoặc ngôn ngữ tự nhiên trong Codex.
- Không thay đổi backend, frontend, API hay dữ liệu nghiệp vụ Sapphire Stay.

## Capabilities

### New Capabilities

- `agent-workflow-tooling`: Quy định cách repo cung cấp workflow Codex/OpenSpec có thể khám phá và gọi ổn định từ agent tooling.

### Modified Capabilities

- Không có.

## Impact

- Ảnh hưởng các file cấu hình/hướng dẫn Codex trong `.codex/`.
- Ảnh hưởng artifact OpenSpec của change này.
- Không thêm dependency runtime, không thay đổi API, database, hoặc hành vi người dùng cuối của ứng dụng khách sạn.
