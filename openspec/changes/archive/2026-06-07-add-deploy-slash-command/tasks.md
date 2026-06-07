## 1. Prompt Source Of Truth

- [ ] 1.1 Cập nhật `.gitignore` để `.codex/prompts/*.md` và tài liệu command repo-local cần thiết có thể được version/review.
- [ ] 1.2 Tạo `.codex/prompts/deploy.md` với frontmatter `description` và `argument-hint` cho `/deploy`.
- [ ] 1.3 Trong prompt `/deploy`, định nghĩa parsing argument cho target `api`, `web`, `all` và môi trường preview/production, với preview là mặc định.

## 2. Deploy Workflow

- [ ] 2.1 Thêm hướng dẫn preflight trong prompt: kiểm tra `git status --short`, đọc package/config Vercel liên quan và xác nhận Vercel CLI/auth trước khi deploy.
- [ ] 2.2 Thêm hướng dẫn kiểm tra project link/env cho từng app, gồm secret/database của API, `CORS_ORIGINS` và `NEXT_PUBLIC_API_URL` của web, đồng thời cấm ghi secret vào git.
- [ ] 2.3 Thêm trình tự deploy deterministic: với target `all`, deploy `apps/api` trước rồi `apps/web`, chạy lệnh trong đúng app directory hoặc cwd tương đương.
- [ ] 2.4 Thêm format báo cáo kết quả gồm target, môi trường, URL Vercel, trạng thái từng app và bước còn lại khi deploy lỗi hoặc thiếu env.

## 3. Documentation And Installation Notes

- [ ] 3.1 Cập nhật hoặc thêm tài liệu command repo-local trong `.codex/` để liệt kê `/deploy` và cách sync prompt sang `~/.codex/prompts/` khi slash menu chưa refresh.
- [ ] 3.2 Đảm bảo tài liệu hiện có về OpenSpec command vẫn không trỏ tới `/opsx:*` và không làm sai mục đích của các command OpenSpec.

## 4. Validation

- [ ] 4.1 Xác minh `.codex/prompts/deploy.md` không bị ignore bằng `git check-ignore` hoặc `git status --short`.
- [ ] 4.2 Chạy kiểm tra phù hợp cho thay đổi prompt/docs, tối thiểu `openspec validate "add-deploy-slash-command" --strict`.
- [ ] 4.3 Chạy `openspec status --change "add-deploy-slash-command" --json` và xác nhận artifact `tasks` đã `done`.
