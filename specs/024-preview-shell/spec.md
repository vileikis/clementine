# Feature Specification: Preview Shell

**Feature Branch**: `024-preview-shell`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Create reusable preview-shell feature module for device preview capabilities"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Device Preview (Priority: P1)

As a content creator editing an experience, I want to see my content inside a device frame so that I can visualize how it will appear to guests on their mobile devices.

**Why this priority**: This is the core functionality - without device framing, the entire preview concept doesn't exist. Every other feature depends on having a container that displays content within device boundaries.

**Independent Test**: Can be fully tested by rendering any content inside the preview shell and verifying it appears within a mobile device frame with proper dimensions (375x667px).

**Acceptance Scenarios**:

1. **Given** a user is editing content, **When** they view the preview area, **Then** content is displayed inside a device frame with rounded corners resembling a mobile device
2. **Given** the preview shell is rendered, **When** no viewport mode is specified, **Then** the default mobile viewport (375x667px) is used
3. **Given** content that exceeds device frame dimensions, **When** displayed in the preview shell, **Then** content is contained within the frame with overflow handling

---

### User Story 2 - Viewport Switching (Priority: P2)

As a content creator, I want to switch between mobile and desktop preview modes so that I can see how my content adapts to different screen sizes.

**Why this priority**: Viewport switching provides significant value by letting creators verify responsive behavior, but the mobile-first approach means basic device preview (P1) is sufficient for MVP.

**Independent Test**: Can be fully tested by clicking viewport toggle buttons and verifying the device frame dimensions change accordingly (mobile: 375x667px, desktop: 900x600px).

**Acceptance Scenarios**:

1. **Given** the viewport switcher is enabled, **When** user clicks the Desktop button, **Then** the device frame changes to desktop dimensions (900x600px)
2. **Given** the viewport switcher is enabled, **When** user clicks the Mobile button, **Then** the device frame changes to mobile dimensions (375x667px)
3. **Given** a controlled viewport mode is provided, **When** the viewport changes externally, **Then** the preview shell updates to reflect the new mode
4. **Given** the viewport switcher is disabled via configuration, **When** the preview shell renders, **Then** no viewport toggle buttons are displayed

---

### User Story 3 - Fullscreen Preview Mode (Priority: P3)

As a content creator, I want to enter a fullscreen preview mode so that I can see an immersive, distraction-free view of my content.

**Why this priority**: Fullscreen is a nice-to-have enhancement that improves user experience but isn't essential for core preview functionality.

**Independent Test**: Can be fully tested by clicking a fullscreen button and verifying an overlay covers the entire viewport with the device frame centered.

**Acceptance Scenarios**:

1. **Given** fullscreen mode is enabled via configuration, **When** user clicks the fullscreen button, **Then** an overlay covers the entire screen with the device frame centered
2. **Given** user is in fullscreen mode, **When** user clicks the close (X) button, **Then** fullscreen mode exits and normal view is restored
3. **Given** user is in fullscreen mode with closeOnEscape enabled, **When** user presses the Escape key, **Then** fullscreen mode exits
4. **Given** user is in fullscreen mode, **When** viewport switcher is enabled, **Then** user can switch between mobile and desktop views within fullscreen

---

### User Story 4 - Theme Editor Integration (Priority: P4)

As a brand manager editing event themes, I want the same preview capabilities available in the theme editor so that I can see my theme applied to different viewport sizes and in fullscreen mode.

**Why this priority**: This extends the preview shell to additional use cases (theme editors) and depends on all previous functionality being complete.

**Independent Test**: Can be fully tested by opening the Event Theme Editor or Project Theme Editor and verifying viewport switching and fullscreen mode work with themed content.

**Acceptance Scenarios**:

1. **Given** a user is editing an event theme, **When** they view the preview panel, **Then** they see the theme preview inside a device frame with viewport switching capability
2. **Given** a user is editing a project theme, **When** they enable fullscreen preview, **Then** they see the themed content in an immersive fullscreen overlay
3. **Given** theme changes are made, **When** viewing in any viewport mode, **Then** the preview updates to reflect the theme changes in real-time

---

### Edge Cases

