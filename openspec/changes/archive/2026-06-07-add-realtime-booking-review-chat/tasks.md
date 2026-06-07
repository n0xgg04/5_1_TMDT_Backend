## 1. Backend Realtime Chat

- [x] 1.1 Define chat realtime event payload types for `chat.message.created` with conversation id, booking id, customer id, staff id, message, latest message and updatedAt.
- [x] 1.2 Add a `ChatRealtimeService` in `ChatModule` to register authenticated user streams, publish message events and clean up disconnected streams.
- [x] 1.3 Add protected chat stream endpoint under `/api/v1/chat` that returns SSE/stream events for the current user.
- [x] 1.4 Harden `sendMessage` authorization so customer can send only in their own conversation and receptionist/admin can send only in staff-visible conversations.
- [x] 1.5 Update `sendMessage` to refresh conversation `updatedAt`, include conversation/customer context and publish `chat.message.created` after the message is persisted.
- [x] 1.6 Add focused backend tests or manual API verification for stream membership, unauthorized access and publish-after-create behavior.

## 2. Frontend Stream Infrastructure

- [x] 2.1 Add a fetch-based authenticated SSE/stream helper that sends the existing access token and supports cleanup on unmount.
- [x] 2.2 Add a chat realtime hook/client that parses `chat.message.created`, reconnects or reports failure, and triggers a refetch when the stream reconnects.
- [x] 2.3 Add cache merge utilities that append messages by `message.id` and update conversation list summaries without duplicates.

## 3. Customer Booking Chat UI

- [x] 3.1 Subscribe customer booking detail chat to realtime events only while booking is `PENDING_HOST_APPROVAL` and a conversation is available.
- [x] 3.2 Update the `booking-chat` React Query cache when admin/receptionist sends a message so customer sees it without reload.
- [x] 3.3 Keep fallback polling/refetch when the chat stream is unavailable and resync messages after reconnect.
- [x] 3.4 Preserve current booking actions and ensure chat realtime does not change booking status or payment availability.

## 4. Staff/Admin Reviewing Chat UI

- [x] 4.1 Subscribe staff/admin conversations pages to chat realtime events and update selected conversation detail immediately.
- [x] 4.2 Update staff/admin conversation list item, latest message and updated time from realtime events.
- [x] 4.3 Update pending booking review queue conversation summary or unread badge when a customer message arrives for a `PENDING_HOST_APPROVAL` request.
- [x] 4.4 Keep polling fallback for staff/admin when the stream is disconnected and refetch list/detail after reconnect.

## 5. Validation

- [x] 5.1 Run API typecheck/build or the nearest backend validation command for changed NestJS code.
- [x] 5.2 Run web lint/build or the nearest frontend validation command for changed Next.js code.
- [x] 5.3 Manually verify with customer and admin/receptionist sessions: customer message appears on admin side immediately, admin message appears on customer side immediately, and unauthorized users cannot receive other conversations.
- [x] 5.4 Run `openspec validate "add-realtime-booking-review-chat" --strict`.
