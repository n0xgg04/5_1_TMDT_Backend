# Room Inventory, Search, And Pricing Specification

## Purpose

Define hotel branch, room type, room inventory, room status, pricing rule, public search, featured room, flash-sale discovery, and public room detail behavior.

## Requirements

### Requirement: Room Type Management

The system SHALL allow admins to create, update, soft-delete, and list room types; staff may read room type data.

#### Scenario: Create room type

- **GIVEN** an authenticated admin
- **WHEN** `/rooms/types` is posted with name, max guests, area, bed type, and optional description/amenities/images
- **THEN** the system SHALL create a room type with active state enabled by default.

#### Scenario: Update room type

- **GIVEN** an authenticated admin
- **AND** the room type exists
- **WHEN** `/rooms/types/:id` is patched
- **THEN** the system SHALL update submitted fields, including optional `isActive`.

#### Scenario: Missing room type

- **GIVEN** the target room type id does not exist
- **WHEN** details, update, or delete is requested
- **THEN** the API SHALL reject the request with `Loại phòng không tồn tại`.

#### Scenario: List active room types by default

- **GIVEN** an admin or receptionist
- **WHEN** `/rooms/types` is called without `includeInactive=true`
- **THEN** the API SHALL return only active room types
- **AND** include active pricing rules ordered by priority descending
- **AND** include a room count.

#### Scenario: Include inactive room types

- **GIVEN** an admin or receptionist
- **WHEN** `/rooms/types?includeInactive=true` is called
- **THEN** the API SHALL include active and inactive room types.

#### Scenario: Soft-delete room type with no active bookings

- **GIVEN** an authenticated admin
- **AND** the room type has no bookings in `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, or `CHECKED_IN`
- **WHEN** `/rooms/types/:id` is deleted
- **THEN** the system SHALL set `isActive=false`
- **AND** return `Đã vô hiệu hóa loại phòng`.

#### Scenario: Prevent deleting room type with active bookings

- **GIVEN** the room type has at least one active booking in `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, or `CHECKED_IN`
- **WHEN** an admin deletes the room type
- **THEN** the API SHALL reject the request with `Không thể xóa loại phòng đang có đơn đặt phòng hoạt động`.

### Requirement: Room Inventory Management

The system SHALL allow admins to create/delete rooms and allow admin/receptionist/housekeeping roles to list or update room status/notes.

#### Scenario: Create room

- **GIVEN** an authenticated admin
- **AND** no room exists with the submitted `roomNumber`
- **AND** the submitted room type exists
- **WHEN** `/rooms` is posted with room number, floor, room type id, branch id, and optional notes
- **THEN** the system SHALL create the room
- **AND** return room data including room type and branch.

#### Scenario: Duplicate room number

- **GIVEN** a room already exists with the submitted room number
- **WHEN** an admin creates a room
- **THEN** the API SHALL reject the request with `Số phòng đã tồn tại`.

#### Scenario: List rooms

- **GIVEN** an admin, receptionist, or housekeeping user
- **WHEN** `/rooms` is called with optional `roomTypeId` or `floor`
- **THEN** the API SHALL return matching rooms including room type and branch
- **AND** order by floor ascending then room number ascending.

#### Scenario: Update room operational fields

- **GIVEN** an admin, receptionist, or housekeeping user
- **AND** the room exists
- **WHEN** `/rooms/:id` is patched with `status` and/or `notes`
- **THEN** the system SHALL update the submitted fields and return room data including room type and branch.

#### Scenario: Delete free room

- **GIVEN** an authenticated admin
- **AND** the room has no bookings with status `CONFIRMED` or `CHECKED_IN`
- **WHEN** `/rooms/:id` is deleted
- **THEN** the system SHALL physically delete the room
- **AND** return `Đã xóa phòng`.

#### Scenario: Prevent deleting occupied/reserved room

- **GIVEN** the room has a `CONFIRMED` or `CHECKED_IN` booking
- **WHEN** an admin deletes the room
- **THEN** the API SHALL reject the request with `Phòng đang có khách, không thể xóa`.

### Requirement: Hotel Branch Listing

The system SHALL expose active hotel branches to admin and receptionist roles.

#### Scenario: List branches

- **GIVEN** an admin or receptionist
- **WHEN** `/rooms/branches` is called
- **THEN** the API SHALL return active hotel branches ordered by province ascending.

### Requirement: Pricing Rules

