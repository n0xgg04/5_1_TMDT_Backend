# Customer Engagement Specification

## Purpose

Define wishlist, reviews, customer support chat, public review display, and customer-facing engagement behavior.

## Requirements

### Requirement: Anonymous And Authenticated Wishlist

The system SHALL support saved room types for both authenticated users and anonymous browser sessions.

#### Scenario: Save room type as authenticated user

- **GIVEN** an authenticated user
- **AND** the room type exists
- **WHEN** `/wishlist` is posted with `roomTypeId`
- **THEN** the system SHALL upsert a wishlist row by `(userId, roomTypeId)`
- **AND** avoid creating duplicates.

#### Scenario: Save room type as anonymous session

- **GIVEN** no authenticated user
- **AND** `x-session-id` is present
- **AND** the room type exists
- **WHEN** `/wishlist` is posted with `roomTypeId`
- **THEN** the system SHALL upsert a wishlist row by `(sessionId, roomTypeId)`.

#### Scenario: Save without user or session

- **GIVEN** no authenticated user and no `x-session-id`
- **WHEN** a wishlist save is requested
- **THEN** the API SHALL reject the request with `Thiếu userId hoặc sessionId`.

#### Scenario: Save missing room type

- **GIVEN** the room type id does not exist
- **WHEN** wishlist save is requested
- **THEN** the API SHALL reject the request with `Loại phòng không tồn tại`.

#### Scenario: Remove saved room type for user

- **GIVEN** an authenticated user
- **WHEN** `/wishlist/:roomTypeId` is deleted
- **THEN** all wishlist rows matching that user and room type SHALL be deleted
- **AND** the API SHALL return `Đã xóa`.

#### Scenario: Remove saved room type for session

- **GIVEN** no authenticated user
- **AND** `x-session-id` is present
- **WHEN** `/wishlist/:roomTypeId` is deleted
- **THEN** all wishlist rows matching that session and room type SHALL be deleted
- **AND** the API SHALL return `Đã xóa`.

### Requirement: Wishlist Listing

The system SHALL return saved room type cards for the current user or session.

#### Scenario: List authenticated wishlist

- **GIVEN** an authenticated user
- **WHEN** `/wishlist` is called
- **THEN** wishlist rows for that user SHALL be returned ordered newest first.

#### Scenario: List anonymous wishlist

- **GIVEN** no authenticated user
- **AND** `x-session-id` is present
- **WHEN** `/wishlist` is called
- **THEN** wishlist rows for that session SHALL be returned ordered newest first.

#### Scenario: Wishlist item shape

- **GIVEN** a saved room type exists
- **WHEN** wishlist is listed
- **THEN** each item SHALL include wishlist id, room type id, room type name, images, star rating, max guests, bed type, amenities, first active pricing rule price, and first room branch.

### Requirement: Wishlist Sync After Login

The system SHALL merge anonymous session wishlist items into the authenticated user's wishlist.

#### Scenario: Sync session wishlist

- **GIVEN** a user has logged in
- **AND** browser storage has a `hotel_session_id`
- **WHEN** `/wishlist/sync` is posted with the session id
- **THEN** every session wishlist item SHALL be upserted into the user's wishlist
- **AND** all rows for that session id SHALL be deleted
- **AND** the API SHALL return `Đã đồng bộ`.

#### Scenario: Duplicate during sync

- **GIVEN** both the user and session saved the same room type
- **WHEN** wishlist sync runs
- **THEN** only one user wishlist row SHALL remain because sync uses upsert.

### Requirement: Review Creation

The system SHALL allow customers to review a room type only through their own checked-out booking and only once per booking.

#### Scenario: Create review

- **GIVEN** an authenticated customer owns a booking
- **AND** the booking status is `CHECKED_OUT`
- **AND** no review exists for that booking
- **WHEN** `/reviews` is posted with booking id, rating, optional comment, and optional images
- **THEN** the system SHALL create a review
- **AND** set `roomTypeId` from the booking room
- **AND** default images to an empty array
- **AND** include booking in the response.

