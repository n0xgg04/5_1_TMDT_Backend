# Admin Reporting And Management Specification

## Purpose

Define admin dashboard/reporting behavior and summarize admin-only management capabilities across users, inventory, bank transfer accounts, coupons, and reports.

## Requirements

### Requirement: Admin Revenue Report

The system SHALL allow admins to report completed payment revenue over a date range.

#### Scenario: Revenue report by date range

- **GIVEN** an authenticated admin
- **AND** completed payments exist with `paidAt` within the inclusive date range
- **WHEN** `/reports/revenue?from=<date>&to=<date>` is called
- **THEN** the API SHALL sum payment amounts as `total` and `totalRevenue`
- **AND** count completed payments as `totalBookings`
- **AND** group revenue/count by room type name
- **AND** return daily revenue points ordered by date.

#### Scenario: Revenue report date inclusivity

- **GIVEN** `to` is submitted as a date
- **WHEN** revenue report is calculated
- **THEN** the end date SHALL be adjusted to 23:59:59.999 for inclusive filtering.

#### Scenario: Revenue groupBy parameter

- **GIVEN** `groupBy` is submitted as `day`, `week`, or `month`
- **WHEN** revenue report is calculated
- **THEN** the current implementation SHALL still return daily `data` points.

#### Scenario: Non-admin revenue report

- **GIVEN** an authenticated non-admin
- **WHEN** `/reports/revenue` is called
- **THEN** the API SHALL reject the request through role authorization.

### Requirement: Admin Occupancy Report

The system SHALL allow admins to compute an occupancy percentage over a date range.

#### Scenario: Occupancy report

- **GIVEN** an authenticated admin
- **WHEN** `/reports/occupancy?from=<date>&to=<date>` is called
- **THEN** the API SHALL count all rooms
- **AND** count bookings in `CHECKED_IN` or `CHECKED_OUT` whose check-in/check-out are within the range
- **AND** calculate days as ceiling of date difference
- **AND** calculate total room nights as total rooms times days
- **AND** calculate occupancy rate as occupied booking count divided by total room nights times 100
- **AND** round occupancy rate to two decimals.

#### Scenario: Zero room nights

- **GIVEN** total room nights is zero
- **WHEN** occupancy report is calculated
- **THEN** occupancy rate SHALL be 0.

### Requirement: Admin Booking Status Summary

The system SHALL allow admins to summarize bookings by status over creation date range.

#### Scenario: Booking status summary

- **GIVEN** an authenticated admin
- **WHEN** `/reports/bookings/summary?from=<date>&to=<date>` is called
- **THEN** the API SHALL group bookings by status where `createdAt` is within the inclusive range
- **AND** return a map from status to count.

### Requirement: Admin Staff Management

The system SHALL allow admins to manage staff accounts.

#### Scenario: Admin creates staff account

- **GIVEN** an authenticated admin
- **WHEN** `/users/staff` is posted with valid staff role
- **THEN** the system SHALL create an active account for receptionist, housekeeping, or admin use.

#### Scenario: Admin locks account

- **GIVEN** an authenticated admin
- **WHEN** `/users/:id/toggle-lock` is patched for another user
- **THEN** the user's active state SHALL be toggled.

### Requirement: Admin Inventory Management

The system SHALL allow admins to manage commercial room types, concrete rooms, and pricing rules.

#### Scenario: Admin manages room type

- **GIVEN** an authenticated admin
- **WHEN** they call room type create/update/delete endpoints
- **THEN** the operation SHALL be allowed subject to room type business constraints.

#### Scenario: Admin manages concrete room

- **GIVEN** an authenticated admin
- **WHEN** they call room create/update/delete endpoints
- **THEN** the operation SHALL be allowed subject to room business constraints.

#### Scenario: Admin manages pricing rule

- **GIVEN** an authenticated admin
- **WHEN** they call pricing create/delete endpoints
- **THEN** the operation SHALL be allowed subject to pricing rule existence constraints.

### Requirement: Admin Payment Method Management

The system SHALL allow admins to manage bank transfer account records used in manual transfer payment.

#### Scenario: Admin creates payment method info

- **GIVEN** an authenticated admin
- **WHEN** bank account data is posted
- **THEN** the system SHALL store the account for public bank-transfer display when active.

#### Scenario: Admin views inactive payment method info

- **GIVEN** an authenticated admin
- **WHEN** `/payment-methods/admin` is called
- **THEN** inactive records SHALL be included.

### Requirement: Admin Coupon Management

The system SHALL allow admins to create and list coupon records used by customer promotion flows.

#### Scenario: Admin creates coupon

- **GIVEN** an authenticated admin
- **WHEN** `/coupons/admin` is posted
- **THEN** the coupon SHALL be stored with code normalization and default values.

#### Scenario: Admin lists all coupons

- **GIVEN** an authenticated admin
- **WHEN** `/coupons/admin` is called
- **THEN** all coupon records SHALL be returned regardless of active/current status.

### Requirement: Admin Conversation Handling

The system SHALL allow admins to participate in the same support workflow as receptionists.

#### Scenario: Admin lists conversations

- **GIVEN** an authenticated admin
- **WHEN** `/chat/staff/conversations` is called
- **THEN** the admin SHALL see the staff conversation queue.

#### Scenario: Admin resolves conversation

- **GIVEN** an authenticated admin
- **WHEN** `/chat/staff/conversations/:id/resolve` is posted
- **THEN** the conversation SHALL be marked resolved.

### Requirement: Admin Booking Approval

The system SHALL allow admins to approve and reject receipt-based bookings.

#### Scenario: Admin approves pending transfer booking

- **GIVEN** an authenticated admin
- **AND** a booking is `PENDING_APPROVAL`
- **WHEN** `/bookings/:id/approve` is posted
- **THEN** the booking SHALL be confirmed and marked with the admin's user id as approver.

#### Scenario: Admin rejects pending transfer booking

- **GIVEN** an authenticated admin
- **AND** a booking is `PENDING_APPROVAL`
- **WHEN** `/bookings/:id/reject` is posted with a reason
- **THEN** the booking SHALL be rejected with the reason recorded.
