# Booking Lifecycle Specification

## Purpose

Define booking creation, concurrency control, discount application, booking history/detail access, cancellation, expiration, receipt approval, check-in, check-out, add-ons, events, and booking status transitions.

## Requirements

### Requirement: Customer Booking Creation

The system SHALL allow authenticated customers to create bookings for concrete rooms over valid date ranges.

#### Scenario: Create booking with valid data

- **GIVEN** an authenticated customer
- **AND** `checkOut` is after `checkIn`
- **AND** the target room exists
- **AND** the target room type is active
- **AND** there is no overlapping active booking for the same room
- **WHEN** `/bookings` is posted
- **THEN** the system SHALL calculate total price
- **AND** apply flash sale discount when applicable
- **AND** apply coupon discount when a valid coupon code is supplied
- **AND** create a booking with status `PENDING_PAYMENT`
- **AND** set `paymentDeadline` to 15 minutes after creation time
- **AND** default `checkInTime` to `14:00`, `checkOutTime` to `12:00`, adults to 2, and children to 0 when absent
- **AND** persist a `booking.created` outbox event
- **AND** emit `booking.created`.

#### Scenario: Invalid booking date range

- **GIVEN** `checkOut` is equal to or before `checkIn`
- **WHEN** a customer creates a booking
- **THEN** the API SHALL reject the request with `Ngày trả phòng phải sau ngày nhận phòng`.

#### Scenario: Room creation lock unavailable

- **GIVEN** another request holds the Redis lock `booking:lock:<roomId>:<checkIn>:<checkOut>`
- **WHEN** a customer attempts to create a booking for the same room/range
- **THEN** the API SHALL reject the request with `Phòng này đang được đặt bởi người khác, vui lòng thử lại`.

#### Scenario: Room missing

- **GIVEN** the submitted room id does not exist
- **WHEN** a customer creates a booking
- **THEN** the API SHALL reject the request with `Phòng không tồn tại`.

#### Scenario: Inactive room type

- **GIVEN** the target room's room type is inactive
- **WHEN** a customer creates a booking
- **THEN** the API SHALL reject the request with `Loại phòng không còn hoạt động`.

#### Scenario: Overlapping active booking

- **GIVEN** the room already has a booking in `PENDING_PAYMENT`, `PAYING`, `CONFIRMED`, or `CHECKED_IN`
- **AND** the existing booking overlaps the requested date range
- **WHEN** a customer creates a booking
- **THEN** the API SHALL reject the request with `Phòng đã được đặt trong khoảng thời gian này`.

#### Scenario: Lock release after booking attempt

- **GIVEN** a booking creation request acquired a Redis lock
- **WHEN** the request succeeds or fails
- **THEN** the system SHALL delete the lock key in a finally block.

### Requirement: Booking Discount Order

The system SHALL apply promotions in the implemented order: base pricing, flash sale, then coupon.

#### Scenario: Flash sale applies

- **GIVEN** an active flash sale exists for the room type and current time is within its window
- **WHEN** booking total is calculated
- **THEN** the system SHALL reduce the base total by the flash sale percentage
- **AND** use the discounted amount as the next amount for coupon calculation.

#### Scenario: Coupon applies after flash sale

- **GIVEN** a valid coupon code is submitted
- **WHEN** the booking is created
- **THEN** the system SHALL validate the coupon against the current amount
- **AND** store `discountAmount`
- **AND** store the submitted `couponCode`
- **AND** increment coupon usage
- **AND** mark or create the corresponding `UserCoupon` as used for the customer.

#### Scenario: No coupon submitted

- **GIVEN** no coupon code is provided
- **WHEN** booking is created
- **THEN** coupon usage and user coupon state SHALL not be changed.

### Requirement: Booking History

The system SHALL allow customers to list their own bookings with pagination and optional status filtering.

#### Scenario: Get my bookings

- **GIVEN** an authenticated customer
- **WHEN** `/bookings/my?page=1&limit=10` is called
- **THEN** the API SHALL return the customer's bookings ordered newest first
- **AND** include room, room type, add-ons, payment, and review
- **AND** return `data`, `total`, `page`, and `limit`.

#### Scenario: Filter my bookings by status

- **GIVEN** an authenticated customer
- **WHEN** `/bookings/my?status=CONFIRMED` is called
- **THEN** only the customer's confirmed bookings SHALL be returned.

### Requirement: Booking Detail Authorization

The system SHALL restrict booking detail visibility to the owning customer, admins, and receptionists.

#### Scenario: Owner views booking

- **GIVEN** an authenticated customer owns a booking
- **WHEN** `/bookings/:id` is called
- **THEN** the API SHALL return booking detail with room, room type, add-ons, payment, and review.

#### Scenario: Admin or receptionist views booking

- **GIVEN** an authenticated admin or receptionist
- **WHEN** `/bookings/:id` is called
- **THEN** the API SHALL return the booking even when they are not the customer.

#### Scenario: Unauthorized user views booking

