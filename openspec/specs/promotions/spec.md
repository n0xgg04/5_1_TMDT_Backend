# Promotions Specification

## Purpose

Define coupon creation, public coupon discovery, claiming, application, usage tracking, user coupon state, and flash sale behavior.

## Requirements

### Requirement: Coupon Administration

The system SHALL allow admins to create coupons and list all coupons.

#### Scenario: Create percentage coupon

- **GIVEN** an authenticated admin
- **WHEN** `/coupons/admin` is posted with code, value, date range, and optional limits
- **THEN** the system SHALL store the code upper-cased
- **AND** default type to `percentage` when absent
- **AND** default usage limit to 1 when absent
- **AND** store absent min amount and max discount as null.

#### Scenario: Create fixed coupon

- **GIVEN** an authenticated admin
- **WHEN** a coupon is created with type `fixed`
- **THEN** the discount value SHALL be interpreted as a fixed currency amount during application.

#### Scenario: Admin lists coupons

- **GIVEN** an authenticated admin
- **WHEN** `/coupons/admin` is called
- **THEN** all coupons SHALL be returned ordered newest first.

#### Scenario: Non-admin manages coupons

- **GIVEN** an authenticated non-admin
- **WHEN** they call admin coupon endpoints
- **THEN** the API SHALL reject the request through role authorization.

### Requirement: Active Coupon Discovery

The system SHALL expose active coupons to public and authenticated users.

#### Scenario: Public active coupons

- **GIVEN** coupons exist with `isActive=true`, current time between start/end, and usage count below usage limit
- **WHEN** `/coupons` is called
- **THEN** only those coupons SHALL be returned ordered newest first.

#### Scenario: Public coupon claim state for anonymous user

- **GIVEN** no user is authenticated
- **WHEN** `/coupons/public` is called
- **THEN** active current coupons SHALL be returned with `isClaimed=false`.

#### Scenario: Public coupon claim state for authenticated user

- **GIVEN** a user is authenticated
- **AND** the user has claimed some coupons
- **WHEN** `/coupons/public` is called
- **THEN** active current coupons SHALL be returned
- **AND** each coupon SHALL include `isClaimed=true` only when a `UserCoupon` row exists for that user and coupon.

### Requirement: Coupon Claiming

The system SHALL allow authenticated users to save coupons to their account.

#### Scenario: Claim new coupon

- **GIVEN** an authenticated user
- **AND** no `UserCoupon` exists for the user and coupon id
- **WHEN** `/coupons/:id/claim` is posted
- **THEN** the system SHALL create a `UserCoupon` row and include coupon data in the response.

#### Scenario: Claim existing coupon

- **GIVEN** a `UserCoupon` already exists for the user and coupon id
- **WHEN** the user claims the same coupon again
- **THEN** the existing row SHALL be returned without creating a duplicate.

#### Scenario: List my coupons

- **GIVEN** an authenticated user
- **WHEN** `/coupons/my-coupons` is called
- **THEN** the API SHALL return the user's coupon rows with coupon data ordered newest first.

### Requirement: Coupon Application

The system SHALL validate and calculate coupon discounts without requiring authentication on the standalone apply endpoint.

#### Scenario: Apply valid percentage coupon

- **GIVEN** a coupon exists, is active, current, under usage limit, and satisfies minimum amount
- **AND** coupon type is `percentage`
- **WHEN** `/coupons/apply` is posted with code and amount
- **THEN** discount SHALL be `amount * value / 100`
- **AND** discount SHALL be capped at `maxDiscount` when configured
- **AND** discount SHALL never exceed the amount
- **AND** response SHALL include code, type, value, discount, and final amount.

#### Scenario: Apply valid fixed coupon

- **GIVEN** a valid coupon type is not `percentage`
- **WHEN** it is applied
- **THEN** discount SHALL be the coupon value capped at the order amount.

#### Scenario: Apply missing coupon

- **GIVEN** no coupon exists with the submitted code after upper-casing
- **WHEN** coupon application is requested
- **THEN** the API SHALL reject the request with `Mã giảm giá không tồn tại`.

#### Scenario: Apply inactive coupon

- **GIVEN** the coupon exists but `isActive=false`
- **WHEN** coupon application is requested
- **THEN** the API SHALL reject the request with `Mã giảm giá không còn hiệu lực`.

#### Scenario: Apply out-of-window coupon

- **GIVEN** current time is before start date or after end date
- **WHEN** coupon application is requested
- **THEN** the API SHALL reject the request with `Mã giảm giá đã hết hạn hoặc chưa bắt đầu`.

#### Scenario: Apply exhausted coupon

- **GIVEN** `usageCount >= usageLimit`
- **WHEN** coupon application is requested
- **THEN** the API SHALL reject the request with `Mã giảm giá đã hết lượt sử dụng`.

#### Scenario: Apply below minimum amount

- **GIVEN** coupon `minAmount` is set and submitted amount is lower
- **WHEN** coupon application is requested
- **THEN** the API SHALL reject the request with a message stating the minimum order amount required.

### Requirement: Coupon Usage In Booking

The booking flow SHALL consume coupons during booking creation after flash sale calculation.

#### Scenario: Booking with coupon increments usage

- **GIVEN** a customer creates a booking with a valid coupon code
- **WHEN** booking creation succeeds
- **THEN** the coupon usage count SHALL be incremented
- **AND** a user coupon record SHALL be upserted as used with `usedAt` set.

#### Scenario: Booking coupon code normalization

- **GIVEN** a customer submits a lower-case coupon code
- **WHEN** the coupon is applied
- **THEN** lookup SHALL use the upper-cased code.

### Requirement: Flash Sale Discovery

The system SHALL expose active flash sales with remaining quantity.

#### Scenario: Active flash sale list

- **GIVEN** a flash sale is active, current, and `quantity > soldCount`
- **WHEN** `/flash-sales` is called
- **THEN** it SHALL be returned with related room type.

#### Scenario: Flash sale not current

- **GIVEN** current time is outside a flash sale start/end range
- **WHEN** `/flash-sales` is called
- **THEN** the flash sale SHALL be excluded.

#### Scenario: Flash sale sold out

- **GIVEN** `soldCount >= quantity`
- **WHEN** `/flash-sales` is called
- **THEN** the flash sale SHALL be excluded.

### Requirement: Flash Sale Price Calculation

The booking flow SHALL reduce base price by an active flash sale percentage for the selected room type.

#### Scenario: Calculate flash sale price

- **GIVEN** an active current flash sale exists for the room type
- **WHEN** booking creation calculates flash sale price
- **THEN** discount SHALL be `basePrice * discount / 100`
- **AND** price SHALL be `max(0, basePrice - discount)`
- **AND** the result SHALL include flash sale id and discount value.

#### Scenario: No flash sale price

- **GIVEN** no active current flash sale exists for the room type
- **WHEN** flash sale price is calculated
- **THEN** base price SHALL be returned unchanged
- **AND** flash sale id SHALL be null.

#### Scenario: Increment flash sale sold count

- **GIVEN** a flash sale id
- **WHEN** sold count increment is invoked
- **THEN** the flash sale `soldCount` SHALL increase by 1.
