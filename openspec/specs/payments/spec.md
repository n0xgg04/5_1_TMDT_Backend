# Payments Specification

## Purpose

Define online payment initiation, VNPay callback handling, Stripe card flows, bank-transfer payment method data, user payment methods, and payment authorization.

## Requirements

### Requirement: Payment Initiation

The system SHALL allow an authenticated customer to initiate payment for their own pending booking.

#### Scenario: Initiate VNPay payment

- **GIVEN** an authenticated customer owns a booking in `PENDING_PAYMENT`
- **AND** the booking payment deadline has not passed
- **AND** no existing completed payment exists for the booking
- **WHEN** `/payments/initiate` is posted with method `VNPAY`
- **THEN** the system SHALL create or update the booking payment with status `PROCESSING`
- **AND** set method to `VNPAY`
- **AND** set payment type to `FULL`
- **AND** set amount to the booking total
- **AND** generate a VNPay gateway URL
- **AND** set booking status to `PAYING`
- **AND** return payment, gateway URL, and amount.

#### Scenario: Initiate non-VNPay online method

- **GIVEN** an authenticated customer owns a pending booking
- **WHEN** `/payments/initiate` is posted with an online method other than `BANK_TRANSFER`
- **THEN** the system SHALL create or update a `PROCESSING` payment
- **AND** set booking status to `PAYING`
- **AND** return payment and amount, with gateway URL present only when the method produced one.

#### Scenario: Initiate bank transfer

- **GIVEN** an authenticated customer owns a booking in `PENDING_PAYMENT`
- **WHEN** `/payments/initiate` is posted with method `BANK_TRANSFER`
- **THEN** the system SHALL create or update a payment with status `PROCESSING`
- **AND** keep booking status `PENDING_PAYMENT`
- **AND** return payment, amount, and the first active configured bank account when available.

#### Scenario: Deposit payment type

- **GIVEN** payment initiation is invoked internally with payment type `DEPOSIT`
- **WHEN** amount is calculated
- **THEN** amount SHALL be 30 percent of booking total rounded down with `Math.floor`.

#### Scenario: Booking missing

- **GIVEN** the booking id does not exist
- **WHEN** payment is initiated
- **THEN** the API SHALL reject the request with `Đơn đặt phòng không tồn tại`.

#### Scenario: Customer pays another customer's booking

- **GIVEN** the authenticated user is not the booking customer
- **WHEN** payment is initiated
- **THEN** the API SHALL reject the request with `Không có quyền thanh toán đơn này`.

#### Scenario: Booking not pending payment

- **GIVEN** booking status is not `PENDING_PAYMENT`
- **WHEN** payment is initiated
- **THEN** the API SHALL reject the request with `Đơn không ở trạng thái chờ thanh toán`.

#### Scenario: Payment deadline passed

- **GIVEN** current time is after `paymentDeadline`
- **WHEN** payment is initiated
- **THEN** the API SHALL reject the request with `Đơn đã hết hạn thanh toán`.

#### Scenario: Booking already paid

- **GIVEN** an existing payment for the booking has status `COMPLETED`
- **WHEN** payment is initiated again
- **THEN** the API SHALL reject the request with `Đơn đã được thanh toán`.

### Requirement: VNPay Gateway URL

The system SHALL generate signed VNPay payment URLs using configured or demo VNPay settings.

#### Scenario: Create VNPay URL

- **GIVEN** booking id, amount, order info, and client IP
- **WHEN** a VNPay URL is created
- **THEN** the URL SHALL include VNPay version `2.1.0`, command `pay`, VND currency, order type `hotel`, locale `vn`, configured return URL, client IP, creation date, 15-minute expire date, and signed secure hash.

#### Scenario: VNPay amount units

- **GIVEN** amount is represented in VND
- **WHEN** VNPay parameters are generated
- **THEN** `vnp_Amount` SHALL be amount multiplied by 100.

#### Scenario: VNPay order reference

- **GIVEN** a booking id
- **WHEN** VNPay parameters are generated
- **THEN** transaction reference SHALL be `<last 8 chars of bookingId>-<timestamp>`.

