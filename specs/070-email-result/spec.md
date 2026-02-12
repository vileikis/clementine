# Feature Specification: Email Result Delivery

**Feature Branch**: `070-email-result`
**Created**: 2026-02-12
**Status**: Draft
**Input**: Guests can optionally enter their email during the AI processing loading screen to receive their result via email once ready. Creators can configure this feature per project.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Receives Result by Email (Priority: P1)

A guest visits an AI photo experience link, uploads their photo, and while waiting for the AI transform to process, enters their email address on the loading screen. Once the AI result is ready, the system automatically sends an email containing a link to view and download their result. The guest can leave the page and still access their result later through the email.

**Why this priority**: This is the core value proposition — guests no longer lose access to their result if they navigate away from the loading screen. It directly solves the stated problem of result accessibility.

**Independent Test**: Can be fully tested by submitting a photo, entering an email on the loading screen, and verifying that an email with the result link arrives after processing completes.

**Acceptance Scenarios**:

1. **Given** a guest is on the loading screen while their AI transform is processing, **When** they enter a valid email address and submit the form, **Then** a success confirmation is displayed showing the email address they entered, and the form is replaced by the confirmation message.
2. **Given** a guest has submitted their email and the AI transform completes, **When** the result is ready, **Then** an email is sent to the guest containing a link to view and download their result.
3. **Given** a guest has submitted their email and the AI transform has already completed before submission, **When** the guest submits their email, **Then** the email is sent immediately rather than waiting for a trigger.
4. **Given** a guest has already received an email for a session, **When** the system processes the session again, **Then** no duplicate email is sent.

---

### User Story 2 - Loading Screen Visual Improvements (Priority: P2)

