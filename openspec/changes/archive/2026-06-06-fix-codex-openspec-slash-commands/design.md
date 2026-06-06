## Context

Repo đã có OpenSpec skills trong `.codex/skills/openspec-*` và Codex debug xác nhận các skill này được nạp trong session. Vấn đề nằm ở lớp gọi từ TUI: người dùng cần slash command dễ gọi, còn nội dung skill hiện vẫn nhắc tới `/opsx:*`, là tên cũ và không phản ánh cách repo đang cấu hình OpenSpec.

Codex CLI hỗ trợ prompt markdown có frontmatter trong `~/.codex/prompts`. Để repo giữ được cấu hình có thể version và người dùng có slash command trong máy hiện tại, change này thêm prompt files repo-local dưới `.codex/prompts/` và đồng bộ cùng nội dung sang `~/.codex/prompts/`.

## Goals / Non-Goals

**Goals:**

- Cung cấp slash command OpenSpec rõ ràng cho các workflow chính: propose, apply, explore, sync và archive.
- Có command tổng `openspec` để người dùng có thể gọi theo dạng một entrypoint rồi truyền action.
- Giữ workflow thực thi dựa trên `openspec` CLI và các artifact path từ `openspec status --json`.
- Loại bỏ hướng dẫn `/opsx:*` sai trong skill docs repo-local.

**Non-Goals:**

- Không thay đổi code backend/frontend Sapphire Stay.
- Không tạo package/plugin marketplace mới.
- Không archive change này nếu người dùng chưa yêu cầu.

## Decisions

- Dùng prompt markdown thay vì plugin command mới. Lý do: repo hiện đã có skills, prompt markdown là lớp entrypoint nhẹ nhất để tạo slash command trong Codex mà không cần manifest/plugin install phức tạp. Phương án plugin bị loại vì cần thêm vòng enable/plugin discovery trong khi yêu cầu chỉ là gọi OpenSpec workflow.
- Tạo cả command tổng và command chuyên biệt. Lý do: command tổng `openspec` giúp người dùng có một điểm nhớ duy nhất; command chuyên biệt giúp slash menu gợi ý đúng workflow khi đã biết việc cần làm.
- Đồng bộ sang `~/.codex/prompts`. Lý do: đây là nơi máy hiện tại đã có các prompt `opsx-*`; thêm bản global giúp lệnh xuất hiện trong Codex CLI sau khi mở phiên mới, ngay cả khi repo-local prompt discovery không khả dụng ở phiên bản CLI hiện tại.
- Giữ `.codex/prompts/` trong repo. Lý do: đây là source-of-truth có thể commit, review và đồng bộ lại cho thành viên khác.

## Risks / Trade-offs

- [Risk] Codex CLI chỉ refresh slash command khi mở phiên mới -> Mitigation: báo rõ cần restart/resume phiên mới nếu slash menu chưa hiện ngay.
- [Risk] Tên command hiển thị có thể theo convention của phiên bản CLI hiện tại -> Mitigation: tạo tên file rõ ràng, có frontmatter description và command tổng để tăng khả năng khám phá.
- [Risk] Global prompt là cấu hình cá nhân, không nằm trong git -> Mitigation: giữ bản repo-local và chỉ copy global như bước cài đặt cho máy hiện tại.

## Migration Plan

1. Thêm `.codex/prompts/*.md` trong repo.
2. Cập nhật `.codex/skills/openspec-*` để không nhắc `/opsx:*`.
3. Copy prompt files sang `~/.codex/prompts/` trên máy hiện tại.
4. Kiểm tra file tồn tại và chạy `openspec validate`.