The system SHALL price each room type by active date-matching pricing rules ordered by priority descending.

#### Scenario: Create pricing rule

- **GIVEN** an authenticated admin
- **AND** the room type exists
- **WHEN** `/rooms/pricing` is posted with room type, pricing type, price, optional start/end dates, and optional priority
- **THEN** the system SHALL create an active pricing rule
- **AND** store absent start/end dates as null
- **AND** default absent priority to 0.

#### Scenario: Disable pricing rule

- **GIVEN** an authenticated admin
- **AND** the pricing rule exists
- **WHEN** `/rooms/pricing/:id` is deleted
- **THEN** the system SHALL set `isActive=false`
- **AND** return `Đã vô hiệu hóa quy tắc giá`.

#### Scenario: Price for a date

- **GIVEN** a room type has one or more active rules where either both dates are null or the date falls between start and end
- **WHEN** pricing service requests price for that date
- **THEN** the rule with highest priority SHALL be selected
- **AND** its `pricePerNight` SHALL be returned as a number.

#### Scenario: Missing price rule

- **GIVEN** no active pricing rule applies to the date
- **WHEN** price calculation is requested
- **THEN** the pricing service SHALL throw an error indicating no pricing rule was found for that date.

#### Scenario: Total price across nights

- **GIVEN** check-in and check-out dates
- **WHEN** total price is calculated
- **THEN** the system SHALL calculate at least one night
- **AND** sum the selected per-night price for each night from check-in up to but not including check-out.

### Requirement: Public Room Search

The system SHALL allow anonymous users to search available concrete rooms by date range, guest count, optional branch province, room type, price, amenities, star rating, sort, and pagination.

#### Scenario: Missing required search parameters

- **GIVEN** `checkIn`, `checkOut`, or `guests` is absent
- **WHEN** `/search` is called
- **THEN** the API SHALL reject the request with `checkIn, checkOut và guests là bắt buộc`.

#### Scenario: Invalid search dates

- **GIVEN** either date cannot be parsed
- **WHEN** `/search` is called
- **THEN** the API SHALL reject the request with `Ngày không hợp lệ`.

#### Scenario: Past check-in

- **GIVEN** check-in is before the current local date at midnight
- **WHEN** `/search` is called
- **THEN** the API SHALL reject the request with `Ngày nhận phòng không thể trong quá khứ`.

#### Scenario: Check-out not after check-in

- **GIVEN** check-out is equal to or before check-in
- **WHEN** `/search` is called
- **THEN** the API SHALL reject the request with `Ngày trả phòng phải sau ngày nhận phòng`.

#### Scenario: Exclude booking conflicts