### Requirement: VNPay Callback Handling

The system SHALL verify VNPay callback signatures and update payment/booking through domain events.

#### Scenario: Invalid VNPay signature

- **GIVEN** the secure hash does not match the callback parameters
- **WHEN** `/payments/webhook/vnpay` is called
- **THEN** the endpoint SHALL return `{ code: "97", message: "Invalid signature" }`.

#### Scenario: VNPay booking not found

- **GIVEN** the callback signature is valid
- **AND** no booking can be resolved from the transaction reference
- **WHEN** the webhook is handled
- **THEN** the endpoint SHALL return `{ code: "01", message: "Order not found" }`.

#### Scenario: Duplicate VNPay transaction

- **GIVEN** the booking payment already has the same `gatewayTransactionId`
- **WHEN** the webhook is handled again
- **THEN** the endpoint SHALL return `{ code: "00", message: "Already processed" }` without duplicating side effects.

#### Scenario: VNPay success

- **GIVEN** the callback is valid
- **AND** `vnp_ResponseCode` is `00`
- **WHEN** the webhook is handled
- **THEN** the payment SHALL be updated to `COMPLETED`
- **AND** `gatewayTransactionId` and `paidAt` SHALL be set
- **AND** `payment.success` SHALL be emitted with booking id, amount, and transaction id
- **AND** the endpoint SHALL return `{ code: "00", message: "Confirmed" }`.

#### Scenario: VNPay failure

- **GIVEN** the callback is valid
- **AND** `vnp_ResponseCode` is not `00`
- **WHEN** the webhook is handled
- **THEN** the payment SHALL be updated to `FAILED`
- **AND** `failureReason` SHALL include the VNPay response code
- **AND** `payment.failed` SHALL be emitted.

### Requirement: Payment Lookup

The system SHALL allow a customer to fetch their own payment by booking id.

#### Scenario: Get payment by booking

- **GIVEN** an authenticated customer owns the payment
- **WHEN** `/payments/booking/:bookingId` is called
- **THEN** the API SHALL return payment including booking.

#### Scenario: Payment not found

- **GIVEN** no payment exists for the booking id
- **WHEN** payment lookup is requested
- **THEN** the API SHALL reject the request with `Thông tin thanh toán không tồn tại`.

#### Scenario: Payment lookup by non-owner

- **GIVEN** an authenticated user is not the payment customer
- **WHEN** payment lookup is requested
- **THEN** the API SHALL reject the request with `Không có quyền xem thông tin này`.

### Requirement: Stripe Card Setup

The system SHALL expose Stripe setup intent helpers for saving card payment methods.

#### Scenario: Create setup intent

- **GIVEN** an authenticated user
- **WHEN** `/payments/stripe/setup-intent` is posted
- **THEN** the API SHALL create a Stripe setup intent with card payment method types
- **AND** return its client secret.

#### Scenario: Confirm card setup

- **GIVEN** a setup client secret and Stripe payment method id
- **WHEN** `/payments/stripe/confirm-setup` is posted
- **THEN** the API SHALL confirm the setup intent
- **AND** retrieve the payment method
- **AND** return setup status, payment method id, and card last4.

### Requirement: Stripe VISA Payment

The system SHALL allow a customer to pay a pending booking using a saved user payment method that contains a Stripe payment method id.

#### Scenario: Create Stripe payment intent

- **GIVEN** an authenticated customer owns a `PENDING_PAYMENT` booking before payment deadline
- **AND** the submitted user payment method belongs to the customer
- **AND** the method details contain `paymentMethodId`
- **WHEN** `/payments/stripe/payment-intent` is posted
- **THEN** the system SHALL create a Stripe payment intent for booking total times 100 in VND
- **AND** create or update the booking payment with method `VISA`, type `FULL`, status `PROCESSING`, amount, and Stripe payment intent id
- **AND** set booking status to `PAYING`
- **AND** return payment, client secret, and amount.

#### Scenario: Missing user payment method

- **GIVEN** the submitted user payment method id does not belong to the customer
- **WHEN** Stripe payment is initiated
- **THEN** the API SHALL reject the request with `Không tìm thấy phương thức thanh toán`.

