## Context

Repo Sapphire Stay là monorepo pnpm/Turborepo với hai ứng dụng deploy riêng trên Vercel: `apps/api` dùng NestJS serverless và `apps/web` dùng Next.js. Mỗi app đã có `vercel.json`; API có script `vercel-build`, script chuẩn bị output serverless và helper `push-env.js`, còn web đọc `NEXT_PUBLIC_API_URL` để gọi backend.

Repo cũng đã có cơ chế slash command Codex dạng prompt Markdown trong `.codex/prompts/`, nhưng các file Markdown dưới `.codex/` hiện không được `git ls-files` theo dõi do `.gitignore` ignore rộng `**/*.md`. Vì `/deploy` cần là source-of-truth repo-local giống các command OpenSpec, implementation phải đảm bảo prompt mới có thể được track/review thay vì chỉ tồn tại local.

## Goals / Non-Goals

**Goals:**

- Cung cấp slash command `/deploy` để agent deploy cả `apps/api` và `apps/web` lên Vercel trong một workflow thống nhất.
- Mặc định deploy cả hai app; cho phép giới hạn target `api`, `web` hoặc `all` khi người dùng truyền argument.
- Tránh production deploy vô tình bằng cách xem preview là mặc định và chỉ deploy production khi người dùng truyền rõ `--prod`, `prod` hoặc `production`.
- Kiểm tra preflight trước deploy: trạng thái git, dependency/package context, Vercel CLI/auth/link, biến môi trường chính và các lệnh kiểm tra phù hợp.
- Báo kết quả rõ ràng gồm target đã deploy, môi trường, URL Vercel trả về, lỗi còn lại và bước cần làm thủ công nếu thiếu secret hoặc project link.

**Non-Goals:**

- Không tự tạo Vercel project, database, domain hoặc secret production khi chưa có xác nhận của người dùng.
- Không thay đổi runtime nghiệp vụ, endpoint API, schema Prisma hoặc UI.
- Không lưu token, secret hoặc URL nhạy cảm mới vào git.
- Không thay thế CI/CD đầy đủ; slash command là workflow agent-local để deploy chủ động.

## Decisions

- Dùng prompt Markdown `.codex/prompts/deploy.md` làm slash command. Lựa chọn này khớp pattern hiện có của OpenSpec prompt commands, không cần plugin/manifest mới và giúp command xuất hiện qua tên file `/deploy`. Phương án thêm package CLI riêng bị loại vì yêu cầu hiện tại là slash command agent, không phải tool runtime.
- Prompt `/deploy` sẽ hướng agent chạy deploy trong từng app directory thay vì từ root. API và web có `vercel.json` riêng, nên chạy từ `apps/api` và `apps/web` giúp Vercel CLI dùng đúng project link, build command và cấu hình vùng.
- Preview là mặc định; production cần argument rõ. Điều này giảm rủi ro khi người dùng gọi `/deploy` trong lúc đang thử nghiệm, nhưng vẫn hỗ trợ deploy production nhanh bằng `/deploy --prod`.
- Thứ tự deploy mặc định là API trước, web sau. Web cần `NEXT_PUBLIC_API_URL` trỏ tới API đã deploy; nếu API URL thay đổi trong preview, agent phải nhắc người dùng cập nhật env hoặc tự set env chỉ khi được xác nhận.
- Preflight dùng kiểm tra nhẹ trước deploy: `git status --short`, đọc package/config liên quan, xác nhận Vercel CLI đăng nhập, kiểm tra app đã link Vercel, chạy typecheck/lint hiện có và test API khi phù hợp. Nếu cần network hoặc ghi cấu hình ngoài repo, agent phải xin quyền theo cơ chế sandbox/approval.
- Cập nhật `.gitignore` để cho phép track source-of-truth prompt/hướng dẫn `.codex` cần thiết. Nếu không làm bước này, `/deploy` có thể hoạt động trên máy hiện tại nhưng không được commit cho các thành viên khác.

## Risks / Trade-offs

- [Risk] Vercel CLI chưa đăng nhập hoặc app chưa link project → Mitigation: prompt yêu cầu kiểm tra `vercel whoami` và link trong từng app; nếu thiếu thì dừng với hướng dẫn/approval thay vì đoán.
- [Risk] Web preview gọi sai API vì `NEXT_PUBLIC_API_URL` chưa trỏ tới API preview/production tương ứng → Mitigation: workflow phải kiểm tra và báo biến env cần cập nhật trước hoặc ngay sau API deploy.
- [Risk] Production deploy ngoài ý muốn → Mitigation: mặc định preview, production chỉ khi argument rõ ràng và summary phải nêu môi trường trước khi chạy lệnh mạng.
- [Risk] Prompt repo-local tiếp tục bị ignore → Mitigation: task implementation phải cập nhật `.gitignore` hoặc track prompt bằng cách phù hợp, rồi xác nhận bằng `git check-ignore`/`git status`.
- [Risk] Deploy API và web thành công lệch nhau một phần → Mitigation: summary phải liệt kê trạng thái từng target và giữ URL/error riêng để người dùng rollback hoặc deploy lại target lỗi.

## Migration Plan

1. Thêm `.codex/prompts/deploy.md` với frontmatter, argument hint và workflow deploy cả API/web.
2. Cập nhật tài liệu prompt command repo-local để liệt kê `/deploy`.
3. Điều chỉnh `.gitignore` để prompt Markdown trong `.codex/prompts/` và tài liệu `.codex` cần thiết có thể được version.
4. Nếu cần, thêm hoặc chuẩn hóa scripts deploy trong `package.json` nhưng không bắt buộc nếu prompt đã gọi Vercel CLI trực tiếp trong từng app.
5. Validate OpenSpec, kiểm tra file prompt không bị ignore và chạy các kiểm tra project phù hợp.

Rollback khi implementation gây lỗi chỉ cần gỡ prompt `/deploy`, hoàn nguyên thay đổi `.gitignore`/docs liên quan và không ảnh hưởng runtime ứng dụng.

## Open Questions

- Có cần copy prompt sang `~/.codex/prompts/` trong implementation để slash command xuất hiện ngay trên máy hiện tại, hay chỉ giữ repo-local và hướng dẫn người dùng sync thủ công?