- What happens when the preview shell container is too small to display the device frame? Content should scale down proportionally or show a minimum viable preview.
- How does the system handle rapid viewport switching? Transitions should be smooth without layout flickering.
- What happens when fullscreen is triggered on a device that doesn't support CSS overlay positioning? Falls back to maximum available viewport size.
- How does the preview shell behave when children have their own scrolling? Device frame should contain scrolling within its boundaries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `PreviewShell` wrapper component that contains children within a device frame
- **FR-002**: System MUST support two viewport modes: mobile (375x667px) and desktop (900x600px)
- **FR-003**: System MUST render mobile viewport by default when no mode is specified
- **FR-004**: System MUST provide a `ViewportSwitcher` component with mobile/desktop toggle buttons
- **FR-005**: System MUST allow viewport switcher to be enabled/disabled via configuration prop
- **FR-006**: System MUST support both controlled and uncontrolled viewport state management
- **FR-007**: System MUST provide a `DeviceFrame` component that renders device chrome styling (rounded corners, device appearance)
- **FR-008**: System MUST provide a `FullscreenOverlay` component that covers the entire viewport with content centered
- **FR-009**: System MUST provide a `FullscreenTrigger` button component to enter fullscreen mode
- **FR-010**: System MUST support Escape key to exit fullscreen when `closeOnEscape` is enabled (default: true)
- **FR-011**: System MUST provide a visible close (X) button in fullscreen mode header
- **FR-012**: System MUST allow fullscreen mode to be enabled/disabled via configuration prop
- **FR-013**: System MUST provide viewport context for nested components to access current viewport state
- **FR-014**: System MUST maintain viewport selection when entering/exiting fullscreen mode
- **FR-015**: System MUST support custom header content in fullscreen overlay for title and additional controls
- **FR-016**: System MUST integrate with the `theming` module's `ThemedBackground` component for background styling
- **FR-017**: System MUST be applied to the Event Theme Editor replacing current `PreviewPanel`
- **FR-018**: System MUST be applied to the Project Theme Editor replacing current `PreviewPanel`

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Preview shell controls (viewport switcher, fullscreen button) MUST be accessible on mobile viewport (320px-768px)
- **MFR-002**: Viewport switcher buttons MUST meet minimum touch target size (44x44px)
- **MFR-003**: Fullscreen close button MUST meet minimum touch target size (44x44px)
- **MFR-004**: Preview shell MUST scale device frame appropriately when container width is less than device frame width

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All component props MUST have TypeScript interfaces with explicit types
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: ViewportMode type MUST be a string union ("mobile" | "desktop")
- **TSR-004**: ViewportDimensions type MUST define width and height as numbers

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Feature is client-side only - no Firebase operations required
- **FAR-002**: Any persisted viewport preferences (future) MUST use Admin SDK via Server Actions

### Key Entities

- **ViewportMode**: Enumeration of supported viewport sizes ("mobile" | "desktop")
- **ViewportDimensions**: Width and height specification for each viewport mode (mobile: 375x667, desktop: 900x600)
- **ViewportContext**: React context providing current viewport state (mode, dimensions, isFullscreen) to nested components

## Assumptions

- The `theming` module with `ThemedBackground` and `ThemeProvider` components is already implemented and available for use
- CSS overlay approach for fullscreen (using `fixed inset-0 z-50`) is sufficient; native Fullscreen API is not required
- Two viewport sizes (mobile/desktop) are sufficient for MVP; custom viewport dimensions are out of scope
- Keyboard handling for Escape key will use standard React event handlers or useEffect with document event listeners
- The preview shell header with controls is included by default rather than being a separate composable component

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any feature module can add device preview capabilities by wrapping content with `<PreviewShell>` in under 5 lines of code
- **SC-002**: Users can switch between mobile and desktop viewports with a single click
- **SC-003**: Users can enter and exit fullscreen mode within 1 second of interaction
- **SC-004**: Escape key exits fullscreen mode 100% of the time when enabled
- **SC-005**: Event Theme Editor and Project Theme Editor both display viewport switching and fullscreen capabilities
- **SC-006**: Zero breaking changes to existing Experience Editor functionality after migration
- **SC-007**: Preview shell renders correctly on viewports from 320px to 1920px wide
