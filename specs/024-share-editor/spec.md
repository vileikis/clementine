# Feature Specification: Share Screen Editor

**Feature Branch**: `024-share-editor`
**Created**: 2026-01-13
**Status**: Draft
**Input**: User description: "Epic E4: Share Screen Editor - Enable admins to configure the share screen that appears at the end of the guest experience flow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Share Screen Content (Priority: P1)

As an admin configuring an event, I want to customize the share screen title and description so that guests see personalized messaging when their experience result is ready.

**Why this priority**: The share screen is the final touchpoint of the guest experience. Customizing the messaging allows brands to reinforce their identity and provide context-appropriate copy for each event.

**Independent Test**: Can be fully tested by accessing the Share tab in the event designer, entering a custom title and description, and verifying the preview updates to show the configured content.

**Acceptance Scenarios**:

1. **Given** an admin is on the Share tab in the event designer, **When** they enter a title in the title field, **Then** the share screen preview displays the entered title immediately
2. **Given** an admin has entered a title, **When** they clear the title field, **Then** the share screen preview hides the title area
3. **Given** an admin is configuring the share screen, **When** they enter a description, **Then** the share screen preview displays the description below the title
4. **Given** an admin has entered a description, **When** they clear the description field, **Then** the share screen preview hides the description area

---

### User Story 2 - Configure Share Options (Priority: P2)

As an admin, I want to enable or disable specific sharing options (download, copy link, social platforms) so that guests can share their results through channels appropriate for my event.

**Why this priority**: Share options are the primary actions guests take on the share screen. Controlling which options appear allows admins to tailor the sharing experience to their audience and marketing strategy.

**Independent Test**: Can be fully tested by toggling share options in the config panel and verifying only enabled options appear in the share screen preview.

**Acceptance Scenarios**:

1. **Given** an admin is on the Share tab, **When** they enable the Download option, **Then** the download icon appears in the share screen preview footer
2. **Given** an admin has multiple share options enabled, **When** they disable Facebook sharing, **Then** the Facebook icon disappears from the share screen preview
3. **Given** an admin is configuring share options, **When** they enable Twitter sharing, **Then** the Twitter icon appears in the share screen preview
4. **Given** a new event is created, **When** the admin views share options, **Then** Download and Copy Link are enabled by default, and all social options are disabled by default

---

### User Story 3 - Configure Call to Action Button (Priority: P3)

As an admin, I want to add a custom call-to-action button with a label and URL so that guests can be directed to a relevant external page (e.g., product page, signup form, event website) after viewing their result.

**Why this priority**: The CTA button drives post-experience engagement and conversions. While not essential for the core share functionality, it provides significant business value by directing guests to marketing goals.

**Independent Test**: Can be fully tested by entering a CTA label and URL, then verifying the CTA button appears in the preview and the URL is saved correctly.

**Acceptance Scenarios**:

1. **Given** an admin is on the Share tab, **When** they enter a label in the CTA label field, **Then** a CTA button with that label appears in the share screen preview
2. **Given** an admin has entered a CTA label, **When** they enter a valid URL in the CTA URL field, **Then** the URL is saved as the CTA destination
3. **Given** an admin has configured a CTA label, **When** they clear the label field, **Then** the CTA button is hidden from the share screen preview
4. **Given** an admin enters a CTA label without a URL, **When** they attempt to save, **Then** they are prompted to provide a URL
5. **Given** an admin enters an invalid URL format, **When** the URL field loses focus, **Then** a validation error is displayed

---

### User Story 4 - Preview Share Screen in Edit Mode (Priority: P4)

As an admin, I want to see a live preview of the share screen as I configure it so that I can visualize exactly what guests will see before publishing.

**Why this priority**: Visual feedback during configuration reduces errors and ensures admins can make informed design decisions. It complements the configuration functionality.

**Independent Test**: Can be fully tested by making changes in the config panel and observing that the preview updates immediately without page refresh.

**Acceptance Scenarios**:

1. **Given** an admin is on the Share tab, **When** the tab loads, **Then** a phone-frame preview of the share screen is displayed
2. **Given** the preview is showing, **When** the admin modifies any configuration field, **Then** the preview updates immediately to reflect the change
3. **Given** the preview is in edit mode, **When** viewing the result media area, **Then** a placeholder image is displayed (since no actual result exists in edit mode)
4. **Given** the share screen is configured, **When** viewing the preview, **Then** it shows a scrollable content zone (title, description, media) and a fixed footer zone (share icons, Start over button, CTA button if configured)

---

### Edge Cases

- What happens when an admin enters an extremely long description? The scrollable zone accommodates lengthy content while the footer remains fixed.
- How does the system handle an invalid CTA URL? The URL field validates on blur and prevents saving with an invalid format.
- What happens when all share options are disabled? The share options section in the preview shows no icons, but the Start over button always remains visible.
- What happens when the admin navigates away with unsaved changes? Changes auto-save to draft config.
- How does the system handle special characters in title/description? All text is properly escaped and rendered as-is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Share tab in the event designer navigation alongside Welcome, Theme, and Settings tabs
- **FR-002**: System MUST allow admins to configure a share screen title (text field, optional)
- **FR-003**: System MUST allow admins to configure a share screen description (textarea, optional)
- **FR-004**: System MUST allow admins to configure a CTA button with label and URL
- **FR-005**: System MUST hide the CTA button when the label field is empty
- **FR-006**: System MUST require a valid URL when a CTA label is provided
- **FR-007**: System MUST provide toggle controls for each share option: Download, Copy Link, Email, Facebook, Twitter, Instagram, LinkedIn, TikTok, Telegram
- **FR-008**: System MUST default Download and Copy Link to enabled for new events
- **FR-009**: System MUST default all social sharing options to disabled for new events
- **FR-010**: System MUST display a phone-frame preview of the share screen in edit mode
- **FR-011**: System MUST update the preview immediately when any configuration value changes
- **FR-012**: System MUST show a placeholder image in the preview for the result media area
- **FR-013**: System MUST display the preview with two zones: scrollable content (title, description, media) and fixed footer (share icons, buttons)
- **FR-014**: System MUST always show the "Start over" button in the fixed footer
- **FR-015**: System MUST auto-save configuration changes to draft config
- **FR-016**: System MUST update the event config schema to include a `share` field containing title, description, and cta properties
- **FR-017**: System MUST rename the existing `sharing` field to `shareOptions` in the event config schema
- **FR-018**: System MUST handle defaults for existing events that lack the new share configuration fields

### Key Entities *(include if feature involves data)*

- **Share Config**: Event-scoped configuration containing the share screen presentation (title, description) and CTA (label, url). One Share Config per event.
- **Share Options Config**: Event-scoped boolean flags for each sharing platform (download, copyLink, email, facebook, twitter, instagram, linkedin, tiktok, telegram). Controls which share buttons appear on the share screen.
- **Event Config**: Parent configuration object that contains both Share Config and Share Options Config. The share screen is event-scoped, meaning it applies to all experiences within an event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can configure all share screen fields (title, description, CTA, share options) and see changes reflected in the preview within 500ms of input
- **SC-002**: 100% of share screen configuration fields auto-save without explicit save action
- **SC-003**: Share screen preview accurately reflects all configured options with no visual discrepancies between edit mode preview and the final layout structure
- **SC-004**: Admins can complete full share screen configuration in under 2 minutes
- **SC-005**: Form validation prevents saving invalid configurations (e.g., CTA label without URL) with clear error messages

## Assumptions

- The existing event designer infrastructure (tabs, navigation, auto-save mechanism) is functional and can be extended with a new Share tab
- The phone-frame preview component pattern used in other tabs (e.g., Welcome) can be reused or adapted for the share screen preview
- The event config schema is extensible and supports adding new fields without breaking existing events
- Default values will be applied to existing events that lack the new share configuration fields via schema defaults
- The "Start over" button behavior will be implemented in a future epic (E8) - this epic only configures its visibility
- Actual sharing functionality (social API integrations, download, copy link) will be implemented in E8 - this epic only configures which options should appear
