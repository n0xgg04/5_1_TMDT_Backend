# Identity And Access Specification

## Purpose

Define customer registration/login, JWT token lifecycle, profile management, password changes, staff account management, account locking, and role-based access.

## Requirements

### Requirement: Customer Registration

The system SHALL allow a new customer to register with email, strong password, first name, last name, and optional phone.

#### Scenario: Successful customer registration

- **GIVEN** no user exists with the submitted email
- **AND** the submitted password has at least 8 characters with lowercase, uppercase, number, and special character
- **WHEN** the customer submits registration data
- **THEN** the system SHALL hash the password with bcrypt cost 12
- **AND** create a user with default role `CUSTOMER`
- **AND** issue access and refresh tokens
- **AND** store a bcrypt hash of the refresh token on the user record.

#### Scenario: Duplicate registration email

- **GIVEN** a user already exists with the submitted email
- **WHEN** registration is submitted
- **THEN** the API SHALL reject the request with `Email đã được sử dụng`.

#### Scenario: Weak registration password

- **GIVEN** the password does not match the configured complexity rule
- **WHEN** registration validation runs
- **THEN** the API SHALL reject the request with a password complexity validation message.

### Requirement: Login

The system SHALL authenticate active users by email and password and issue a new token pair.

#### Scenario: Successful login

- **GIVEN** an active user exists for the email
- **AND** bcrypt verifies the submitted password
- **WHEN** login is submitted
- **THEN** the API SHALL return the user identity and a new access/refresh token pair
- **AND** replace the stored refresh token hash.

#### Scenario: Inactive user login

- **GIVEN** the user exists but `isActive=false`
- **WHEN** login is submitted
- **THEN** the API SHALL reject the request with `Email hoặc mật khẩu không đúng`.

#### Scenario: Invalid credentials

- **GIVEN** no user exists for the email or the password does not verify
- **WHEN** login is submitted
- **THEN** the API SHALL reject the request with `Email hoặc mật khẩu không đúng`.

### Requirement: JWT Token Lifecycle

The system SHALL issue short-lived access tokens and longer-lived refresh tokens signed with independent secrets.

#### Scenario: Token generation

- **GIVEN** a user id, email, and role
- **WHEN** tokens are generated
- **THEN** the access token SHALL include `sub`, `email`, and `role` and expire in 15 minutes
- **AND** the refresh token SHALL include the same payload and expire in 7 days.

#### Scenario: Successful refresh

- **GIVEN** a syntactically valid refresh token signed with `JWT_REFRESH_SECRET`
- **AND** the referenced user exists, is active, and has a stored refresh token hash
- **AND** bcrypt comparison succeeds
- **WHEN** `/auth/refresh` is called
- **THEN** the API SHALL issue a new token pair
- **AND** rotate the stored refresh token hash.

#### Scenario: Invalid refresh token

- **GIVEN** the refresh token is expired, signed with the wrong secret, does not match the stored hash, or belongs to an inactive/missing user
- **WHEN** refresh is requested
- **THEN** the API SHALL reject the request with `Refresh token không hợp lệ hoặc đã hết hạn`.

#### Scenario: Logout

- **GIVEN** an authenticated user
- **WHEN** `/auth/logout` is called
- **THEN** the system SHALL set the user's stored refresh token to null
- **AND** return `Đăng xuất thành công`.

### Requirement: Authenticated Profile

The system SHALL allow authenticated users to retrieve and update their own profile.

#### Scenario: Get current auth profile

- **GIVEN** a valid access token
- **WHEN** `/auth/me` is called
- **THEN** the API SHALL return id, email, first name, last name, phone, role, and creation timestamp.

#### Scenario: Update current auth profile

- **GIVEN** a valid access token
- **WHEN** `/auth/me` is patched with first name, last name, or phone
- **THEN** the API SHALL update only the submitted profile fields
- **AND** return the updated identity.

#### Scenario: Change password via auth endpoint

- **GIVEN** a valid access token
- **AND** the submitted current password verifies
- **AND** the new password satisfies complexity rules
- **WHEN** `/auth/change-password` is patched
- **THEN** the system SHALL hash the new password with bcrypt cost 12
- **AND** return `Đổi mật khẩu thành công`.

#### Scenario: Wrong current password

- **GIVEN** the submitted current password does not verify
- **WHEN** password change is requested
- **THEN** the API SHALL reject the request with `Mật khẩu hiện tại không đúng`.

### Requirement: User Profile Endpoint

The system SHALL also expose `/users/me` for authenticated profile retrieval and combined profile/password update.

#### Scenario: Get current user profile

