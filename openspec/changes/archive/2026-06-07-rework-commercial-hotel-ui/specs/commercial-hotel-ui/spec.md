## ADDED Requirements

### Requirement: Customer Commercial First View

Web app SHALL present the customer-facing first viewport as a commercial hotel booking experience, not a generic dashboard or static marketing-only page.

#### Scenario: Homepage first viewport
- **WHEN** customer opens the homepage on desktop or mobile
- **THEN** the first viewport SHALL show Sapphire Stay as the primary brand signal
- **AND** SHALL use a real hotel/room/travel image as the dominant visual asset
- **AND** SHALL expose the room search action for check-in, check-out, guests and location without requiring navigation to another page.

#### Scenario: Hero leaves next content visible
- **WHEN** customer views the homepage at common mobile and desktop viewport sizes
- **THEN** the hero/search area SHALL leave a visible hint of the next commercial content section
- **AND** SHALL NOT trap the entire viewport in an oversized decorative card.

#### Scenario: Homepage commercial sections
- **WHEN** customer scrolls below the first viewport
- **THEN** the page SHALL present hotel-commerce content such as featured stays, destinations, offers, trust/service signals or room categories
- **AND** each section SHALL have a clear action or browsing path toward search, room detail or booking.

### Requirement: Customer Search And Room Discovery

Web app SHALL make search results and room discovery feel like a hotel ecommerce flow with clear pricing, availability, room value and decision actions.

#### Scenario: Search result context
- **WHEN** customer views search results
- **THEN** the page SHALL show the selected date range, guest count and location context near the result controls
- **AND** SHALL keep filter/sort controls easy to scan without pushing results too far down the page.

#### Scenario: Commercial room cards
- **WHEN** room results or featured rooms render
- **THEN** each room card SHALL include a stable image area, room name, location or branch context, capacity/highlights, price and primary action
- **AND** text SHALL truncate or wrap cleanly without overlapping adjacent content on mobile or desktop.

#### Scenario: Empty result guidance
- **WHEN** no rooms match the selected filters or date range
- **THEN** the UI SHALL show a polished empty state with a clear next action such as changing dates, clearing filters or searching another area.

### Requirement: Room Detail Conversion Surface

Room detail UI SHALL help customer evaluate the room and continue booking with a clear, trustworthy conversion surface.

#### Scenario: Room detail above the fold
- **WHEN** customer opens a room detail page
- **THEN** the page SHALL show a high-quality gallery or main image, room name, rating/review signal, location and key amenities before secondary details
- **AND** SHALL provide a visible booking action with selected dates and guests.

#### Scenario: Booking panel with availability
- **WHEN** customer edits dates or room selection on room detail
- **THEN** the booking panel SHALL show availability/calendar feedback in the same decision area
- **AND** days or ranges that cannot be booked SHALL be visually distinct from available days.

#### Scenario: Policy and review support
- **WHEN** customer reviews room policies, location or reviews
- **THEN** those sections SHALL support the booking decision without looking like unrelated cards
- **AND** SHALL preserve readable spacing and hierarchy on mobile.

### Requirement: Booking Journey Presentation

Booking UI SHALL clearly distinguish request-to-book, waiting for host/admin approval, waiting for payment and confirmed booking states.

#### Scenario: Request booking page
- **WHEN** customer reaches the booking page before host/admin approval
- **THEN** the page SHALL clearly state that payment is not required yet
- **AND** SHALL present contact/guest details, stay summary and submit action with commercial visual hierarchy.

#### Scenario: Conflict dialog
- **WHEN** selected dates become unavailable or backend rejects booking due to overlap
- **THEN** the UI SHALL show a large centered dialog for the booking-impacting error
- **AND** SHALL include selected range, conflict range when available, and actions to choose dates again or find another room.

#### Scenario: My bookings state clarity
- **WHEN** customer views booking history or booking detail
- **THEN** each booking status SHALL have a clear label, tone and next action
- **AND** `PENDING_HOST_APPROVAL`, `PENDING_PAYMENT` and `PENDING_APPROVAL` SHALL be visually and textually distinct.

### Requirement: Shared Visual System

Web app SHALL use a consistent commercial visual system across customer, admin and staff surfaces.

#### Scenario: Shared tokens and components
- **WHEN** implementation changes common UI components
- **THEN** buttons, cards/surfaces, badges, inputs, modals, skeletons and empty states SHALL use consistent radius, spacing, focus state and color mapping
- **AND** components SHALL remain accessible by keyboard and readable against their backgrounds.

#### Scenario: Palette is not one-note
- **WHEN** pages render after the rework
- **THEN** the UI SHALL NOT be dominated by only slate/blue or only beige/brown tones
- **AND** SHALL use accent colors intentionally for booking, availability, offer and operational status signals.

#### Scenario: Stable responsive layout
- **WHEN** dynamic data such as long room names, booking codes, customer names or status labels render
- **THEN** layout dimensions SHALL remain stable
- **AND** text SHALL not overlap controls, images, calendar cells or adjacent cards.

### Requirement: Operational Admin Staff UI

Admin and staff screens SHALL remain work-focused while becoming more polished and easier to scan.

#### Scenario: Admin dashboard
- **WHEN** admin opens dashboard/reporting
- **THEN** KPI, chart and status summary areas SHALL prioritize scanning and comparison
- **AND** date filters and primary actions SHALL remain visible and predictable.

#### Scenario: Admin management pages
- **WHEN** admin manages bookings, rooms, room types, pricing, coupons or staff
- **THEN** tables/forms SHALL use consistent headers, filter toolbars, row actions and status labels
- **AND** destructive or status-changing actions SHALL be visually distinct from navigation actions.

#### Scenario: Staff calendar and operational pages
- **WHEN** staff views booking calendar, pending requests, receipt approvals or room map
- **THEN** the UI SHALL support repeated operational use with dense but readable layout
- **AND** booking blocks/status chips SHALL distinguish request approval, payment waiting, receipt approval, confirmed and checked-in states.
