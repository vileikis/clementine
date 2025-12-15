# Feature Specification: Event Outro & Share Configuration

**Feature Branch**: `028-outro-screen`
**Created**: 2025-12-15
**Status**: Draft
**Input**: User description: "PRD for Event Outro & Share Configuration feature"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Outro Message (Priority: P1)

As an event organizer, I want to configure the end-of-experience message that guests see after completing an AI photo experience, so that I can provide a branded, customized conclusion to their journey.

**Why this priority**: This is the core value proposition - giving event creators control over the end-user experience that was previously missing. Without this, the feature delivers no value.

**Independent Test**: Can be fully tested by configuring outro fields (title, description, CTA) and verifying they appear correctly in the preview. Delivers immediate value to event creators.

**Acceptance Scenarios**:

1. **Given** an event exists, **When** the organizer navigates to the Outro & Share settings, **Then** they see a form with title, description, CTA label, and CTA URL fields
2. **Given** the organizer enters values for title and description, **When** they view the preview, **Then** the preview displays the entered text in real-time
3. **Given** the organizer configures a CTA with label and URL, **When** they save and preview, **Then** the CTA button appears with the specified label
4. **Given** all outro fields are left empty, **When** the guest completes an experience, **Then** the outro screen still renders showing only the result and share options

---

### User Story 2 - Configure Sharing Options (Priority: P2)

As an event organizer, I want to control which sharing options are available to guests, so that I can align the sharing behavior with my brand guidelines and campaign goals.

**Why this priority**: Sharing controls are essential for brand compliance and campaign management. This builds on P1 by adding the sharing dimension to the outro screen.

**Independent Test**: Can be fully tested by toggling share options (download, system share, email, social platforms) and verifying only enabled options appear in preview.

**Acceptance Scenarios**:

1. **Given** an event exists, **When** the organizer views sharing settings, **Then** they see toggles for download, system share, and email options
2. **Given** the organizer disables the download option, **When** the guest views the outro screen, **Then** the download button is not displayed
3. **Given** the organizer enables specific social platforms, **When** the guest views the outro screen, **Then** only the selected social share buttons appear
4. **Given** all sharing options are disabled, **When** the guest completes the experience, **Then** the outro screen shows only the result and any configured CTA

---

### User Story 3 - Live Preview with Theme (Priority: P3)

As an event organizer, I want to see a live preview of the outro screen that reflects my event's theme, so that I can verify the end-user experience matches my brand before going live.

**Why this priority**: Preview functionality enhances confidence and reduces errors, but the configuration features (P1, P2) must work first. This provides quality assurance on top of the core functionality.

**Independent Test**: Can be fully tested by changing form values and theme settings, then verifying the preview updates in real-time with correct styling.

**Acceptance Scenarios**:

1. **Given** the organizer is on the Outro & Share page, **When** they view the preview, **Then** the preview displays the current event theme (colors, typography, backgrounds)
2. **Given** the organizer changes any outro field, **When** they look at the preview, **Then** the preview updates immediately without page refresh
3. **Given** the preview panel is displayed, **When** the organizer views it, **Then** a placeholder image is shown in place of the actual generated asset

---

### Edge Cases

- What happens when the CTA URL is invalid? System validates URL format and shows an inline error if invalid.
- What happens when a very long title or description is entered? Text is truncated with ellipsis or scrollable within the preview to prevent layout breaking.
- How does the system handle when the organizer enables zero sharing options? The share section is hidden from guests, showing only the result and CTA.
- What happens when the event theme has not been configured? Outro screen uses default theme styling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an event-level configuration page for outro settings, separate from the Experience editor
- **FR-002**: System MUST allow organizers to configure optional outro fields: title, description, CTA label, and CTA URL
- **FR-003**: System MUST allow organizers to toggle sharing options: download, system share, and email
- **FR-004**: System MUST allow organizers to select which social platforms are available for sharing
- **FR-005**: System MUST display a live preview of the outro screen that updates in real-time as fields change
- **FR-006**: System MUST apply the current event theme to the outro preview
- **FR-007**: System MUST use a placeholder image in the preview instead of requiring a real generated asset
- **FR-008**: System MUST persist outro and share configuration when the organizer saves or navigates away (autosave)
- **FR-009**: Guest-facing outro screen MUST only display sharing options that are enabled in configuration
- **FR-010**: Guest-facing outro screen MUST render with result and share options even when outro text fields are empty
- **FR-011**: System MUST validate CTA URL format when provided (must be a valid URL)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Outro configuration page MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Share option toggles and buttons MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography in forms and preview MUST be readable on mobile (≥14px for body text)
- **MFR-004**: Preview panel MUST be viewable on mobile (consider stacked layout vs side-by-side on larger screens)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All outro and share configuration inputs MUST be validated with Zod schemas
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: CTA URL MUST be validated as a proper URL format when provided
- **TSR-004**: Social platforms selection MUST use a typed enum/union for platform values

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Outro and share configuration write operations MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time preview updates MUST use form state (no Firebase reads required for preview)
- **FAR-003**: Zod schemas for outro/share options MUST be feature-local in `features/events/schemas/`
- **FAR-004**: Event model MUST be extended to include EventOutro and EventShareOptions fields

### Key Entities

- **EventOutro**: Configuration for the end-of-experience message. Contains optional title, description, CTA label, and CTA URL. Stored as part of the Event document.
- **EventShareOptions**: Controls available sharing actions for guests. Contains boolean flags for download, system share, email, and a list of enabled social platforms. Stored as part of the Event document.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can configure and preview the outro screen in under 2 minutes
- **SC-002**: Preview updates reflect form changes within 100ms (perceived as instant)
- **SC-003**: Outro configuration experience matches the quality and pattern of the existing Welcome configuration
- **SC-004**: 100% of sharing permissions are explicit and event-scoped (no hidden defaults)
- **SC-005**: Guests see only the sharing options that the organizer has explicitly enabled
- **SC-006**: Configuration page is fully functional on mobile devices without horizontal scrolling

## Assumptions

- The event theming system is already implemented and functional (can be applied to preview)
- The existing autosave pattern (useAutoSave hook) is available and working
- The preview shell infrastructure exists and can be reused
- Social platform options include common platforms (e.g., Facebook, Twitter/X, LinkedIn, Instagram) - exact list follows platform standards
- Guest-facing outro component will be implemented following the established pattern in `features/guest/`
