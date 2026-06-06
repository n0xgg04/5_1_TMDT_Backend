# Platform And API Foundation Specification

## Purpose

Define the cross-cutting API, security, validation, Redis, eventing, notification, and cron behavior shared by all Sapphire Stay capabilities.

## Requirements

### Requirement: Versioned REST API

The system SHALL expose backend REST endpoints under the global prefix `/api` and URI version `/v1`.

#### Scenario: Versioned endpoint URL

- **GIVEN** a controller path `auth`
- **WHEN** the app is configured
- **THEN** the runtime route SHALL be served under `/api/v1/auth`.

#### Scenario: Swagger availability

- **GIVEN** the API runs outside production mode
- **WHEN** the Nest app boots
- **THEN** Swagger UI SHALL be available at `/api/docs`.

#### Scenario: Swagger disabled in production

- **GIVEN** `NODE_ENV=production`
- **WHEN** the Nest app boots
- **THEN** Swagger UI SHALL not be mounted to reduce serverless bundle/runtime overhead.

### Requirement: Global Validation And Error Envelope

The system SHALL validate DTO input globally, reject unknown fields, transform query/body values where class-transformer can do so, and return normalized error JSON.

#### Scenario: Unknown DTO field

- **GIVEN** a request body includes a property that is not declared in the target DTO
- **WHEN** the request reaches a DTO-validated endpoint
- **THEN** the API SHALL reject the request because `forbidNonWhitelisted` is enabled.

#### Scenario: Validation error response

- **GIVEN** a request fails validation or throws an HTTP exception
- **WHEN** the global exception filter handles it
- **THEN** the response SHALL contain `statusCode`, `timestamp`, `path`, and `message`.

#### Scenario: Unexpected server error

- **GIVEN** an unhandled non-HTTP exception occurs
- **WHEN** the global exception filter handles it
- **THEN** the response status SHALL be 500 and `message` SHALL be `Internal server error`.

### Requirement: Public And Authenticated Routes

The system SHALL require JWT authentication for all routes unless a route is explicitly marked public.

#### Scenario: Public endpoint

- **GIVEN** a handler has the public metadata marker
- **WHEN** a request omits `Authorization`
- **THEN** the JWT guard SHALL allow the request to continue.

#### Scenario: Protected endpoint without token

- **GIVEN** a handler is not public
- **WHEN** a request omits a valid bearer token
- **THEN** the API SHALL reject it with `Vui lòng đăng nhập`.

#### Scenario: Role protected endpoint

- **GIVEN** a route declares required roles
- **WHEN** an authenticated user has a role outside that set
- **THEN** the roles guard SHALL reject the request with `Bạn không có quyền thực hiện hành động này`.

### Requirement: Request Throttling

The system SHALL apply a global throttling policy of 100 requests per 60 seconds.

#### Scenario: Request volume exceeds limit

- **GIVEN** a client sends more than 100 requests within one throttling window
- **WHEN** throttling evaluates the request
- **THEN** the API SHALL reject excess requests according to Nest throttler behavior.

### Requirement: CORS Policy

The API SHALL allow CORS origins from `CORS_ORIGINS` and default to `http://localhost:3001`.

#### Scenario: Web app credentials

- **GIVEN** the frontend calls the API from an allowed origin
- **WHEN** it sends credentials, authorization, or session headers
- **THEN** the API SHALL allow credentials and the headers `Content-Type`, `Authorization`, `X-Requested-With`, and `x-session-id`.

### Requirement: Redis Adapter

The system SHALL use Upstash Redis REST when configured and an in-memory fallback when Upstash credentials are absent.

#### Scenario: Upstash configured

- **GIVEN** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- **WHEN** `RedisService` initializes
- **THEN** it SHALL use the Upstash Redis adapter.

#### Scenario: Local fallback

- **GIVEN** Upstash credentials are absent
- **WHEN** `RedisService` initializes
- **THEN** it SHALL use in-memory storage and log a development warning.

#### Scenario: Distributed lock

- **GIVEN** a lock key already exists and has not expired
- **WHEN** another caller invokes `setNx` with the same key
- **THEN** Redis SHALL return `false`.

#### Scenario: TTL expiry

- **GIVEN** a cached or lock key has a configured TTL
- **WHEN** the TTL elapses
- **THEN** subsequent `get`/`setNx` calls SHALL treat the key as absent.

### Requirement: Domain Event Bus

The system SHALL dispatch booking/payment domain events through an in-process event bus with isolated handler failures.

#### Scenario: Event has no handlers

- **GIVEN** an event is emitted with no registered handlers
- **WHEN** `EventsService.emit` runs
- **THEN** it SHALL log debug information and complete without throwing.

#### Scenario: Handler failure isolation

- **GIVEN** an event has multiple handlers
- **WHEN** one handler throws
- **THEN** the failure SHALL be logged and later handlers SHALL still run.

#### Scenario: Payment success saga

- **GIVEN** a `payment.success` event with a booking id
- **WHEN** booking event handlers receive it
- **THEN** the booking service SHALL confirm the booking if its status is `PENDING_PAYMENT` or `PAYING`.

#### Scenario: Payment failure saga

- **GIVEN** a `payment.failed` event with a booking id
- **WHEN** booking event handlers receive it
- **THEN** the booking service SHALL expire the booking if its status is `PENDING_PAYMENT` or `PAYING`.

### Requirement: Notification Persistence And Email Delivery

The system SHALL persist notification attempts and send email through Resend when configured.

#### Scenario: Notification type supported

- **GIVEN** a notification type among `booking.confirmed`, `booking.cancelled`, `booking.expired`, or `checkout.completed`
- **WHEN** the notification service sends it
- **THEN** it SHALL load the booking and customer, build localized template data, and create a `notifications` row.

#### Scenario: Resend not configured

- **GIVEN** `RESEND_API_KEY` is absent
- **WHEN** a notification is sent
- **THEN** the notification row SHALL be persisted and email delivery SHALL be skipped without failing the business transaction.

#### Scenario: Email send success

- **GIVEN** Resend is configured
- **WHEN** the email provider accepts the message
- **THEN** the notification row SHALL be updated with `sentAt` and `failed=false`.

#### Scenario: Email send failure

- **GIVEN** Resend is configured
- **WHEN** the provider call fails
- **THEN** the notification row SHALL be updated with `failed=true`, `failReason`, and incremented `retries`.

### Requirement: Cron Booking Expiration Endpoint

The system SHALL expose a public-but-secret-protected cron endpoint to expire stale unpaid bookings.

#### Scenario: Missing cron secret configuration

- **GIVEN** `CRON_SECRET` is not configured
- **WHEN** `/api/v1/internal/cron/expire-bookings` is called
- **THEN** the endpoint SHALL reject the request as unauthorized.

#### Scenario: Invalid cron bearer

- **GIVEN** `CRON_SECRET` is configured
- **WHEN** the request `Authorization` header is not exactly `Bearer <CRON_SECRET>`
- **THEN** the endpoint SHALL reject the request as unauthorized.

#### Scenario: Overlapping cron invocation

- **GIVEN** another expiration run holds the `cron:booking:expire` lock
- **WHEN** the cron endpoint is called
- **THEN** it SHALL return `{ skipped: true }`.

#### Scenario: Expire stale bookings

- **GIVEN** the cron lock is acquired
- **WHEN** there are bookings with status `PENDING_PAYMENT` and `paymentDeadline` before now
- **THEN** each booking SHALL be passed to `expireBooking`
- **AND** the endpoint SHALL return the number processed
- **AND** the lock SHALL be released after processing.
