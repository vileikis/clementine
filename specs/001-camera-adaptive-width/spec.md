# Feature Specification: Camera Adaptive Width

**Feature Branch**: `001-camera-adaptive-width`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "Make camera capture UI look intentional on any device and aspect ratio, while keeping controls always accessible. Applies to Camera Active, Photo Review, and Upload Progress states."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Camera Active Responsive Layout (Priority: P1)

As a guest using the photo experience on any device, I want the camera preview to fit nicely within my screen while keeping capture controls always visible and accessible, so that I can take photos without UI elements overlapping or being cut off.

**Why this priority**: This is the core user interaction - guests must be able to see their camera preview and access capture controls regardless of device. Without this, the photo capture experience is broken.

**Independent Test**: Can be fully tested by opening the camera capture step on various devices (mobile portrait, mobile landscape, tablet, desktop) and verifying the camera preview fits within the preview zone while controls remain visible and usable.

**Acceptance Scenarios**:

1. **Given** a guest opens the camera on a tall phone (e.g., iPhone 14 Pro) with a 1:1 aspect ratio experience, **When** the camera view loads, **Then** the camera preview displays centered with black bars (letterboxing) above and below, and the capture controls are visible at the bottom without overlapping the preview.

2. **Given** a guest opens the camera on a wide device with a 9:16 aspect ratio experience, **When** the camera view loads, **Then** the camera preview displays centered with black bars on left and right (pillarboxing), and controls remain pinned at the bottom.

3. **Given** a guest on a small-screen device, **When** the camera is active, **Then** the controls zone never overlaps the camera preview (strict two-zone layout is enforced).

4. **Given** a guest on any iOS device, **When** viewing the camera controls, **Then** the controls have proper safe-area bottom padding to avoid the home indicator.

---

### User Story 2 - Photo Review Consistent Framing (Priority: P2)

As a guest who has just captured a photo, I want the photo review screen to display my captured image in a clean layout that maintains the same framing as the capture preview, so I can make an informed decision about whether to retake or continue.

**Why this priority**: After capture, users need to review their photo. Inconsistent framing between capture and review creates confusion about what was actually captured.

**Independent Test**: Can be fully tested by capturing a photo and comparing the preview framing between capture and review states - the visible framing should match.

**Acceptance Scenarios**:

1. **Given** a guest has captured a photo, **When** viewing the photo review screen, **Then** the photo is displayed with aspect-ratio-preserving contain behavior (no distortion or unexpected cropping).

2. **Given** a guest is on the photo review screen, **When** comparing to the camera active state, **Then** the preview zone maintains consistent sizing and the media never stretches.

3. **Given** a guest is on the photo review screen, **When** viewing the layout, **Then** there is no black rounded container styling (cleaner appearance than capture state), but consistent padding/margins maintain alignment.

4. **Given** a guest is on the photo review screen, **When** looking at the controls, **Then** the Retake and Continue buttons are pinned at the bottom and remain accessible.

---

### User Story 3 - Upload Progress Feedback (Priority: P3)

As a guest who has confirmed their photo, I want to see my photo with clear upload progress indication while it saves, so I know the system is working and I should wait.

**Why this priority**: Upload feedback provides reassurance during a potentially slow network operation. While important, it's after the primary capture and review interactions.

**Independent Test**: Can be fully tested by confirming a photo and observing the upload progress overlay displays correctly over the photo preview.

**Acceptance Scenarios**:

1. **Given** a guest has confirmed their photo, **When** the upload begins, **Then** the photo is displayed with a semi-transparent overlay and loading spinner.

2. **Given** a guest is viewing upload progress, **When** looking at the layout, **Then** the photo maintains its aspect ratio and uses responsive sizing.

---

### Edge Cases

- What happens when the device orientation changes during camera capture? (Layout should recompute and maintain proper aspect ratio fitting)
- How does the system handle very narrow or very wide screen aspect ratios? (Camera preview uses contain behavior, showing black bars as needed)
- What happens when safe-area insets are not available? (Controls should still render with reasonable default padding)
- What happens when camera permission is denied? (Show friendly state in camera container with CTA to open settings, maintaining the same container styling)
- What happens while camera is initializing? (Show skeleton/loader inside container with black background and rounded corners)

