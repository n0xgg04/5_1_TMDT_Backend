## Why

Giao diện hiện tại vận hành được nhưng cảm giác còn cứng, thiên về dashboard/template hơn là một sản phẩm đặt phòng khách sạn thương mại. Cần rework UI để customer cảm nhận rõ giá trị lưu trú, dễ ra quyết định đặt phòng hơn, đồng thời admin/staff vẫn có bề mặt thao tác chuyên nghiệp và dễ scan.

## What Changes

- Rework trải nghiệm customer-facing gồm homepage, search/listing, room detail, booking flow, my bookings và notification/booking dialog để có cảm giác khách sạn cao cấp hơn.
- Chuẩn hóa visual direction: typography, spacing, image treatment, section rhythm, CTA hierarchy, trạng thái phòng/ngày/booking và các empty/loading/error states.
- Nâng các màn admin/staff từ card-heavy generic UI sang giao diện vận hành rõ ràng, dense vừa đủ, có phân cấp trạng thái tốt cho booking, phòng, pricing, coupon và report.
- Tạo lại shared UI surface cho form tìm phòng, room card, price summary, booking status panels, availability calendar, modal/dialog quan trọng và dashboard tables.
- Giữ nguyên nghiệp vụ hiện có: host approval booking flow, availability calendar, admin features, payment-after-approval, notification và chat không đổi API contract trừ khi cần dữ liệu presentation tối thiểu.
- Không thêm breaking change vào API; ưu tiên refactor frontend component/CSS và dùng dữ liệu hiện có.

## Capabilities

### New Capabilities

- `commercial-hotel-ui`: Chuẩn trải nghiệm giao diện thương mại cho customer, admin và staff của hệ thống khách sạn.

### Modified Capabilities

Không có. Các capability nghiệp vụ hiện có vẫn giữ nguyên requirement; change này bổ sung capability trình bày/UX bao phủ nhiều màn hình.

## Impact

- Frontend: `apps/web/src/app/page.tsx`, `rooms`, `rooms/[id]`, `booking`, `my-bookings`, admin/staff pages, `navbar`, `sidebar`, shared UI components và Tailwind/global styling.
- Visual assets: tận dụng ảnh khách sạn/phòng hiện có từ dữ liệu và fallback ảnh chất lượng cao; không dùng SVG/gradient hero thay cho ảnh thật.
- Backend/API: không dự kiến thay đổi API; chỉ phát sinh nếu frontend cần field presentation nhỏ đã có thể lấy từ endpoint hiện tại.
- Validation: chạy lint/typecheck, web build, focused manual verification desktop/mobile cho homepage, search, room detail, booking conflict dialog, admin dashboard và staff booking calendar.