#### Scenario: Review missing booking

- **GIVEN** the booking id does not exist
- **WHEN** review creation is requested
- **THEN** the API SHALL reject the request with `Đơn đặt phòng không tồn tại`.

#### Scenario: Review another customer's booking

- **GIVEN** the authenticated user does not own the booking
- **WHEN** review creation is requested
- **THEN** the API SHALL reject the request with `Không có quyền đánh giá đơn này`.

#### Scenario: Review before checkout

- **GIVEN** the booking status is not `CHECKED_OUT`
- **WHEN** review creation is requested
- **THEN** the API SHALL reject the request with `Chỉ có thể đánh giá sau khi trả phòng`.

#### Scenario: Duplicate review

- **GIVEN** a review already exists for the booking
- **WHEN** another review is posted for the same booking
- **THEN** the API SHALL reject the request with `Đơn này đã được đánh giá`.

#### Scenario: Rating bounds

- **GIVEN** rating is below 1 or above 5
- **WHEN** review DTO validation runs
- **THEN** the API SHALL reject the request.

### Requirement: Review Eligibility

The system SHALL allow a customer to check whether they can review a room type.

#### Scenario: Can review room type

- **GIVEN** an authenticated customer has a `CHECKED_OUT` booking for a room in the room type
- **AND** that booking has no review
- **WHEN** `/reviews/can-review/:roomTypeId` is called
- **THEN** the API SHALL return `{ canReview: true, bookingId: <id> }`.

#### Scenario: Cannot review room type

- **GIVEN** no matching checked-out unreviewed booking exists
- **WHEN** review eligibility is checked
- **THEN** the API SHALL return `{ canReview: false, bookingId: null }`.

### Requirement: Public Review Display

The system SHALL expose approved room type reviews publicly.

#### Scenario: List room type reviews

- **GIVEN** approved reviews exist for a room type
- **WHEN** `/reviews/room-type/:roomTypeId?page=1&limit=10` is called
- **THEN** the API SHALL return approved reviews ordered newest first
- **AND** include customer first and last name
- **AND** return `items`, `total`, `page`, `limit`, and `avgRating`.

#### Scenario: No approved reviews

- **GIVEN** no approved reviews exist for the room type
- **WHEN** reviews are listed
- **THEN** `avgRating` SHALL be 0.

### Requirement: Customer Conversation

The system SHALL allow authenticated customers to open/reuse a support conversation and send messages.

#### Scenario: Get existing open conversation

- **GIVEN** an authenticated customer already has an open conversation
- **WHEN** `/chat/conversation` is called
- **THEN** the existing open conversation SHALL be returned with messages ordered oldest first.

#### Scenario: Create new conversation

- **GIVEN** an authenticated customer has no open conversation
- **WHEN** `/chat/conversation` is called with optional subject
- **THEN** the system SHALL create a conversation with status `open`
- **AND** return it with messages.

#### Scenario: Send message

- **GIVEN** an authenticated user
- **AND** the conversation exists
- **WHEN** `/chat/conversation/:id/messages` is posted with content
- **THEN** the system SHALL create a message with conversation id, sender id, content, `isRead=false`, and creation timestamp
- **AND** include the conversation in the response.

#### Scenario: Send message to missing conversation

- **GIVEN** the conversation id does not exist
- **WHEN** a message is posted
- **THEN** the API SHALL reject the request with `Conversation not found`.

### Requirement: Frontend Session Id

The web app SHALL create a stable anonymous session id for wishlist behavior.

#### Scenario: Session id initialization

- **GIVEN** the web app runs in a browser
- **AND** `hotel_session_id` is absent from local storage
- **WHEN** the API client initializes
- **THEN** it SHALL store a session id using current timestamp and random suffix.

#### Scenario: Session id header

- **GIVEN** `hotel_session_id` exists in local storage
- **WHEN** the web API client sends a request
- **THEN** it SHALL include header `x-session-id` with that value.
