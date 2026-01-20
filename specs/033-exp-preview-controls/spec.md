# Feature Specification: Experience Preview Controls

**Feature Branch**: `033-exp-preview-controls`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "Refactor ExperiencePreviewModal to reuse FullscreenOverlay from preview-shell shared module instead of implementing fullscreen logic independently. Add viewport switching (mobile/desktop) capability consistent with other preview components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview Experience in Fullscreen Mode (Priority: P1)

As an experience designer, I want to preview my experience in a fullscreen overlay so I can see exactly how guests will experience it without distractions from the designer interface.

**Why this priority**: Core functionality that enables designers to test their experience flow. Without fullscreen preview, designers cannot validate the guest experience.

**Independent Test**: Can be fully tested by opening the experience preview modal and verifying it displays in fullscreen with a close button. Delivers the core preview capability.

**Acceptance Scenarios**:

1. **Given** an experience with at least one step configured, **When** the designer clicks the preview button, **Then** a fullscreen overlay opens displaying the experience runtime content with a header showing "Preview" title and a close button
2. **Given** an open experience preview, **When** the designer clicks the close button, **Then** the fullscreen overlay closes and the designer returns to the experience editor
3. **Given** an open experience preview, **When** the designer presses the Escape key, **Then** the fullscreen overlay closes and the designer returns to the experience editor

---

### User Story 2 - Switch Between Mobile and Desktop Viewport (Priority: P1)

As an experience designer, I want to switch between mobile and desktop viewport modes while previewing so I can verify the experience looks correct on different device sizes.

**Why this priority**: Essential for responsive design validation. Experiences must work well on both mobile (primary guest device) and desktop, and designers need to verify both.

**Independent Test**: Can be tested by opening preview and clicking the viewport switcher to toggle between mobile/desktop views. Each mode should show appropriately sized content.

**Acceptance Scenarios**:

1. **Given** an open experience preview, **When** the designer views the preview header, **Then** they see a viewport switcher control with mobile and desktop options
2. **Given** an open experience preview in desktop mode, **When** the designer clicks the mobile viewport option, **Then** the preview content is displayed within a mobile-sized frame (centered in the viewport)
3. **Given** an open experience preview in mobile mode, **When** the designer clicks the desktop viewport option, **Then** the preview content expands to fill the available viewport space
4. **Given** the preview starts with mobile mode selected, **When** the designer reopens the preview after closing, **Then** the viewport mode persists from the previous session

---

### User Story 3 - Consistent Preview Experience Across Editors (Priority: P2)

As an experience designer, I want the experience preview to work consistently with other preview components (Welcome, Theme, Share editors) so I have a familiar and predictable editing experience across the platform.

**Why this priority**: Improves usability and reduces cognitive load. Consistency in UI patterns helps designers work faster and reduces confusion.

**Independent Test**: Can be tested by comparing the experience preview controls with Welcome/Theme/Share editor previews and verifying the same viewport switcher UI and behavior.

**Acceptance Scenarios**:

1. **Given** the experience preview modal, **When** compared to the Share editor preview fullscreen, **Then** both use the same FullscreenOverlay component with identical header layout and controls
2. **Given** the experience preview viewport switcher, **When** compared to other editor viewport switchers, **Then** both display the same mobile/desktop toggle icons and interaction patterns

---

### Edge Cases

- What happens when the preview is opened with no steps configured?
  - Display a message indicating no steps to preview with an option to close
- What happens if session creation fails when opening preview?
  - Display an error message with a close button; do not show broken preview content
- What happens when switching viewport mode during an active experience session?
  - The content should resize smoothly; the session state should be preserved
- What happens on very small screens where mobile frame might not fit?
  - The mobile frame should still render; users can scroll if needed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reuse the `FullscreenOverlay` component from `@/shared/preview-shell` instead of implementing custom fullscreen modal logic in ExperiencePreviewModal
- **FR-002**: System MUST display a viewport switcher in the preview header allowing toggle between mobile and desktop modes
- **FR-003**: System MUST wrap preview content appropriately based on viewport mode:
  - Mobile mode: content displayed within a mobile device frame, centered in the viewport
  - Desktop mode: content fills the available viewport space
- **FR-004**: System MUST persist viewport mode selection across preview sessions (using existing viewport store)
- **FR-005**: System MUST maintain existing functionality: session creation, step execution, completion toast, error handling
- **FR-006**: System MUST handle Escape key to close the preview overlay
- **FR-007**: System MUST display loading state while session is being created
- **FR-008**: System MUST display error state if session creation fails
- **FR-009**: System MUST display empty state if no steps are configured
- **FR-010**: System MUST apply the experience theme to preview content using ThemeProvider

### Key Entities

- **ViewportMode**: Represents the current preview size mode (mobile or desktop)
- **FullscreenOverlay**: Shared component providing fullscreen modal with header, close button, and optional viewport switcher
- **ExperiencePreviewModal**: Container component that orchestrates preview session and renders runtime content
- **Session**: Runtime session object tracking the guest's progress through experience steps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience preview uses the same `FullscreenOverlay` component as other editor previews (code reuse achieved)
- **SC-002**: Designers can switch between mobile and desktop viewport modes within the preview
- **SC-003**: Viewport mode selection persists across preview open/close cycles within the same browser session
- **SC-004**: All existing preview functionality (session creation, step execution, completion feedback) continues to work
- **SC-005**: Preview UI pattern is consistent with Welcome, Theme, and Share editor previews