#### Scenario: User payment method not linked to Stripe

- **GIVEN** the user payment method exists but its details do not contain `paymentMethodId`
- **WHEN** Stripe payment is initiated
- **THEN** the API SHALL reject the request with `Thẻ chưa được liên kết với Stripe`.

#### Scenario: Confirm Stripe payment success

- **GIVEN** a Stripe payment intent id maps to an existing payment
- **AND** Stripe returns status `succeeded`
- **WHEN** `/payments/stripe/confirm-payment` is posted
- **THEN** the payment SHALL be updated to `COMPLETED`
- **AND** `paidAt` SHALL be set
- **AND** `payment.success` SHALL be emitted
- **AND** the endpoint SHALL return `{ success: true, status: "succeeded" }`.

#### Scenario: Confirm Stripe payment failure

- **GIVEN** a Stripe payment intent id maps to an existing payment
- **AND** Stripe returns a status other than `succeeded`
- **WHEN** payment confirmation runs
- **THEN** the payment SHALL be updated to `FAILED`
- **AND** `failureReason` SHALL include the Stripe status
- **AND** `payment.failed` SHALL be emitted.

#### Scenario: Stripe payment not found

- **GIVEN** no payment has the submitted Stripe payment intent id
- **WHEN** Stripe confirmation runs
- **THEN** the API SHALL reject the request with `Không tìm thấy giao dịch`.

### Requirement: Bank Transfer Account Management

The system SHALL expose active bank transfer accounts publicly and allow admins to manage all account records.

#### Scenario: Public bank account list

- **GIVEN** active payment method info records exist
- **WHEN** `/payment-methods` is called
- **THEN** the API SHALL return active bank accounts ordered newest first.

#### Scenario: Admin bank account list

- **GIVEN** an authenticated admin
- **WHEN** `/payment-methods/admin` is called
- **THEN** the API SHALL return active and inactive bank account records ordered newest first.

#### Scenario: Admin creates bank account

- **GIVEN** an authenticated admin
- **WHEN** `/payment-methods` is posted with bank name, account number, holder, and optional branch/QR/active state
- **THEN** the system SHALL create a payment method info record.

#### Scenario: Admin updates bank account

- **GIVEN** an authenticated admin
- **AND** the bank account record exists
- **WHEN** `/payment-methods/:id` is put
- **THEN** the system SHALL update submitted fields.

#### Scenario: Admin deletes bank account

- **GIVEN** an authenticated admin
- **AND** the bank account record exists
- **WHEN** `/payment-methods/:id` is deleted
- **THEN** the system SHALL delete the record.

### Requirement: User Payment Methods

The system SHALL allow authenticated users to manage their own saved payment methods.

#### Scenario: List user payment methods

- **GIVEN** an authenticated user
- **WHEN** `/user-payment-methods` is called
- **THEN** the API SHALL return active methods for that user
- **AND** order default methods first, then newest first.

#### Scenario: Create default user method

- **GIVEN** an authenticated user
- **WHEN** they create a user payment method with `isDefault=true`
- **THEN** all existing methods for that user SHALL be set `isDefault=false`
- **AND** the new method SHALL be created as default.

#### Scenario: Create non-default user method

- **GIVEN** an authenticated user
- **WHEN** they create a user payment method without `isDefault`
- **THEN** the method SHALL be created with `isDefault=false` and `isActive=true`.

#### Scenario: Update user method to default

- **GIVEN** the method belongs to the authenticated user
- **WHEN** it is patched with `isDefault=true`
- **THEN** all of the user's other methods SHALL be unset as default
- **AND** the target method SHALL be updated.

#### Scenario: Update another user's method

- **GIVEN** the method id does not belong to the authenticated user
- **WHEN** update is requested
- **THEN** the API SHALL reject the request with `Không tìm thấy phương thức`.

#### Scenario: Delete user method

- **GIVEN** the method belongs to the authenticated user
- **WHEN** `/user-payment-methods/:id` is deleted
- **THEN** the system SHALL soft-delete it by setting `isActive=false`.