## Requirements *(mandatory)*

### Functional Requirements

**Layout Structure**:
- **FR-001**: Screen MUST be divided into exactly two vertical zones: Preview Zone (flexible, fills remaining space) and Controls Zone (fixed height, pinned to bottom).
- **FR-002**: Controls Zone MUST have safe-area bottom padding on iOS devices to avoid the home indicator.
- **FR-003**: Controls Zone height MUST be consistent across Camera Active and Photo Review states.
- **FR-004**: Controls MUST never overlap the Preview Zone.

**Camera Active State**:
- **FR-005**: Camera Container MUST have full width, take remaining height, rounded corners, and black background.
- **FR-006**: Camera View MUST fit inside the Camera Container while preserving the target aspect ratio (contain behavior).
- **FR-007**: Camera View MUST be centered within the Camera Container.
- **FR-008**: Extra space around the Camera View (due to aspect ratio mismatch) MUST display as black bars (letterboxing/pillarboxing).
- **FR-009**: System MUST support target aspect ratios: 1:1, 2:3, 3:2, 9:16.
- **FR-010**: Camera controls (library, shutter, flip camera) MUST remain in a consistent bar position regardless of preview orientation.
- **FR-011**: When camera permission is denied, system MUST show a friendly state inside the Camera Container with a CTA to open device settings.
- **FR-012**: While camera is initializing, system MUST show a skeleton/loader inside the Camera Container (maintaining black background and rounded corners).

**Photo Review State**:
- **FR-013**: Preview Zone MUST show captured media without the camera container styling (no black rounded box).
- **FR-014**: Media preview MUST use aspect-ratio-preserving contain behavior (no distortion).
- **FR-015**: Preview Zone MUST have consistent padding/margins to maintain visual alignment with capture state.
- **FR-016**: Controls Zone MUST display Retake and Submit buttons.

**Upload Progress State**:
- **FR-017**: Photo preview MUST maintain aspect ratio during upload progress display.
- **FR-018**: Upload overlay MUST not distort the photo preview.

### Key Entities

- **Preview Zone**: The flexible upper portion of the screen that contains either the camera preview (active state) or captured media (review/upload states). Adapts to available space.
- **Controls Zone**: The fixed-height lower portion of the screen containing action buttons. Safe-area aware and consistent height across states.
- **Camera Container**: A styled wrapper (black background, rounded corners) that holds the camera view during active capture. Only present in Camera Active state.
- **Camera View**: The actual camera feed, fitted to the target aspect ratio using contain behavior.
- **Target Aspect Ratio**: The desired aspect ratio for the captured media (1:1, 2:3, 3:2, or 9:16), derived from experience configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On tall screens with 1:1 target ratio, black bars appear above and below the camera preview (letterboxing visible).
- **SC-002**: On wide screens with 9:16 target ratio, black bars appear on left and right of the camera preview (pillarboxing visible).
- **SC-003**: Controls remain pinned and fully usable on all tested device sizes (no overlap with preview, no cutoff).
- **SC-004**: Photo review layout appears cleaner than camera active (no black rounded container visible) while maintaining visual alignment.
- **SC-005**: Media never stretches or distorts in any state (capture, review, upload).
- **SC-006**: Layout adapts correctly when device orientation changes without visual glitches.
- **SC-007**: Framing consistency: the visible preview area in Photo Review matches what was shown during Camera Active (users see the same framing).

## Assumptions

- Experience configuration provides the target aspect ratio; the layout adapts to the configured ratio rather than detecting device aspect ratio.
- The CameraView component already supports receiving an aspectRatio prop and can be styled to fit within a container.
- Safe-area insets are available via standard CSS (env(safe-area-inset-bottom)) or the platform provides equivalent APIs.
- The existing controls (library picker, shutter button, camera switch) do not need visual redesign - only their container layout needs adjustment.
