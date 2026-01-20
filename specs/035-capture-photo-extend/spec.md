# Feature Specification: Capture Photo Extend

**Feature Branch**: `035-capture-photo-extend`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "Update CapturePhotoConfigPanel, capture-photo.schema, and CapturePhotoRenderer to support new aspect ratios 3:2 and 2:3, ensure renderer properly captures those ratios, and improve photo preview to render with all available space similar to camera view"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Creator Selects New Aspect Ratio (Priority: P1)

An experience creator configuring a photo capture step wants to select a 3:2 or 2:3 aspect ratio for their photo experience, in addition to the existing 1:1 (square) and 9:16 (portrait) options.

**Why this priority**: This is the core functionality request. Without the aspect ratio options being available in the configuration panel, guests cannot capture photos in the new formats.

**Independent Test**: Can be fully tested by opening the experience designer, adding a capture photo step, and verifying the new aspect ratio options (3:2 and 2:3) appear in the dropdown and can be selected and saved.

**Acceptance Scenarios**:

1. **Given** a creator is editing a capture photo step configuration, **When** they open the aspect ratio dropdown, **Then** they see four options: Square (1:1), Portrait (9:16), Landscape (3:2), and Tall Portrait (2:3)
2. **Given** a creator selects the 3:2 aspect ratio, **When** they save the experience, **Then** the configuration persists and shows 3:2 when reopened
3. **Given** a creator selects the 2:3 aspect ratio, **When** they save the experience, **Then** the configuration persists and shows 2:3 when reopened

---

### User Story 2 - Guest Captures Photo in 3:2 Landscape Ratio (Priority: P1)

A guest using a photo experience configured with 3:2 aspect ratio should see the camera view in landscape orientation and capture photos that match this ratio.

**Why this priority**: This ensures the new aspect ratio actually works end-to-end for the guest experience, which is the primary use case.

**Independent Test**: Can be fully tested by running an experience with 3:2 configured, verifying the camera preview displays in landscape format, capturing a photo, and confirming the resulting image has 3:2 proportions.

**Acceptance Scenarios**:

1. **Given** an experience is configured with 3:2 aspect ratio, **When** a guest enters the capture photo step, **Then** the camera view displays in landscape orientation (wider than tall)
2. **Given** a guest is viewing the camera in 3:2 mode, **When** they capture a photo, **Then** the captured image maintains the 3:2 aspect ratio
3. **Given** a guest has captured a photo in 3:2 mode, **When** they view the preview, **Then** the preview displays at the correct 3:2 proportions

---

### User Story 3 - Guest Captures Photo in 2:3 Tall Portrait Ratio (Priority: P1)

A guest using a photo experience configured with 2:3 aspect ratio should see the camera view in a taller portrait orientation and capture photos that match this ratio.

**Why this priority**: Ensures the second new aspect ratio works correctly for the guest experience.

**Independent Test**: Can be fully tested by running an experience with 2:3 configured, verifying the camera preview displays in tall portrait format, capturing a photo, and confirming the resulting image has 2:3 proportions.

**Acceptance Scenarios**:

1. **Given** an experience is configured with 2:3 aspect ratio, **When** a guest enters the capture photo step, **Then** the camera view displays in portrait orientation (taller than wide)
2. **Given** a guest is viewing the camera in 2:3 mode, **When** they capture a photo, **Then** the captured image maintains the 2:3 aspect ratio
3. **Given** a guest has captured a photo in 2:3 mode, **When** they view the preview, **Then** the preview displays at the correct 2:3 proportions

---

### User Story 4 - Photo Preview Uses Available Space (Priority: P2)

After capturing a photo, the preview screen should display the photo using all available space within the viewport, similar to how the camera view currently renders. Currently, the photo preview renders small with fixed dimensions.

**Why this priority**: This is a UX improvement that enhances the guest experience but is not blocking functionality. The feature works without this, just with suboptimal presentation.

**Independent Test**: Can be fully tested by capturing a photo in any aspect ratio and verifying the preview image fills the available container space while maintaining aspect ratio, rather than displaying at a small fixed size.

**Acceptance Scenarios**:

1. **Given** a guest has captured a photo, **When** the preview is displayed, **Then** the photo fills the available space in the container while maintaining its aspect ratio
2. **Given** a guest views a 1:1 photo preview on a tall device, **When** the preview renders, **Then** the photo scales to use maximum width while maintaining square proportions
3. **Given** a guest views a 9:16 photo preview, **When** the preview renders, **Then** the photo scales to use maximum height while maintaining portrait proportions
4. **Given** a guest views a 3:2 photo preview, **When** the preview renders, **Then** the photo scales to use maximum width while maintaining landscape proportions
5. **Given** a guest views a 2:3 photo preview, **When** the preview renders, **Then** the photo scales appropriately while maintaining tall portrait proportions

---

### Edge Cases

- What happens when the device screen is narrower than the landscape aspect ratio? The photo should scale down to fit within available width while maintaining aspect ratio.
- What happens when switching between aspect ratios in the editor? The camera preview should immediately reflect the new aspect ratio selection.
- How does the system handle uploaded photos (fallback) that don't match the configured aspect ratio? Uploaded photos should be cropped/fitted to the configured aspect ratio during processing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support four aspect ratio options: 1:1 (Square), 9:16 (Portrait), 3:2 (Landscape), and 2:3 (Tall Portrait)
- **FR-002**: The aspect ratio configuration panel MUST display all four options with clear labels indicating their orientation
- **FR-003**: The camera view component MUST render at the correct proportions for each aspect ratio
- **FR-004**: Captured photos MUST be saved with dimensions matching the configured aspect ratio
- **FR-005**: The photo preview component MUST render the captured photo using available space while maintaining aspect ratio (similar behavior to camera view)
- **FR-006**: The photo preview MUST NOT use fixed pixel dimensions (current: 256x256 for square, 176x320 for portrait)
- **FR-007**: All existing aspect ratio functionality (1:1 and 9:16) MUST continue to work unchanged

### Key Entities

- **AspectRatio**: Enumerated value representing the photo capture dimensions (1:1, 9:16, 3:2, 2:3)
- **CapturePhotoStepConfig**: Configuration object containing aspectRatio setting for a capture photo step

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience creators can select any of the four aspect ratios and the selection persists correctly
- **SC-002**: Guests see camera view at the correct proportions for the configured aspect ratio
- **SC-003**: Captured photos match the configured aspect ratio within standard tolerance
- **SC-004**: Photo preview displays at responsive size filling available space rather than fixed small dimensions
- **SC-005**: All four aspect ratios render correctly across common mobile device sizes (320px-428px width)

## Assumptions

- The camera capture library (used by CameraView component) already supports arbitrary aspect ratios
- The 3:2 ratio is commonly used for landscape/traditional photo format
- The 2:3 ratio is the inverse of 3:2, providing a taller portrait option between 9:16 and 1:1
- Photo preview should follow the same responsive sizing pattern established by the CameraView component