- **GIVEN** an authenticated user is not the owner and is not admin/receptionist
- **WHEN** `/bookings/:id` is called
- **THEN** the API SHALL reject the request with `Không có quyền xem đơn này`.

### Requirement: Customer Cancellation

The system SHALL allow a customer to cancel their own booking only in cancellable states.

#### Scenario: Cancel pending or confirmed booking

- **GIVEN** an authenticated customer owns a booking in `PENDING_PAYMENT`, `PAYING`, or `CONFIRMED`
- **WHEN** `/bookings/:id/cancel` is posted
- **THEN** the system SHALL set booking status to `CANCELLED`
- **AND** emit `booking.cancelled` with reason or `Customer cancelled`.

#### Scenario: Cancel another customer's booking

- **GIVEN** a customer does not own the booking
- **WHEN** they request cancellation
- **THEN** the API SHALL reject the request with `Không có quyền hủy đơn này`.

#### Scenario: Cancel non-cancellable booking

- **GIVEN** a booking status is not `PENDING_PAYMENT`, `PAYING`, or `CONFIRMED`
- **WHEN** cancellation is requested
- **THEN** the API SHALL reject the request with `Không thể hủy đơn ở trạng thái này`.

### Requirement: Payment-Driven Confirmation And Expiration

The system SHALL transition bookings based on payment success/failure domain events.

#### Scenario: Confirm pending booking after payment success

- **GIVEN** a booking status is `PENDING_PAYMENT` or `PAYING`
- **WHEN** `confirmBooking` runs
- **THEN** the system SHALL set status to `CONFIRMED`
- **AND** emit `booking.confirmed`.

#### Scenario: Idempotent confirm for already terminal booking

- **GIVEN** a booking status is not `PENDING_PAYMENT` or `PAYING`
- **WHEN** `confirmBooking` runs
- **THEN** the booking SHALL be returned unchanged.

#### Scenario: Expire unpaid booking

- **GIVEN** a booking status is `PENDING_PAYMENT` or `PAYING`
- **WHEN** `expireBooking` runs
- **THEN** the system SHALL set status to `EXPIRED`
- **AND** emit `booking.expired`.

#### Scenario: Idempotent expire for non-payable booking

- **GIVEN** a booking status is not `PENDING_PAYMENT` or `PAYING`
- **WHEN** `expireBooking` runs
- **THEN** no status change SHALL be made.

#### Scenario: Find expired bookings

- **GIVEN** bookings exist with `paymentDeadline` before now
- **WHEN** the expiration job queries stale bookings
- **THEN** only bookings currently in `PENDING_PAYMENT` SHALL be returned.

### Requirement: Bank Transfer Receipt Approval

The system SHALL support receipt upload by customers and approval/rejection by receptionist/admin.

#### Scenario: Upload receipt

- **GIVEN** an authenticated customer owns a booking in `PENDING_PAYMENT`
- **WHEN** `/bookings/:id/upload-receipt` is posted with `receiptImageUrl`
- **THEN** existing payment rows for that booking SHALL be updated with receipt image and `PENDING` status
- **AND** a booking attachment of type `receipt` SHALL be created
- **AND** the booking status SHALL become `PENDING_APPROVAL`
- **AND** the API SHALL return `Đã upload biên lai, chờ staff xác nhận`.

#### Scenario: Upload receipt for another customer

- **GIVEN** a customer does not own the booking
- **WHEN** they upload a receipt
- **THEN** the API SHALL reject the request with `Không có quyền thao tác`.

#### Scenario: Upload receipt for non-pending booking

- **GIVEN** the booking is not in `PENDING_PAYMENT`
- **WHEN** receipt upload is requested
- **THEN** the API SHALL reject the request with `Đơn không ở trạng thái chờ thanh toán`.

#### Scenario: List pending approvals

- **GIVEN** an authenticated receptionist or admin
- **WHEN** `/bookings/staff/pending` is called
- **THEN** the API SHALL return `PENDING_APPROVAL` bookings ordered oldest first
- **AND** include room, room type, customer summary, payment, and attachments
- **AND** return pagination metadata.

#### Scenario: Approve receipt booking

- **GIVEN** an authenticated receptionist or admin
- **AND** the booking is in `PENDING_APPROVAL`
- **AND** no other `CONFIRMED` or `CHECKED_IN` booking conflicts with the same room/date range
- **WHEN** `/bookings/:id/approve` is posted
- **THEN** the system SHALL set booking status to `CONFIRMED`
- **AND** store `approvedById` and `approvedAt`
- **AND** set room status to `RESERVED`
- **AND** emit `booking.approved`.

#### Scenario: Approve booking with conflict

- **GIVEN** another `CONFIRMED` or `CHECKED_IN` booking overlaps the same room/date range
- **WHEN** staff approves the pending approval
- **THEN** the API SHALL reject the request with `Phòng đã có đơn confirmed trong khoảng này`.

#### Scenario: Reject receipt booking

