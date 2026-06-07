## Context

Frontend hiện tại đã có đầy đủ luồng chính: tìm phòng, xem chi tiết phòng, kiểm tra lịch trống/bận, gửi yêu cầu đặt, chờ duyệt, thanh toán sau duyệt, thông báo realtime, staff calendar và admin management. Vấn đề nằm ở cảm giác sản phẩm: nhiều màn đang giống template dashboard/card-heavy, hero/search chưa đủ thuyết phục như một website khách sạn thương mại, còn admin/staff thiếu nhịp thị giác để xử lý nhiều trạng thái booking/phòng nhanh.

Ràng buộc chính:

- Không phá API contract và không thay đổi nghiệp vụ đã hoàn thiện.
- Dùng stack hiện có: Next.js App Router, Tailwind CSS, React Query, Zustand, lucide icons.
- Website khách sạn phải dùng ảnh thật hoặc ảnh fallback chất lượng cao; không dùng hero gradient/SVG thuần.
- Admin/staff cần thực dụng, dense vừa đủ, không biến thành landing page.
- Text phải không tràn ở mobile/desktop; các block calendar, card phòng, button, modal cần kích thước ổn định.

## Goals / Non-Goals

**Goals:**

- Tạo visual direction thương mại hơn cho Sapphire Stay: ảnh lớn, typography tự tin, màu sắc khách sạn tinh tế, CTA rõ, ít cảm giác “form demo”.
- Nâng homepage thành trải nghiệm đặt phòng ngay từ first viewport: brand rõ, ảnh khách sạn thật, search engine nổi bật, gợi ý ưu đãi/phòng/địa điểm được trình bày như ecommerce travel.
- Rework search/listing và room detail để user nhanh chóng hiểu phòng nào phù hợp, ngày nào đặt được, giá trị phòng nằm ở đâu và CTA tiếp theo là gì.
- Rework booking flow để thông tin đặt phòng, trạng thái chờ duyệt, mã giảm giá sau duyệt, dialog conflict và price summary có phân cấp rõ hơn.
- Nâng admin/staff UI thành bề mặt vận hành chuyên nghiệp: tables/grids dễ scan, filter cố định rõ, status color nhất quán, action không lẫn giữa duyệt yêu cầu và duyệt biên lai.
- Chuẩn hóa shared UI components/tokens để implementation không vá từng màn lẻ tẻ.

**Non-Goals:**

- Không thay đổi database schema, booking lifecycle, payment lifecycle hoặc notification lifecycle.
- Không thêm UI library lớn hoặc dependency animation nặng.
- Không làm lại toàn bộ backend API.
- Không tạo marketing-only landing page bỏ qua chức năng đặt phòng.
- Không thay đổi copy nghiệp vụ quan trọng như deadline duyệt 24h, payment deadline, trạng thái booking.

## Decisions

### Decision 1: Photo-led commercial direction thay vì gradient/card-heavy hero

Homepage sẽ dùng ảnh khách sạn/phòng làm tín hiệu đầu tiên, với overlay vừa đủ để chữ đọc được. Search engine đặt trong first viewport, giống booking commerce flow, nhưng không che mất hero và vẫn để lộ phần nội dung kế tiếp.

Alternative considered: giữ hero hiện tại và chỉ đổi màu/spacing. Không chọn vì vấn đề chính là cảm giác “cứng”, cần thay đổi composition và hierarchy, không chỉ token.

### Decision 2: Tạo shared presentation primitives trước khi sửa page

Thay vì chỉnh từng page rời rạc, implementation sẽ nâng shared primitives:

- Button variants và focus state.
- Card/surface radius/shadow theo vai trò: room card, admin panel, dialog, tool surface.
- Status chips cho booking/payment/availability.
- Search surface/form field layout.
- Section header và page header.
- Empty/loading/error states.

Alternative considered: chỉnh trực tiếp từng page. Không chọn vì dễ lệch style giữa homepage, search, room detail, admin và staff.

### Decision 3: Customer UI dùng ecommerce hotel patterns, không SaaS dashboard patterns

Customer pages sẽ ưu tiên:

- Ảnh lớn có tỷ lệ ổn định.
- Room card có giá, điểm nổi bật, availability/guest capacity, CTA rõ.
- Search/listing có filter sidebar/drawer có cấu trúc, result header có context ngày/khách/khu vực.
- Room detail có gallery, sticky booking panel, calendar availability, policy/review/location được trình bày như nội dung hỗ trợ quyết định mua.
- Booking page có step/status surface rõ: gửi yêu cầu, chờ duyệt, thanh toán sau duyệt.

Alternative considered: giữ layout card đều nhau trên mọi section. Không chọn vì hotel commerce cần nội dung ảnh và quyết định giá/phòng nổi bật hơn.

### Decision 4: Admin/staff UI quiet, dense và work-focused

Admin/staff không dùng style landing page. Những màn này sẽ tập trung vào:

- Header có KPI/action chính.
- Filter toolbar rõ ràng.
- Table/grid với column width ổn định.
- Badge trạng thái nhất quán.
- Action theo status, không để user nhầm duyệt yêu cầu booking với duyệt biên lai.
- Calendar staff có scroll ngang kiểm soát, text truncate, màu block phân biệt nhưng không quá sặc sỡ.

Alternative considered: làm admin đẹp theo kiểu card lớn/illustrative. Không chọn vì admin/staff cần scan nhanh và thao tác lặp lại.

### Decision 5: Không thêm dependency cho animation hoặc date picker trong change này

Tailwind, CSS transitions và input date hiện có đủ cho scope này. Nếu cần calendar picker custom, sẽ làm sau khi UI baseline ổn định.

Alternative considered: thêm component library/date-picker. Không chọn vì rủi ro dependency, styling mismatch và scope phình lớn.

## Risks / Trade-offs

- [Risk] Rework nhiều page dễ tạo style lệch hoặc regress responsive. → Mitigation: chỉnh shared primitives trước, sau đó áp dụng theo từng nhóm page; chạy web build và kiểm tra desktop/mobile các route trọng điểm.
- [Risk] Commercial UI có thể quá “marketing” và làm chậm thao tác đặt phòng. → Mitigation: first viewport vẫn đặt search engine làm hành động chính; không tạo landing-only page.
- [Risk] Admin/staff bị kéo theo style customer quá trang trí. → Mitigation: giữ admin/staff palette yên, layout dense, không dùng hero/card decorative cho các màn vận hành.
- [Risk] Ảnh fallback bên ngoài có thể tải chậm hoặc không ổn định. → Mitigation: dùng ảnh hiện có từ dữ liệu trước, fallback chỉ cho thiếu ảnh; giữ aspect ratio để tránh layout shift.
- [Risk] Existing status labels đã nhiều trạng thái, dễ sai màu/label. → Mitigation: centralize status chip mapping và kiểm tra các status mới như `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT`, `PENDING_APPROVAL`.

## Migration Plan

1. Chuẩn hóa tokens/shared components: button, card/surface, badge/status chip, section header, search surface, empty/loading states.
2. Rework customer shell: navbar, homepage, search/listing.
3. Rework room detail và booking flow: gallery, sticky booking panel, availability calendar, conflict dialog, booking summary.
4. Rework account surfaces: my bookings, booking detail, notifications/coupons/profile summary nếu liên quan trực tiếp tới booking journey.
5. Rework admin/staff surfaces: sidebar polish, dashboard, bookings, room management, pricing/coupons, staff booking calendar.
6. Validate: `pnpm lint`, web build, focused manual screenshots/checks desktop/mobile. API build chỉ cần nếu có backend touch.

Rollback strategy: vì change chủ yếu ở frontend, có thể rollback theo page/component nhóm. Không có migration database.

## Open Questions

- Có muốn giữ tên thương hiệu `Sapphire Stay` hay đổi brand/copy theo tên dự án tiếng Việt?
- Có bộ ảnh khách sạn/phòng chính thức không, hay tiếp tục dùng ảnh từ dữ liệu seed và fallback Unsplash?
- Có yêu cầu dark mode không? Mặc định scope này không làm dark mode để giữ tiến độ.
