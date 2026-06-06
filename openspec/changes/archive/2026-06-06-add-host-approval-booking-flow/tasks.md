## 1. Data Model And Migration

- [x] 1.1 Add `PENDING_HOST_APPROVAL` to `BookingStatus` in Prisma schema and regenerate Prisma client.
- [x] 1.2 Add `approvalDeadline` to `Booking`; make `paymentDeadline` nullable or backfill it so pending approval bookings do not imply payment eligibility.
- [x] 1.3 Add notification read-state fields needed by in-app notifications, such as `readAt`, while preserving existing email notification data.
- [x] 1.4 Add or update migration SQL for booking status, approval deadline, payment deadline handling, notification read state and any indexes for approval/payment expiry queries.
- [x] 1.5 Update shared frontend/backend TypeScript types and status badges to include `PENDING_HOST_APPROVAL`.

## 2. Booking Lifecycle Backend

- [x] 2.1 Update `createBooking` to create `PENDING_HOST_APPROVAL`, set `approvalDeadline=now+24h`, skip coupon consumption and emit `booking.request.created`.
- [x] 2.2 Update active overlap checks to include non-expired `PENDING_HOST_APPROVAL` plus existing active booking statuses.
- [x] 2.3 Add service/controller endpoints for `GET /bookings/staff/approval-requests`, `POST /bookings/:id/approve-request` and `POST /bookings/:id/reject-request`.
- [x] 2.4 Implement request approval: validate role, status, approval deadline and conflicts; set `PENDING_PAYMENT`, `approvedById`, `approvedAt`, `paymentDeadline=now+30m` with max 2h.
- [x] 2.5 Implement request rejection: set `REJECTED`, persist reason/staff id and emit `booking.request.rejected`.
- [x] 2.6 Keep receipt approval distinct from request approval and update receipt upload to reject `PENDING_HOST_APPROVAL` with `Đơn chưa được duyệt để thanh toán`.
- [x] 2.7 Update cancellation and idempotent confirmation/expiry logic for `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT` and `PAYING`.
- [x] 2.8 Update cron expiry query to process both approval deadline and payment deadline cases.

## 3. Payment And Coupon Backend

- [x] 3.1 Update payment initiate DTO/controller to accept optional `couponCode` for VNPay, bank transfer and other online methods.
- [x] 3.2 Guard all payment initiation paths so `PENDING_HOST_APPROVAL` bookings cannot be paid and only approved `PENDING_PAYMENT` bookings can proceed.
- [x] 3.3 Move coupon apply/usage logic out of booking creation and into payment initiation.
- [x] 3.4 Implement coupon reservation at payment initiation and persist booking `couponCode`, `discountAmount` and final payment amount.
- [x] 3.5 Release coupon reservation idempotently on payment failed, booking cancellation and booking payment expiry.
- [x] 3.6 Update Stripe payment intent creation to use approved booking state, optional coupon and final amount after discount.
- [x] 3.7 Ensure payment success confirms booking, sets room `RESERVED` and emits existing confirmation notification events.

## 4. Notifications And Realtime

- [x] 4.1 Extend notification event types/templates for `booking.request.approved`, `booking.request.rejected`, `booking.approval.expired` and `booking.payment.expired`.
- [x] 4.2 Persist in-app notifications with booking id/code, deadline, reason and unread state.
- [x] 4.3 Add `GET /notifications/me` with pagination/newest-first filtering by current user.
- [x] 4.4 Add `PATCH /notifications/:id/read` with ownership checks.
- [x] 4.5 Add `GET /notifications/stream` SSE endpoint for authenticated users and publish new notifications to connected user streams.
- [x] 4.6 Keep notification creation resilient: DB persistence must succeed independently of email/SSE delivery failures.

## 5. Booking Chat

- [x] 5.1 Update chat service to get or create a conversation by `bookingId` and `customerId`.
- [x] 5.2 Add customer endpoint to open booking chat only for owned `PENDING_HOST_APPROVAL` bookings.
- [x] 5.3 Add staff/admin endpoint or queue action to open booking chat and assign current staff when unassigned.
- [x] 5.4 Ensure sending chat messages does not change booking status.

## 6. Customer Frontend

- [x] 6.1 Update booking page so submit creates a request-to-book and does not immediately show payment controls.
- [x] 6.2 Move coupon UI from booking creation into the payment step shown only after approval.
- [x] 6.3 Update my bookings and booking detail pages to show `PENDING_HOST_APPROVAL`, approval deadline, approved payment deadline and rejection/expiry reasons.
- [x] 6.4 Add notification bar/dropdown that reads `/notifications/me`, opens SSE stream when possible and falls back to polling.
- [x] 6.5 Add notification actions so approved booking notifications route the user to payment.
- [x] 6.6 Add booking-linked chat UI for customer bookings in `PENDING_HOST_APPROVAL`.

## 7. Staff And Admin Frontend

- [x] 7.1 Update staff/admin pending bookings page to use request approval queue and labels for “Duyệt yêu cầu đặt chỗ”.
- [x] 7.2 Show room status, overlap/conflict signal, customer summary, special requests, approval deadline and conversation summary in each pending request item.
- [x] 7.3 Add approve/reject actions against request approval endpoints and refresh queue/status summaries after success.
- [x] 7.4 Add chat action from each pending request item.
- [x] 7.5 Keep receipt approval UI separate from request approval UI so staff can distinguish “duyệt yêu cầu” and “duyệt biên lai”.
- [x] 7.6 Update admin dashboard/reporting labels to distinguish chờ duyệt yêu cầu, chờ thanh toán, confirmed, rejected and expired.

## 8. Validation And Tests

- [x] 8.1 Add backend tests for create booking, approval, rejection, approval expiry and payment expiry state transitions.
- [x] 8.2 Add backend tests proving payment cannot start before approval and can start after approval within deadline.
- [x] 8.3 Add backend tests for coupon reservation and release on payment failed/cancel/expire.
- [x] 8.4 Add backend tests for notification ownership, read marking and realtime/polling-safe notification creation.
- [x] 8.5 Add frontend tests or focused manual verification for customer request flow, notification bar, payment-after-approval and staff approval queue.
- [x] 8.6 Run `pnpm --filter @hotel/api db:generate`, relevant API/web test suites, lint/build checks and `openspec validate add-host-approval-booking-flow --strict`.

## Validation Notes

- 2026-06-07: `pnpm --filter @hotel/api db:generate` passed.
- 2026-06-07: `pnpm --filter @hotel/api build` passed.
- 2026-06-07: `pnpm --filter @hotel/web exec next build --webpack` passed. The default Turbopack build is avoided in this sandbox because it attempts a port bind.
- 2026-06-07: `pnpm test` passed through Turbo, running the API unit suite with 10 tests.
- 2026-06-07: `pnpm lint` passed through Turbo. The package lint scripts currently run TypeScript no-emit checks because the repo has no ESLint config and `next lint` is no longer valid in this Next.js version.
- 2026-06-07: `openspec validate add-host-approval-booking-flow --strict` passed.
