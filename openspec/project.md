# Sapphire Stay Project Context

## Domain

Sapphire Stay is an online hotel booking system for customer self-service, hotel staff operations, and admin management. The system supports browsing room types, searching concrete available rooms by date and branch, booking, payment, manual bank-transfer approval, room operations, promotions, wishlist, reviews, customer support chat, notifications, and reports.

Primary actors:

- Customer: registers/logs in, searches rooms, saves room types, books rooms, pays, manages bookings, claims coupons, reviews completed stays, and chats with staff.
- Receptionist: manages room map/status, checks guests in/out, approves/rejects transfer bookings, manages add-on services, and handles customer conversations.
- Housekeeping: views room map and updates room cleanliness/maintenance status.
- Admin: manages users/staff, room types, rooms, pricing rules, bank transfer accounts, coupons, reports, room map, booking approval, and support conversations.
- External payment gateway: VNPay and Stripe card flows report payment outcome to the API.
- Scheduler: invokes protected cron endpoints to expire stale unpaid bookings.

## Tech Stack

- Monorepo: pnpm workspaces and Turborepo.
- Backend: NestJS 10, TypeScript, Prisma 6, PostgreSQL, JWT/passport, class-validator/class-transformer, global throttling, Swagger in non-production.
- Frontend: Next.js 16 App Router, React 19, Tailwind CSS, React Query, Zustand, axios.
- Data/infra: PostgreSQL, Upstash Redis REST with in-memory dev fallback, Resend email, VNPay, Stripe, Vercel/serverless entrypoint support.

## API Conventions

- All REST endpoints are served under `/api/v1`.
- Public endpoints are explicitly marked with `@Public()`.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`.
- Anonymous wishlist state is keyed by `x-session-id`; the web client creates and sends this header from `localStorage`.
- CORS allows configured `CORS_ORIGINS` and headers `Content-Type`, `Authorization`, `X-Requested-With`, and `x-session-id`.
- Validation uses a global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted`; unknown DTO fields are rejected.
- Error responses are normalized as `{ statusCode, timestamp, path, message }`.
- Request throttling is globally enabled at 100 requests per minute.

## Core Data Model

- `User`: account identity with role `CUSTOMER`, `RECEPTIONIST`, `HOUSEKEEPING`, or `ADMIN`, active/locked state, hashed password, and hashed refresh token.
- `HotelBranch`: active hotel location containing rooms.
- `RoomType`: commercial room category with capacity, amenities, images, policies, facilities, FAQ, star rating, and active state.
- `Room`: concrete physical room with unique `roomNumber`, floor, branch, room type, and operational status.
- `PricingRule`: active/default/seasonal/holiday price rules selected by date and priority.
- `Booking`: customer reservation for one room over a date range with lifecycle status, payment deadline, discount fields, approval fields, actual check-in/out timestamps, attachments, payment, add-ons, and optional review.
- `Payment`: one payment record per booking, with method, type, amount, gateway data, receipt image, paid/failure/refund fields, and status.
- `Coupon` and `UserCoupon`: public/admin promotional codes and user claiming/usage state.
- `FlashSale`: active percentage discount for a room type with quantity and sold count.
- `Wishlist`: saved room types by authenticated user or anonymous session.
- `Conversation` and `Message`: customer support chat state.
- `Notification`: persisted email send attempts and delivery/failure metadata.
- `OutboxEvent`: persisted domain event audit/replay table for booking-created events.

## Booking And Payment State Model

Booking statuses:

- `PENDING_PAYMENT`: booking created and waiting for payment initiation or bank-transfer receipt.
- `PAYING`: online payment has been initiated and is waiting for gateway result.
- `PENDING_APPROVAL`: customer uploaded transfer receipt and staff must approve or reject.
- `CONFIRMED`: payment success or staff approval confirmed the booking.
- `CHECKED_IN`: receptionist/admin checked the customer in; the room becomes occupied.
- `CHECKED_OUT`: receptionist/admin checked the customer out; the room becomes dirty.
- `CANCELLED`: customer cancelled a cancellable booking.
- `REJECTED`: staff rejected a receipt-based booking.
- `EXPIRED`: unpaid booking expired.

Payment statuses:

- `PENDING`: bank-transfer receipt is uploaded and waiting for review.
- `PROCESSING`: online payment has been initiated.
- `COMPLETED`: gateway/card payment succeeded or equivalent successful state.
- `FAILED`: gateway/card payment failed.
- `REFUNDED`: payment was refunded after a rejected approved/completed payment path.

Room statuses:

- `AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `RESERVED`.

## Eventing And Side Effects

- The system uses an in-process domain event bus rather than a long-lived broker consumer.
- `booking.created` is persisted to `outbox_events` and emitted through the in-process bus.
- `payment.success` confirms a pending/paying booking and emits `booking.confirmed`.
- `payment.failed` expires a pending/paying booking.
- `booking.confirmed`, `booking.cancelled`, `booking.expired`, and `checkout.completed` create notification records and optionally send email through Resend.
- Event handlers isolate errors so one failed handler does not block sibling handlers.

## Development Commands

- Install dependencies: `pnpm install`.
- Start infrastructure: `docker compose up -d postgres redis rabbitmq`.
- Generate Prisma client: `pnpm --filter @hotel/api db:generate`.
- Run migrations locally: `pnpm --filter @hotel/api db:migrate`.
- Seed data: `pnpm --filter @hotel/api db:seed`.
- Start API: `pnpm --filter @hotel/api dev`.
- Start web: `pnpm --filter @hotel/web dev`.
- Build all: `pnpm build`.

## Documentation Rules

- Specs document current implemented behavior from the codebase unless explicitly marked as a known gap or future change.
- Requirements are grouped by business capability, not by Nest module name, when a user-facing flow crosses multiple modules.
- Each behavior with state transitions, authorization, validation, or money movement should include scenarios.
- When implementation behavior differs from common hotel-system expectations, specs should describe the current behavior clearly instead of silently assuming a different policy.