- **GIVEN** an authenticated receptionist or admin
- **AND** the booking is in `PENDING_APPROVAL`
- **WHEN** `/bookings/:id/reject` is posted with a reason
- **THEN** the system SHALL set booking status to `REJECTED`
- **AND** store `approvedById` and `rejectedReason`
- **AND** emit `booking.rejected`
- **AND** return `Đã từ chối booking`.

#### Scenario: Reject booking with completed payment row

- **GIVEN** the rejected booking has payment status `COMPLETED`
- **WHEN** staff rejects it
- **THEN** the system SHALL set the payment status to `REFUNDED` and set `refundedAt`.

### Requirement: Check-In

The system SHALL allow receptionist/admin to check in confirmed bookings and occupy the room.

#### Scenario: Check in confirmed booking

- **GIVEN** an authenticated receptionist or admin
- **AND** the booking status is `CONFIRMED`
- **WHEN** `/bookings/:id/checkin` is posted
- **THEN** the booking status SHALL become `CHECKED_IN`
- **AND** `checkInActual` SHALL be set to now
- **AND** the room status SHALL become `OCCUPIED`
- **AND** booking and room update SHALL occur in one transaction.

#### Scenario: Check in non-confirmed booking

- **GIVEN** the booking status is not `CONFIRMED`
- **WHEN** check-in is requested
- **THEN** the API SHALL reject the request with `Đơn phải ở trạng thái CONFIRMED để check-in`.

### Requirement: Check-Out

The system SHALL allow receptionist/admin to check out checked-in bookings, include add-on totals, and dirty the room.

#### Scenario: Check out checked-in booking

- **GIVEN** an authenticated receptionist or admin
- **AND** the booking status is `CHECKED_IN`
- **WHEN** `/bookings/:id/checkout` is posted
- **THEN** the booking status SHALL become `CHECKED_OUT`
- **AND** `checkOutActual` SHALL be set to now
- **AND** the booking total amount SHALL be set to current total plus the sum of add-on total prices
- **AND** the room status SHALL become `DIRTY`
- **AND** `checkout.completed` SHALL be emitted with final amount.

#### Scenario: Check out booking before check-in

- **GIVEN** the booking status is not `CHECKED_IN`
- **WHEN** checkout is requested
- **THEN** the API SHALL reject the request with `Khách chưa check-in`.

### Requirement: Add-On Services

The system SHALL allow staff roles to add, update, list, and delete add-on services for bookings.

#### Scenario: Add service to checked-in booking

- **GIVEN** an authenticated receptionist, housekeeping user, or admin
- **AND** the booking status is `CHECKED_IN`
- **WHEN** `/staff/bookings/:bookingId/addons` is posted with service name, quantity, unit price, and optional note
- **THEN** the system SHALL create a booking add-on
- **AND** calculate `totalPrice = quantity * unitPrice`
- **AND** increment booking `totalAmount` by the add-on total.

#### Scenario: Add service before check-in

- **GIVEN** the booking status is not `CHECKED_IN`
- **WHEN** staff adds an add-on
- **THEN** the API SHALL reject the request with `Chỉ có thể thêm dịch vụ khi khách đang ở`.

#### Scenario: List add-ons

- **GIVEN** an authenticated staff-role user
- **WHEN** `/staff/bookings/:bookingId/addons` is called
- **THEN** add-ons for the booking SHALL be returned ordered by creation time ascending.

#### Scenario: Update add-on quantity

- **GIVEN** an add-on exists
- **WHEN** `/staff/addons/:id` is patched with a new quantity
- **THEN** the system SHALL recalculate total price using the existing unit price
- **AND** increment or decrement booking `totalAmount` by the difference.

#### Scenario: Update add-on note only

- **GIVEN** an add-on exists
- **WHEN** only `staffNote` is patched
- **THEN** the note SHALL be updated without changing booking `totalAmount`.

#### Scenario: Delete add-on

- **GIVEN** an add-on exists
- **WHEN** `/staff/addons/:id` is deleted
- **THEN** the system SHALL decrement booking `totalAmount` by the add-on total
- **AND** delete the add-on row
- **AND** return `Đã xóa dịch vụ`.

### Requirement: Booking Notifications

The system SHALL send/persist customer notifications for major booking lifecycle events.

#### Scenario: Booking confirmed notification

- **GIVEN** a booking is confirmed through payment success
- **WHEN** `booking.confirmed` is emitted
- **THEN** the notification service SHALL create a confirmation notification and send email when configured.

#### Scenario: Booking cancelled notification

- **GIVEN** a customer cancels a booking
- **WHEN** `booking.cancelled` is emitted
- **THEN** the notification service SHALL create a cancellation notification including reason when present.

#### Scenario: Booking expired notification

- **GIVEN** an unpaid booking expires
- **WHEN** `booking.expired` is emitted
- **THEN** the notification service SHALL create an expiration notification.

#### Scenario: Checkout completed notification

- **GIVEN** checkout completes
- **WHEN** `checkout.completed` is emitted
- **THEN** the notification service SHALL create a checkout invoice-style notification including final amount when provided.