While the AI transform is processing, the guest sees an improved loading experience featuring a themed spinner (using the experience's primary color) and a live elapsed time counter that counts up from 0 seconds. This replaces the current image skeleton and gives guests visual feedback that progress is happening.

**Why this priority**: Improves guest confidence during the wait and provides the visual context in which the email capture form lives. Enhances overall UX but is not the core email delivery feature.

**Independent Test**: Can be tested by triggering an AI transform and verifying the loading screen displays a themed spinner and a live elapsed time counter that increments each second.

**Acceptance Scenarios**:

1. **Given** a guest is on the loading screen, **When** the AI transform is processing, **Then** a spinner styled with the experience's theme color is displayed instead of the image skeleton.
2. **Given** a guest is on the loading screen, **When** the screen first mounts, **Then** an elapsed time counter starts at "0s" and increments each second ("1s", "2s", "3s", ...).

---

### User Story 3 - Creator Configures Email Capture (Priority: P3)

An experience creator opens the Share Editor for their project, navigates to the Loading tab, and toggles the "Get result by email" feature on or off. When enabled, the creator can customize the heading text displayed above the email input. This configuration controls whether guests see the email capture form on the loading screen.

**Why this priority**: Gives creators control over the feature, but is secondary to the core guest-facing functionality. The feature can work with a default configuration if this UI is not yet built.

**Independent Test**: Can be tested by toggling the email capture setting in the Share Editor and verifying the loading screen shows or hides the email form accordingly.

**Acceptance Scenarios**:

1. **Given** a creator is on the Share Editor Loading tab, **When** they enable the email capture toggle, **Then** the email capture form becomes visible on the guest loading screen for that project.
2. **Given** a creator has email capture enabled, **When** they customize the heading text, **Then** the guest loading screen displays the custom heading above the email input.
3. **Given** a creator disables the email capture toggle, **When** a guest views the loading screen, **Then** no email capture form is shown.
4. **Given** a creator has not configured email capture (new project), **When** a guest views the loading screen, **Then** the email capture form is not shown (disabled by default).

---

### Edge Cases

- What happens when a guest enters an invalid email address? The form validates the input and shows an inline error; no submission occurs.
- What happens when the email delivery fails (e.g., SMTP error)? The system logs the failure internally. The guest is not notified of delivery failure since they have already left the loading screen. No retry is attempted in v1.
- What happens when a guest submits the form multiple times (e.g., double-click)? The form disables the submit button after the first submission and shows the confirmation message, preventing duplicate submissions.
- What happens when the loading screen unmounts before the guest finishes entering their email? The email is not saved — partial input is lost. The guest can still view their result on the result screen if they return.
- What happens when the system reaches its daily email sending limit? Emails beyond the limit fail silently. The system logs the failure. Guests are not impacted on the loading screen UI — they still see the confirmation message since the email is queued based on data, not immediate send status.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an email capture form on the guest loading screen when the creator has enabled the feature for that project.
- **FR-002**: System MUST validate guest email addresses on both the input form (client-side) and before storage (server-side schema validation).
- **FR-003**: System MUST store the guest's email address on the session record upon form submission.
- **FR-004**: System MUST send an email containing a link to the result when both a guest email exists and the AI transform result is ready.
- **FR-005**: System MUST prevent duplicate email sends for the same session by recording when an email was sent and checking this before sending.
- **FR-006**: System MUST send the email immediately if the guest submits their email after the AI result has already completed.
- **FR-007**: System MUST replace the email capture form with a confirmation message after successful submission, showing the email address entered.
- **FR-008**: System MUST display a themed spinner using the experience's primary color on the loading screen, replacing the current image skeleton.
- **FR-009**: System MUST display an elapsed time counter on the loading screen that starts at "0s" when the screen mounts and increments each second.
- **FR-010**: Creators MUST be able to enable or disable the email capture feature per project from the Share Editor Loading tab.
- **FR-011**: Creators MUST be able to customize the heading text displayed above the email input form (default: "Get your result by email").
- **FR-012**: System MUST treat guest email as personally identifiable information — stored only on the session record, not logged or exposed elsewhere.
- **FR-013**: System MUST send emails from the platform's designated sender address with proper authentication (SPF/DKIM).
- **FR-014**: System MUST limit email sending to one email per session.

### Key Entities

- **Session**: Represents a single guest interaction with an AI experience. Extended with guest email address and email-sent timestamp. One session produces one result and can trigger at most one email.
- **Email Capture Configuration**: Per-project settings controlling whether the email capture form appears on the loading screen and what heading text is displayed. Part of the project's share/loading configuration.
- **Result Email**: A transactional email sent to a guest containing a link to view/download their AI-transformed result. Sent exactly once per session when conditions are met.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests who enter their email receive their result email within 2 minutes of the AI transform completing.
- **SC-002**: No duplicate emails are sent for any single session.
- **SC-003**: 100% of valid email submissions result in the confirmation message being displayed to the guest.
- **SC-004**: The email capture form is only visible to guests when the creator has explicitly enabled it for the project.
- **SC-005**: The elapsed time counter on the loading screen updates every second with no visible lag or skipped increments.
- **SC-006**: Creators can configure email capture settings (toggle and heading) and see changes reflected on the guest loading screen without delays beyond normal page load.

## Assumptions

- The existing loading screen component can be extended to include the email form and new loading visuals without a full redesign.
- The platform's email sending account has proper DNS records (SPF, DKIM) configured for reliable delivery.
- The daily email volume for photobooth sessions is well within the 2,000 emails/day sending limit.
- Guests understand that submitting their email is optional and consent to receiving the result email by submitting the form.
- The result media URL included in the email remains accessible for a reasonable period (consistent with existing result link behavior).

## Non-Goals (v1)

- Email template builder or custom branding per project
- Email analytics (open rates, click rates)
- Bulk email or marketing campaigns
- Guest email collection for CRM purposes
- Email delivery status UI for creators
- Retry UI or automatic retry for failed email sends
- Email pre-fill across sessions (e.g., via localStorage or guest profiles)