- **GIVEN** an authenticated user
- **WHEN** `/users/me` is called
- **THEN** the API SHALL return id, email, first name, last name, phone, role, active state, and creation timestamp.

#### Scenario: Update profile without password

- **GIVEN** an authenticated user
- **WHEN** `/users/me` is patched without `newPassword`
- **THEN** the system SHALL update submitted profile fields and leave password unchanged.

#### Scenario: Update profile with password

- **GIVEN** an authenticated user patches `/users/me` with `newPassword`
- **WHEN** `currentPassword` is absent
- **THEN** the API SHALL reject the request with `Vui lòng cung cấp mật khẩu hiện tại`.

#### Scenario: Update profile with verified password

- **GIVEN** an authenticated user patches `/users/me` with `currentPassword` and `newPassword`
- **AND** the current password verifies
- **WHEN** validation passes
- **THEN** the system SHALL hash and store the new password together with submitted profile changes.

### Requirement: Admin User Listing

The system SHALL allow admins to list users with optional role filtering and pagination.

#### Scenario: List users as admin

- **GIVEN** an authenticated admin
- **WHEN** `/users?page=1&limit=20` is called
- **THEN** the API SHALL return users ordered by newest first
- **AND** include id, email, first name, last name, role, active state, and creation timestamp
- **AND** return pagination metadata `items`, `total`, `page`, and `limit`.

#### Scenario: Filter users by role

- **GIVEN** an authenticated admin
- **WHEN** `/users?role=RECEPTIONIST` is called
- **THEN** only users with role `RECEPTIONIST` SHALL be returned.

#### Scenario: Non-admin lists users

- **GIVEN** an authenticated non-admin
- **WHEN** `/users` is called
- **THEN** the API SHALL reject the request through role authorization.

### Requirement: Staff Account Creation

The system SHALL allow admins to create staff/admin accounts but not customer accounts through the staff creation endpoint.

#### Scenario: Create receptionist

- **GIVEN** an authenticated admin
- **AND** no user exists with the submitted email
- **AND** the submitted role is `RECEPTIONIST`, `HOUSEKEEPING`, or `ADMIN`
- **WHEN** `/users/staff` is posted
- **THEN** the system SHALL hash the password with bcrypt cost 12
- **AND** create the account
- **AND** return identity fields without password hash.

#### Scenario: Duplicate staff email

- **GIVEN** a user already exists with the submitted email
- **WHEN** an admin creates staff
- **THEN** the API SHALL reject the request with `Email đã được sử dụng`.

#### Scenario: Invalid staff role

- **GIVEN** the submitted role is not `RECEPTIONIST`, `HOUSEKEEPING`, or `ADMIN`
- **WHEN** an admin creates staff
- **THEN** the API SHALL reject the request with `Vai trò không hợp lệ`.

### Requirement: Account Locking

The system SHALL allow admins to toggle another user's active state and SHALL prevent self-locking.

#### Scenario: Toggle user lock

- **GIVEN** an authenticated admin
- **AND** the target user exists
- **WHEN** `/users/:id/toggle-lock` is patched
- **THEN** the system SHALL invert the target user's `isActive` value
- **AND** return id, email, and new active state.

#### Scenario: Admin attempts self-lock

- **GIVEN** an authenticated admin
- **WHEN** the admin targets their own user id for lock toggle
- **THEN** the API SHALL reject the request with `Không thể tự khóa tài khoản của mình`.

#### Scenario: Locked account access

- **GIVEN** an account has `isActive=false`
- **WHEN** the user attempts login or refresh
- **THEN** the system SHALL reject authentication.

### Requirement: Frontend Auth Persistence

The web app SHALL persist auth state and refresh expired access tokens.

#### Scenario: Store token pair

- **GIVEN** login or registration succeeds
- **WHEN** the web auth store receives user and tokens
- **THEN** it SHALL store `accessToken`, `refreshToken`, and `hotel-auth` state in local storage.

#### Scenario: Authenticated API request

- **GIVEN** `accessToken` exists in browser storage
- **WHEN** the axios API client sends a request
- **THEN** it SHALL add `Authorization: Bearer <accessToken>`.

#### Scenario: Access token expired

- **GIVEN** an API request returns 401
- **AND** `refreshToken` exists
- **WHEN** the axios response interceptor handles the response
- **THEN** it SHALL call `/auth/refresh`, save the new token pair, and retry the original request once.

#### Scenario: Refresh failure

- **GIVEN** refresh fails or no refresh token exists
- **WHEN** the axios response interceptor handles 401
- **THEN** it SHALL clear local auth state and redirect to `/login`.
