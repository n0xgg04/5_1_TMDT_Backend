# Staff Operations Specification

## Purpose

Define room map operations, room status updates, staff booking handling, add-on services, conversation handling, and role access for receptionist, housekeeping, and admin users.

## Requirements

### Requirement: Staff Room Map

The system SHALL allow receptionist, housekeeping, and admin users to view a room map with current room and latest active booking context.

#### Scenario: Get room map

- **GIVEN** an authenticated user with role `RECEPTIONIST`, `HOUSEKEEPING`, or `ADMIN`
- **WHEN** `/staff/room-map` is called
- **THEN** the API SHALL return rooms ordered by floor ascending then room number ascending
- **AND** include room type name and max guests
- **AND** include the latest booking in `CONFIRMED` or `CHECKED_IN` with customer first name, last name, and phone.

#### Scenario: Get room map by floor

- **GIVEN** a floor query parameter is supplied
- **WHEN** `/staff/room-map?floor=<floor>` is called
- **THEN** only rooms on that floor SHALL be returned.

#### Scenario: Customer cannot access room map

- **GIVEN** an authenticated customer
- **WHEN** `/staff/room-map` is called
- **THEN** the API SHALL reject the request through role authorization.

### Requirement: Staff Room Status Updates

The system SHALL allow staff roles to update room operational status.

#### Scenario: Update room status

- **GIVEN** an authenticated user with role `RECEPTIONIST`, `HOUSEKEEPING`, or `ADMIN`
- **AND** the room exists
- **WHEN** `/staff/room-map/:roomId` is patched with a status
- **THEN** the system SHALL update the room status and return room data including room type.

#### Scenario: Update missing room

- **GIVEN** the room id does not exist
- **WHEN** status update is requested
- **THEN** the API SHALL reject the request with `Phòng không tồn tại`.

#### Scenario: Housekeeping marks dirty room cleaning

- **GIVEN** a housekeeping user views a dirty room
- **WHEN** they patch status to `CLEANING`
- **THEN** the room status SHALL become `CLEANING`.

#### Scenario: Housekeeping marks room available

- **GIVEN** a housekeeping user finishes cleaning
- **WHEN** they patch status to `AVAILABLE`
- **THEN** the room status SHALL become `AVAILABLE`.

### Requirement: Staff Check-In And Check-Out

The system SHALL allow receptionist/admin to perform check-in and check-out through booking endpoints.

#### Scenario: Receptionist checks in confirmed booking

- **GIVEN** a receptionist is authenticated
- **AND** a booking status is `CONFIRMED`
- **WHEN** `/bookings/:id/checkin` is posted
- **THEN** the booking SHALL become `CHECKED_IN`
- **AND** the room SHALL become `OCCUPIED`.

#### Scenario: Admin checks out checked-in booking

- **GIVEN** an admin is authenticated
- **AND** a booking status is `CHECKED_IN`
- **WHEN** `/bookings/:id/checkout` is posted
- **THEN** the booking SHALL become `CHECKED_OUT`
- **AND** the room SHALL become `DIRTY`.

#### Scenario: Housekeeping cannot check in/out

- **GIVEN** a housekeeping user is authenticated
- **WHEN** they call check-in or checkout endpoints
- **THEN** the API SHALL reject the request through role authorization.

### Requirement: Staff Pending Booking Approval

The system SHALL allow receptionist/admin users to approve or reject receipt-based bookings.

#### Scenario: Staff lists pending bookings

- **GIVEN** a receptionist or admin is authenticated
- **WHEN** `/bookings/staff/pending` is called
- **THEN** pending approval bookings SHALL be returned with customer, room, room type, payment, and attachment context.

#### Scenario: Receptionist approves receipt booking

- **GIVEN** a receptionist is authenticated
- **AND** the booking is `PENDING_APPROVAL`
- **WHEN** `/bookings/:id/approve` is posted
- **THEN** the booking SHALL become `CONFIRMED`
- **AND** the room SHALL become `RESERVED`.

#### Scenario: Receptionist rejects receipt booking

- **GIVEN** a receptionist is authenticated
- **AND** the booking is `PENDING_APPROVAL`
- **WHEN** `/bookings/:id/reject` is posted with reason
- **THEN** the booking SHALL become `REJECTED`
- **AND** the reason SHALL be recorded.

### Requirement: Add-On Service Operations

The system SHALL allow staff-role users to manage add-on service charges for checked-in bookings.

#### Scenario: Add add-on

- **GIVEN** a staff-role user is authenticated
- **AND** the booking is `CHECKED_IN`
- **WHEN** an add-on is created with service name, quantity, unit price, and optional note
- **THEN** the add-on SHALL be stored with `addedBy` equal to the staff user id
- **AND** the booking total amount SHALL be incremented by the add-on total.

#### Scenario: Update add-on

- **GIVEN** an add-on exists
- **WHEN** staff patches quantity or note
- **THEN** quantity/note SHALL be updated
- **AND** booking total amount SHALL be adjusted by the price difference when quantity changes.

#### Scenario: Delete add-on

- **GIVEN** an add-on exists
- **WHEN** staff deletes it
- **THEN** the booking total amount SHALL be decremented by the add-on total
- **AND** the add-on row SHALL be deleted.

### Requirement: Staff Conversation Queue

The system SHALL allow receptionist/admin users to view, assign, inspect, and resolve customer support conversations.

#### Scenario: List staff conversations

- **GIVEN** a receptionist or admin is authenticated
- **WHEN** `/chat/staff/conversations` is called
- **THEN** conversations SHALL be returned ordered by update time descending
- **AND** include customer summary and latest message.

#### Scenario: Filter staff conversations by status

- **GIVEN** a status query is supplied
- **WHEN** `/chat/staff/conversations?status=open` is called
- **THEN** only conversations with that status SHALL be returned.

#### Scenario: Get staff conversation detail

- **GIVEN** a receptionist or admin is authenticated
- **WHEN** `/chat/staff/conversations/:id` is called
- **THEN** the API SHALL return conversation customer summary and messages ordered oldest first.

#### Scenario: Assign conversation

- **GIVEN** a receptionist or admin is authenticated
- **WHEN** `/chat/staff/conversations/:id/assign` is posted
- **THEN** the conversation `staffId` SHALL be set to the current user id.

#### Scenario: Resolve conversation

- **GIVEN** a receptionist or admin is authenticated
- **WHEN** `/chat/staff/conversations/:id/resolve` is posted
- **THEN** the conversation status SHALL become `resolved`.

#### Scenario: Customer cannot list staff conversations

- **GIVEN** an authenticated customer
- **WHEN** they call any `/chat/staff/*` endpoint
- **THEN** the API SHALL reject the request through role authorization.