- **GIVEN** a room has a booking in `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, or `CHECKED_IN`
- **AND** the existing booking overlaps the requested range using `checkIn < requestedCheckOut` and `checkOut > requestedCheckIn`
- **WHEN** search runs
- **THEN** that room SHALL be excluded from results.

#### Scenario: Include operationally searchable room statuses

- **GIVEN** a room has no conflicting active booking
- **AND** its status is `AVAILABLE` or `DIRTY`
- **WHEN** search runs
- **THEN** the room MAY be included if all other filters pass.

#### Scenario: Exclude unavailable operational statuses

- **GIVEN** a room status is `OCCUPIED`, `CLEANING`, `MAINTENANCE`, or `RESERVED`
- **WHEN** search runs
- **THEN** the room SHALL be excluded from public search results.

#### Scenario: Guest capacity filter

- **GIVEN** a room type has `maxGuests` lower than requested guests
- **WHEN** search runs
- **THEN** rooms for that room type SHALL be excluded.

#### Scenario: Province filter

- **GIVEN** a province filter is submitted
- **WHEN** search runs
- **THEN** only rooms whose branch province equals the filter case-insensitively SHALL be considered.

#### Scenario: Amenities filter

- **GIVEN** an amenities query value such as `WiFi,TV`
- **WHEN** search runs
- **THEN** the room type amenities SHALL include every requested token case-insensitively by substring match.

#### Scenario: Star rating filter

- **GIVEN** `starRating` is submitted
- **WHEN** search runs
- **THEN** only room types whose `starRating` equals that value SHALL be included.

#### Scenario: Price range filter

- **GIVEN** `minPrice` or `maxPrice` is submitted
- **WHEN** search calculates `pricePerNight`
- **THEN** results outside the per-night range SHALL be excluded.

#### Scenario: Pricing unavailable for room type

- **GIVEN** a room type has no applicable active pricing rule
- **WHEN** search attempts to price it
- **THEN** results for that room type SHALL be skipped.

#### Scenario: Search result shape

- **GIVEN** a room passes all filters
- **WHEN** it is returned by search
- **THEN** the result SHALL include room id/number/floor, room type summary, branch summary, `pricePerNight`, `totalPrice`, and `nights`.

#### Scenario: Sort by price ascending

- **GIVEN** `sortBy=price_asc`
- **WHEN** results are sorted
- **THEN** lower `pricePerNight` results SHALL appear first.

#### Scenario: Sort by price descending

- **GIVEN** `sortBy=price_desc`
- **WHEN** results are sorted
- **THEN** higher `pricePerNight` results SHALL appear first.

#### Scenario: Sort by rating descending

- **GIVEN** `sortBy=rating_desc`
- **WHEN** results are sorted
- **THEN** higher room type star ratings SHALL appear first.

#### Scenario: Pagination

- **GIVEN** result count exceeds the requested page size
- **WHEN** search returns
- **THEN** it SHALL return `data`, `total`, `page`, and `limit`
- **AND** slice data by `(page - 1) * limit` through `page * limit`.

#### Scenario: Search cache

- **GIVEN** identical search parameters are submitted within 60 seconds
- **WHEN** Redis contains `search:<params>`
- **THEN** the cached JSON response SHALL be returned.

### Requirement: Province Discovery

The system SHALL expose a public list of active branch provinces.

#### Scenario: Get provinces

- **GIVEN** active hotel branches exist
- **WHEN** `/search/provinces` is called
- **THEN** the API SHALL return distinct province names ordered ascending.

### Requirement: Featured Rooms

The system SHALL expose public featured room type summaries for the home page.

#### Scenario: Get featured rooms

- **GIVEN** active room types exist
- **WHEN** `/search/featured` is called
- **THEN** up to 6 active room types SHALL be returned
- **AND** each item SHALL include id, name, description, images, area, bed type, max guests, first active pricing rule price, and first room branch.

### Requirement: Public Flash Sale Discovery

The system SHALL expose currently active flash sale summaries to public users.

#### Scenario: Get flash sales from search endpoint

- **GIVEN** a flash sale is active and current time is between start and end
- **WHEN** `/search/flash-sales` is called
- **THEN** up to 4 flash sale summaries SHALL be returned with room type information, discount, dates, quantity, and sold count.

#### Scenario: Get flash sales from flash-sales endpoint

- **GIVEN** a flash sale is active, current, and has `quantity > soldCount`
- **WHEN** `/flash-sales` is called
- **THEN** it SHALL be returned with its room type.

### Requirement: Public Room Type Detail

The system SHALL expose detailed public room type content, reviews, similar room types, and saved-state metadata.

#### Scenario: Get public room type detail

- **GIVEN** an active room type exists
- **WHEN** `/rooms/types/:id/public` is called
- **THEN** the API SHALL return the room type, active pricing rules, rooms with branches, room count, latest approved reviews, average rating, similar rooms, and `isSaved`.

#### Scenario: Public detail for inactive or missing room type

- **GIVEN** the room type is missing or inactive
- **WHEN** public detail is requested
- **THEN** the API SHALL reject the request with `Loại phòng không tồn tại`.

#### Scenario: Saved state for authenticated user

- **GIVEN** a user is authenticated
- **WHEN** public room type detail is requested
- **THEN** `isSaved` SHALL be true only if a wishlist row exists for that user and room type.

#### Scenario: Saved state for anonymous session

- **GIVEN** no user is authenticated
- **AND** `x-session-id` is provided
- **WHEN** public room type detail is requested
- **THEN** `isSaved` SHALL be true only if a wishlist row exists for that session and room type.

#### Scenario: Similar rooms

- **GIVEN** other active room types exist
- **WHEN** public room type detail is requested
- **THEN** up to 3 similar room type summaries SHALL be selected by same star rating or same branch province when available.

### Requirement: Public Room Type Reviews

The system SHALL expose approved reviews for a room type.

#### Scenario: Get room type reviews

- **GIVEN** the room type exists
- **WHEN** `/rooms/types/:id/reviews` is called
- **THEN** the API SHALL return approved reviews ordered newest first and average rating.
