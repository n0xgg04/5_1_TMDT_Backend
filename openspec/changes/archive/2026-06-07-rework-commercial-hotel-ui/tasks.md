## 1. Visual Foundations

- [x] 1.1 Audit current customer, admin, and staff UI surfaces to identify shared layout, spacing, status, and card patterns that need rework.
- [x] 1.2 Update global visual foundations in the web app, including page background, typography scale, spacing rhythm, focus states, and responsive container behavior.
- [x] 1.3 Refine shared UI primitives for buttons, cards, badges, form controls, dialogs, empty states, loading states, and status surfaces without changing API contracts.
- [x] 1.4 Add or refactor reusable hotel commerce components for section headings, search surfaces, room cards, price summaries, policy blocks, and state panels.
- [x] 1.5 Define consistent status presentation for booking states, including pending host approval, pending payment, confirmed, cancelled, expired, and conflict/error states.

## 2. Customer Homepage

- [x] 2.1 Rework the homepage first viewport into a photo-led commercial hotel experience with the booking search engine as the primary action.
- [x] 2.2 Ensure the homepage hero leaves a visible hint of the next section on common mobile, tablet, and desktop viewport sizes.
- [x] 2.3 Add commercial discovery sections for featured rooms, destinations or branches, offers, service signals, and trust signals using real room/place imagery where available.
- [x] 2.4 Rework homepage responsive behavior so search controls, imagery, text, and calls to action do not overlap or resize unpredictably.

## 3. Customer Search And Discovery

- [x] 3.1 Rework the rooms/search page header to clearly show destination, dates, guests, availability context, and editable search controls.
- [x] 3.2 Rework room listing cards to show image, room identity, location or branch, capacity, amenities, price, availability status, and primary booking action in a scannable layout.
- [x] 3.3 Improve filters and sorting for desktop and mobile so they feel like hotel ecommerce controls instead of generic dashboard filters.
- [x] 3.4 Improve loading, empty, and error states for room discovery with clear next actions that preserve the booking intent.
- [x] 3.5 Validate that selecting unavailable or conflicting dates presents a clear blocking message before checkout/request submission.

## 4. Room Detail And Booking Journey

- [x] 4.1 Rework room detail pages with a photo gallery, room highlights, amenities, policies, location, and review/support sections arranged as a conversion surface.
- [x] 4.2 Rework the room detail booking panel to keep date, guest, availability, price, discount, and request/payment actions clear across responsive layouts.
- [x] 4.3 Rework booking request and checkout presentation to clearly explain the request-to-book lifecycle and payment-after-approval step.
- [x] 4.4 Replace small booking conflict popups with a large centered dialog that explains the unavailable date range and gives clear recovery actions.
- [x] 4.5 Rework customer booking list/detail screens to show current status, next action, deadlines, payment availability, cancellation, and support/chat entry points.
- [x] 4.6 Rework customer notification surfaces so important approval/payment/expiry events appear as prominent in-app dialogs or notification center entries.

## 5. Admin And Staff Operations

- [x] 5.1 Rework the admin shell and dashboard into a quiet operational interface with dense KPI summaries, status queues, and booking health indicators.
- [x] 5.2 Rework admin booking review screens to distinguish pending approval from pending payment and support availability checks, customer chat, approval, and rejection actions.
- [x] 5.3 Rework admin management pages for rooms, room types, pricing, coupons, staff, and reports with consistent table, form, filter, and bulk-action patterns.
- [x] 5.4 Rework staff calendar and booking schedule surfaces so room occupancy, conflicts, blocked dates, and booking states are visible in a calendar-first operational view.
- [x] 5.5 Ensure admin and staff destructive/status-changing actions are visually distinct, confirmable, and do not rely only on color.

## 6. Responsive And Accessibility QA

- [x] 6.1 Check key customer routes on mobile, tablet, and desktop for text overflow, overlapping UI, unstable card heights, and broken image aspect ratios.
- [x] 6.2 Check key admin and staff routes on mobile and desktop for dense but readable tables, calendars, dialogs, and action bars.
- [x] 6.3 Verify keyboard navigation, visible focus states, dialog focus handling, form labels, contrast, and non-color status cues.
- [x] 6.4 Scan CSS and Tailwind color usage to avoid a one-note palette and keep customer UI distinct from admin/staff operational UI.

## 7. Validation

- [x] 7.1 Run the relevant web lint/type checks for changed frontend files.
- [x] 7.2 Build the web app successfully after the UI rework.
- [x] 7.3 Manually verify homepage, rooms, room detail, booking conflict dialog, customer bookings, admin dashboard, admin booking review, and staff calendar flows.
- [x] 7.4 Run `openspec validate rework-commercial-hotel-ui --strict` and resolve any issues.
